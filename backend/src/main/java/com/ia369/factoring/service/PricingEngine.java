package com.ia369.factoring.service;

import org.springframework.stereotype.Service;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.List;

@Service
public class PricingEngine {

        private static final BigDecimal DAYS_IN_MONTH = new BigDecimal("30");
        private static final BigDecimal HUNDRED = new BigDecimal("100");

        // Arredondamento comercial (ABNT NBR 5891 / convenção bancária brasileira).
        // HALF_EVEN (bankers' rounding) diverge do resultado exibido por sistemas de
        // referência do mercado (ex.: WBA) em valores terminados em ,xx5.
        private static final RoundingMode MONEY_ROUNDING = RoundingMode.HALF_UP;

        private final CalendarService calendarService;

        public PricingEngine(CalendarService calendarService) {
                this.calendarService = calendarService;
        }

        /**
         * Calcula o valor líquido de uma única operação de factoring (um título).
         *
         * IMPORTANTE: {@code valorTarifasCustomizadasAlocadas} deve ser o valor JÁ
         * ALOCADO/RATEADO para este título específico — nunca a soma bruta de todas
         * as tarifas customizadas configuradas para o borderô. Aplicar a soma total
         * a cada título de um borderô com múltiplos títulos duplica a tarifa em
         * cada linha (ver {@link com.ia369.factoring.service.BorderoService}, que é
         * responsável por ratear corretamente cada tarifa conforme o seu
         * {@code tipoCobranca} — BORDERÔ, NOTA_FISCAL ou TITULO — antes de chamar
         * este método).
         */
        public CalculationResult calculate(
                        BigDecimal valorFace,
                        LocalDate dataVencimento,
                        LocalDate dataOperacao,
                        BigDecimal taxaMensal,
                        BigDecimal advaloremPercent,
                        BigDecimal tarifaBoleto,
                        BigDecimal iofFixoRate,
                        BigDecimal iofDiarioRate,
                        int floatBancario,
                        boolean contagemDiasUteis,
                        BigDecimal valorTarifasCustomizadasAlocadas) {

                if (dataVencimento == null || dataOperacao == null) {
                        return new CalculationResult(
                                        BigDecimal.ZERO, BigDecimal.ZERO, BigDecimal.ZERO, BigDecimal.ZERO,
                                        BigDecimal.ZERO, BigDecimal.ZERO, BigDecimal.ZERO, BigDecimal.ZERO, 0,
                                        LocalDate.now());
                }

                BigDecimal tarifasAlocadas = valorTarifasCustomizadasAlocadas != null
                                ? valorTarifasCustomizadasAlocadas
                                : BigDecimal.ZERO;

                // --- REGRA DE VENCIMENTO (data-base -> floating -> reajuste) ---
                //
                // 1. A data de vencimento informada NUNCA pode ser um dia não útil.
                //    Se cair em sábado, domingo ou feriado, ela é prorrogada para o
                //    próximo dia útil. Esse é o "vencimento-base".
                LocalDate vencimentoBase = calendarService.nextBusinessDay(dataVencimento);

                // 2. O floating bancário é somado DEPOIS do vencimento-base (nunca
                //    sobre a data bruta, ainda não ajustada).
                LocalDate vencimentoComFloat = vencimentoBase.plusDays(floatBancario);

                // 3. Se o floating empurrar a data para um dia não útil, ela é
                //    reajustada novamente para o próximo dia útil.
                LocalDate vencimentoFinal = calendarService.nextBusinessDay(vencimentoComFloat);

                // --- PRAZO: dias corridos OU dias úteis, conforme configuração ---
                long prazoTotal = contagemDiasUteis
                                ? calendarService.calculateBusinessDays(dataOperacao, vencimentoFinal)
                                : ChronoUnit.DAYS.between(dataOperacao, vencimentoFinal);

                // Fator diário: (TaxaMensal / 100) / 30 — proração linear (deságio "por
                // fora"), convenção padrão de factoring no Brasil. Não deve ser
                // confundida com taxa diária composta.
                BigDecimal fatorMensal = taxaMensal.divide(HUNDRED, 10, MONEY_ROUNDING);
                BigDecimal fatorDiario = fatorMensal.divide(DAYS_IN_MONTH, 10, MONEY_ROUNDING);

                // Deságio
                BigDecimal valorDesconto = valorFace
                                .multiply(fatorDiario)
                                .multiply(new BigDecimal(prazoTotal))
                                .setScale(2, MONEY_ROUNDING);

                // Ad valorem (sobre o valor de face, nunca sobre o líquido)
                BigDecimal advaloremRate = advaloremPercent.divide(HUNDRED, 10, MONEY_ROUNDING);
                BigDecimal valorAdvalorem = valorFace
                                .multiply(advaloremRate)
                                .setScale(2, MONEY_ROUNDING);

                // IOF fixo: ValorFace * IOFFixoRate (0,38% por padrão, Decreto 6.306/2007)
                BigDecimal valorIofFixo = valorFace
                                .multiply(iofFixoRate)
                                .setScale(2, MONEY_ROUNDING);

                // IOF diário: ValorFace * IOFDiarioRate * PrazoTotal
                BigDecimal valorIofDiario = valorFace
                                .multiply(iofDiarioRate)
                                .multiply(new BigDecimal(prazoTotal))
                                .setScale(2, MONEY_ROUNDING);

                BigDecimal valorIofTotal = valorIofFixo.add(valorIofDiario);

                // Valor líquido = Face - Deságio - Advalorem - IOF - TarifaBoleto -
                // TarifasCustomizadas JÁ RATEADAS para este título.
                BigDecimal valorLiquido = valorFace
                                .subtract(valorDesconto)
                                .subtract(valorAdvalorem)
                                .subtract(valorIofTotal)
                                .subtract(tarifaBoleto)
                                .subtract(tarifasAlocadas)
                                .setScale(2, MONEY_ROUNDING);

                // Custo Efetivo Total (%): ((Face - Líquido) / Face) * 100
                BigDecimal custoTotal = valorFace.signum() == 0
                                ? BigDecimal.ZERO
                                : valorFace.subtract(valorLiquido)
                                                .divide(valorFace, 4, MONEY_ROUNDING)
                                                .multiply(HUNDRED)
                                                .setScale(2, MONEY_ROUNDING);

                return new CalculationResult(
                                valorDesconto,
                                valorAdvalorem,
                                valorIofFixo,
                                valorIofDiario,
                                valorIofTotal,
                                tarifasAlocadas,
                                valorLiquido,
                                custoTotal,
                                (int) prazoTotal,
                                vencimentoFinal);
        }

        /**
         * Overload de conveniência para simulação avulsa de UM único título (ex.:
         * simulador standalone), onde não há risco de duplicação porque não existe
         * rateio entre múltiplos títulos de um mesmo borderô. Soma diretamente a
         * lista de tarifas customizadas informada.
         *
         * NUNCA usar este overload a partir de um fluxo que processa múltiplos
         * títulos de um mesmo borderô — nesse caso use
         * {@link BorderoService}, que calcula o rateio correto por
         * {@code tipoCobranca} e chama o overload acima com o valor já alocado.
         */
        public CalculationResult calculate(
                        BigDecimal valorFace,
                        LocalDate dataVencimento,
                        LocalDate dataOperacao,
                        BigDecimal taxaMensal,
                        BigDecimal advaloremPercent,
                        BigDecimal tarifaBoleto,
                        BigDecimal iofFixoRate,
                        BigDecimal iofDiarioRate,
                        int floatBancario,
                        boolean contagemDiasUteis,
                        List<com.ia369.factoring.model.TarifaCustomizada> tarifasCustomizadas) {

                BigDecimal somaTarifas = BigDecimal.ZERO;
                if (tarifasCustomizadas != null) {
                        for (com.ia369.factoring.model.TarifaCustomizada t : tarifasCustomizadas) {
                                somaTarifas = somaTarifas.add(t.getValor());
                        }
                }

                return calculate(valorFace, dataVencimento, dataOperacao, taxaMensal, advaloremPercent,
                                tarifaBoleto, iofFixoRate, iofDiarioRate, floatBancario, contagemDiasUteis,
                                somaTarifas);
        }

        public record CalculationResult(
                        BigDecimal valorDesconto,
                        BigDecimal valorAdvalorem,
                        BigDecimal valorIofFixo,
                        BigDecimal valorIofDiario,
                        BigDecimal valorIofTotal,
                        BigDecimal valorTarifasCustomizadas,
                        BigDecimal valorLiquido,
                        BigDecimal custoTotalPercent,
                        int prazoEfetivo,
                        LocalDate vencimentoAjustado) {
        }
}
