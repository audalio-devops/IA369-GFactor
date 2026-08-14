package com.ia369.factoring.controller;

import com.ia369.factoring.service.PricingEngine;
import org.springframework.web.bind.annotation.*;
import java.math.BigDecimal;

@RestController
@RequestMapping("/api/pricing")
@CrossOrigin(origins = "*") // For development
public class PricingController {

    private final PricingEngine pricingEngine;

    public PricingController(PricingEngine pricingEngine) {
        this.pricingEngine = pricingEngine;
    }

    @PostMapping("/simulate")
    public PricingEngine.CalculationResult simulate(@RequestBody SimulationRequest request) {
        return pricingEngine.calculate(
                request.valorFace(),
                request.dataVencimento(),
                request.dataOperacao(),
                request.taxaMensal(),
                request.advaloremPercent(),
                request.tarifaBoleto(),
                request.iofFixo(),
                request.iofDiario(),
                request.floatBancario(),
                request.contagemDiasUteis(),
                request.tarifasCustomizadas());
    }

    public record SimulationRequest(
            BigDecimal valorFace,
            java.time.LocalDate dataVencimento,
            java.time.LocalDate dataOperacao,
            BigDecimal taxaMensal,
            BigDecimal advaloremPercent,
            BigDecimal tarifaBoleto,
            BigDecimal iofFixo,
            BigDecimal iofDiario,
            int floatBancario,
            boolean contagemDiasUteis,
            java.util.List<com.ia369.factoring.model.TarifaCustomizada> tarifasCustomizadas) {
    }
}
