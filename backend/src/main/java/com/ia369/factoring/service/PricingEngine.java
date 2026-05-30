package com.ia369.factoring.service;

import org.springframework.stereotype.Service;
import java.math.BigDecimal;
import java.math.RoundingMode;

@Service
public class PricingEngine {

        private static final BigDecimal DAYS_IN_MONTH = new BigDecimal("30");
        private static final BigDecimal HUNDRED = new BigDecimal("100");

        private final CalendarService calendarService;

        public PricingEngine(CalendarService calendarService) {
                this.calendarService = calendarService;
        }

        /**
         * Calcula o valor líquido de uma operação de factoring com IOF e ajuste de
         * feriado.
         */
        public CalculationResult calculate(
                        BigDecimal valorFace,
                        java.time.LocalDate dataVencimento,
                        java.time.LocalDate dataOperacao,
                        BigDecimal taxaMensal,
                        BigDecimal advaloremPercent,
                        BigDecimal tarifaBoleto,
                        BigDecimal iofFixoRate,
                        BigDecimal iofDiarioRate,
                        int floatBancario,
                        java.util.List<com.ia369.factoring.model.TarifaCustomizada> tarifasCustomizadas) {

                if (dataVencimento == null || dataOperacao == null) {
                        return new CalculationResult(
                                        BigDecimal.ZERO, BigDecimal.ZERO, BigDecimal.ZERO, BigDecimal.ZERO,
                                        BigDecimal.ZERO, BigDecimal.ZERO, BigDecimal.ZERO, BigDecimal.ZERO, 0,
                                        java.time.LocalDate.now());
                }

                // 0. Cálculo das Tarifas Customizadas
                BigDecimal valorTarifasCustomizadas = BigDecimal.ZERO;
                if (tarifasCustomizadas != null) {
                        for (com.ia369.factoring.model.TarifaCustomizada t : tarifasCustomizadas) {
                                valorTarifasCustomizadas = valorTarifasCustomizadas.add(t.getValor());
                        }
                }

                // 1. Soma do Float ao Vencimento Original
                java.time.LocalDate vencimentoComFloat = dataVencimento.plusDays(floatBancario);

                // 2. Ajuste de Vencimento Final (Próximo dia útil)
                java.time.LocalDate vencimentoFinal = calendarService.nextBusinessDay(vencimentoComFloat);

                // 3. Cálculo de Prazo Total (Dias corridos entre operação e vencimento final)
                long prazoTotal = java.time.temporal.ChronoUnit.DAYS.between(dataOperacao, vencimentoFinal);

                // 3. Fator Diário: (TaxaMensal / 100) / 30
                BigDecimal fatorMensal = taxaMensal.divide(HUNDRED, 10, RoundingMode.HALF_EVEN);
                BigDecimal fatorDiario = fatorMensal.divide(DAYS_IN_MONTH, 10, RoundingMode.HALF_EVEN);

                // 4. Valor do Desconto
                BigDecimal valorDesconto = valorFace
                                .multiply(fatorDiario)
                                .multiply(new BigDecimal(prazoTotal))
                                .setScale(2, RoundingMode.HALF_EVEN);

                // 5. Valor Advalorem
                BigDecimal advaloremRate = advaloremPercent.divide(HUNDRED, 10, RoundingMode.HALF_EVEN);
                BigDecimal valorAdvalorem = valorFace
                                .multiply(advaloremRate)
                                .setScale(2, RoundingMode.HALF_EVEN);

                // 6. IOF Fixo: ValorFace * IOFFixoRate
                BigDecimal valorIofFixo = valorFace
                                .multiply(iofFixoRate)
                                .setScale(2, RoundingMode.HALF_EVEN);

                // 7. IOF Diário: ValorFace * IOFDiarioRate * PrazoTotal
                BigDecimal valorIofDiario = valorFace
                                .multiply(iofDiarioRate)
                                .multiply(new BigDecimal(prazoTotal))
                                .setScale(2, RoundingMode.HALF_EVEN);

                BigDecimal valorIofTotal = valorIofFixo.add(valorIofDiario);

                // 8. Valor Líquido: ValorFace - Desconto - Advalorem - IOF - Tarifa -
                // TarifasCustom
                BigDecimal valorLiquido = valorFace
                                .subtract(valorDesconto)
                                .subtract(valorAdvalorem)
                                .subtract(valorIofTotal)
                                .subtract(tarifaBoleto)
                                .subtract(valorTarifasCustomizadas)
                                .setScale(2, RoundingMode.HALF_EVEN);

                // 9. Custo Total (%): ((ValorFace - ValorLiquido) / ValorFace) * 100
                BigDecimal custoTotal = valorFace.subtract(valorLiquido)
                                .divide(valorFace, 4, RoundingMode.HALF_EVEN)
                                .multiply(HUNDRED)
                                .setScale(2, RoundingMode.HALF_EVEN);

                return new CalculationResult(
                                valorDesconto,
                                valorAdvalorem,
                                valorIofFixo,
                                valorIofDiario,
                                valorIofTotal,
                                valorTarifasCustomizadas,
                                valorLiquido,
                                custoTotal,
                                (int) prazoTotal,
                                vencimentoFinal);
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
                        java.time.LocalDate vencimentoAjustado) {
        }
}
