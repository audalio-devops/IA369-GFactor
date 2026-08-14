package com.ia369.factoring.service;

import com.ia369.factoring.model.TarifaCustomizada;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;

/**
 * Regressão numérica para os bugs identificados na auditoria de
 * docs/SistemaFactoring.pdf:
 * 1) Duplicação de tarifas customizadas por título de um mesmo borderô.
 * 2) Ordem incorreta floating -> ajuste de dia útil (faltava o ajuste
 * inicial da data-base ANTES de somar o floating).
 */
class PricingEngineTest {

    private final CalendarService calendarService = new CalendarService();
    private final PricingEngine engine = new PricingEngine(calendarService);

    @Test
    void naoDeveDuplicarTarifaBorderoEntreMultiplosTitulos() {
        // Simula o rateio que o BorderoService agora faz: uma tarifa BORDERÔ de
        // R$150,00 dividida entre 3 títulos de mesmo valor de face deve resultar
        // em R$50,00 alocados a cada título — nunca R$150,00 em cada um.
        BigDecimal valorFace = new BigDecimal("10000.00");
        BigDecimal tarifaBorderoTotal = new BigDecimal("150.00");
        BigDecimal tarifaRateada = tarifaBorderoTotal.divide(new BigDecimal("3"), 2,
                java.math.RoundingMode.HALF_UP);

        LocalDate operacao = LocalDate.of(2026, 8, 13); // quinta-feira útil
        LocalDate vencimento = LocalDate.of(2026, 9, 12); // sábado

        PricingEngine.CalculationResult r1 = engine.calculate(
                valorFace, vencimento, operacao,
                new BigDecimal("3.0"), new BigDecimal("0.5"), new BigDecimal("5.00"),
                new BigDecimal("0.0038"), new BigDecimal("0.0000411"), 1, false, tarifaRateada);

        assertEquals(new BigDecimal("50.00"), r1.valorTarifasCustomizadas());

        BigDecimal somaAlocadaTotal = tarifaRateada.multiply(new BigDecimal("3"));
        assertEquals(tarifaBorderoTotal, somaAlocadaTotal,
                "A soma do rateio nos 3 títulos deve reconstituir exatamente a tarifa total do borderô, sem duplicação");
    }

    @Test
    void overloadDeSimulacaoAvulsaSomaListaDiretamenteSemRateio() {
        // O overload com List<TarifaCustomizada> só deve ser usado para simulação
        // de UM único título — aí somar a lista inteira é correto.
        TarifaCustomizada t1 = new TarifaCustomizada();
        t1.setValor(new BigDecimal("16.00"));
        TarifaCustomizada t2 = new TarifaCustomizada();
        t2.setValor(new BigDecimal("5.00"));

        PricingEngine.CalculationResult r = engine.calculate(
                new BigDecimal("10000.00"), LocalDate.of(2026, 9, 14), LocalDate.of(2026, 8, 13),
                new BigDecimal("3.0"), new BigDecimal("0.5"), new BigDecimal("5.00"),
                new BigDecimal("0.0038"), new BigDecimal("0.0000411"), 1, false,
                List.of(t1, t2));

        assertEquals(new BigDecimal("21.00"), r.valorTarifasCustomizadas());
    }

    @Test
    void floatingDeveSerAplicadoApenasDepoisDoAjusteParaDiaUtil() {
        // Vencimento cai num sábado (2026-08-15). Regra do PDF:
        // 1) ajusta p/ próximo dia útil -> segunda 2026-08-17 (data-base)
        // 2) soma floating de 1 dia -> terça 2026-08-18
        // 3) 18/08/2026 (terça) já é dia útil -> vencimento final = 18/08/2026
        //
        // Implementação antiga: Sábado(15) + float(1) = Domingo(16); depois
        // ajustava para o próximo dia útil = Segunda(17) — um dia ANTES do
        // correto, distorcendo prazo, deságio e IOF diário.
        LocalDate vencimento = LocalDate.of(2026, 8, 15); // sábado
        LocalDate operacao = LocalDate.of(2026, 8, 13);

        PricingEngine.CalculationResult r = engine.calculate(
                new BigDecimal("10000.00"), vencimento, operacao,
                new BigDecimal("3.0"), BigDecimal.ZERO, BigDecimal.ZERO,
                BigDecimal.ZERO, BigDecimal.ZERO, 1, false, BigDecimal.ZERO);

        assertEquals(LocalDate.of(2026, 8, 18), r.vencimentoAjustado());
    }

    @Test
    void contagemDeDiasUteisDeveUsarCalendarioDeDiasUteis() {
        LocalDate operacao = LocalDate.of(2026, 8, 13); // quinta
        LocalDate vencimento = LocalDate.of(2026, 8, 20); // quinta seguinte (dia útil)

        PricingEngine.CalculationResult corridos = engine.calculate(
                new BigDecimal("10000.00"), vencimento, operacao,
                new BigDecimal("3.0"), BigDecimal.ZERO, BigDecimal.ZERO,
                BigDecimal.ZERO, BigDecimal.ZERO, 0, false, BigDecimal.ZERO);
        PricingEngine.CalculationResult uteis = engine.calculate(
                new BigDecimal("10000.00"), vencimento, operacao,
                new BigDecimal("3.0"), BigDecimal.ZERO, BigDecimal.ZERO,
                BigDecimal.ZERO, BigDecimal.ZERO, 0, true, BigDecimal.ZERO);

        assertEquals(7, corridos.prazoEfetivo()); // 13/08 -> 20/08 = 7 dias corridos
        assertEquals(5, uteis.prazoEfetivo()); // exclui sábado 15 e domingo 16
    }
}
