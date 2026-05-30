package com.ia369.factoring.controller;

import com.ia369.factoring.model.ParametrosTaxas;
import com.ia369.factoring.model.TarifaCustomizada;
import com.ia369.factoring.repository.ParametrosTaxasRepository;
import com.ia369.factoring.repository.TarifaCustomizadaRepository;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/settings")
@CrossOrigin(origins = "*")
public class ConfiguracoesController {

    private final ParametrosTaxasRepository parametrosTaxasRepository;
    private final TarifaCustomizadaRepository tarifaCustomizadaRepository;

    public ConfiguracoesController(ParametrosTaxasRepository parametrosTaxasRepository,
            TarifaCustomizadaRepository tarifaCustomizadaRepository) {
        this.parametrosTaxasRepository = parametrosTaxasRepository;
        this.tarifaCustomizadaRepository = tarifaCustomizadaRepository;
    }

    @GetMapping("/taxas")
    public ParametrosTaxas getTaxas() {
        return parametrosTaxasRepository.findAll().stream()
                .findFirst()
                .orElse(new ParametrosTaxas());
    }

    @PostMapping("/taxas")
    public ParametrosTaxas saveTaxas(@RequestBody ParametrosTaxas taxas) {
        // Find existing to update or save new
        ParametrosTaxas existing = parametrosTaxasRepository.findAll().stream().findFirst().orElse(null);
        if (existing != null) {
            taxas.setId(existing.getId());
        }
        taxas.setCedenteId("DEFAULT"); // Placeholder
        return parametrosTaxasRepository.save(taxas);
    }

    @GetMapping("/tarifas-custom")
    public List<TarifaCustomizada> getTarifasCustom() {
        return tarifaCustomizadaRepository.findAll();
    }

    @PostMapping("/tarifas-custom")
    public TarifaCustomizada saveTarifaCustom(@RequestBody TarifaCustomizada tarifa) {
        return tarifaCustomizadaRepository.save(tarifa);
    }

    @DeleteMapping("/tarifas-custom/{id}")
    public void deleteTarifaCustom(@PathVariable Long id) {
        tarifaCustomizadaRepository.deleteById(id);
    }
}
