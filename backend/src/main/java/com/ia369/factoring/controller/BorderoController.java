package com.ia369.factoring.controller;

import com.ia369.factoring.model.TarifaCustomizada;
import com.ia369.factoring.service.BorderoService;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.List;

@RestController
@RequestMapping("/api/bordero")
@CrossOrigin(origins = "*")
public class BorderoController {

    private final BorderoService borderoService;

    public BorderoController(BorderoService borderoService) {
        this.borderoService = borderoService;
    }

    @PostMapping("/generate")
    public ResponseEntity<byte[]> generateBordero(@RequestBody BorderoRequest request) {
        byte[] pdf = borderoService.generateBorderoPdf(
                request.items(),
                request.cnpjCedente(),
                request.taxaMensal(),
                request.advaloremPercent(),
                request.tarifaBoleto(),
                request.iofFixo(),
                request.iofDiario(),
                request.floatBancario(),
                request.contagemDiasUteis(),
                request.tarifasCustomizadas());

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_PDF);
        headers.setContentDispositionFormData("attachment", "bordero_" + System.currentTimeMillis() + ".pdf");

        return ResponseEntity.ok()
                .headers(headers)
                .body(pdf);
    }

    public record BorderoRequest(
            List<BorderoService.BorderoItemRequest> items,
            String cnpjCedente,
            BigDecimal taxaMensal,
            BigDecimal advaloremPercent,
            BigDecimal tarifaBoleto,
            BigDecimal iofFixo,
            BigDecimal iofDiario,
            int floatBancario,
            boolean contagemDiasUteis,
            List<TarifaCustomizada> tarifasCustomizadas) {
    }
}
