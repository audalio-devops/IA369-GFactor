package com.ia369.factoring.controller;

import com.ia369.factoring.model.EmpresaCedente;
import com.ia369.factoring.service.CedenteService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/cedentes")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class CedenteController {

    private final CedenteService service;

    @GetMapping
    public List<EmpresaCedente> listar(@RequestParam(required = false, defaultValue = "false") boolean incluirInativos) {
        return incluirInativos ? service.listarTodos() : service.listarAtivos();
    }

    @GetMapping("/{id}")
    public ResponseEntity<EmpresaCedente> buscar(@PathVariable Long id) {
        return service.buscarPorId(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    public EmpresaCedente criar(@RequestBody EmpresaCedente cedente) {
        return service.salvar(cedente);
    }

    @PutMapping("/{id}")
    public ResponseEntity<EmpresaCedente> atualizar(@PathVariable Long id, @RequestBody EmpresaCedente cedente) {
        return service.buscarPorId(id)
                .map(existente -> {
                    cedente.setId(id);
                    return ResponseEntity.ok(service.salvar(cedente));
                })
                .orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> excluir(@PathVariable Long id) {
        service.excluirLogico(id);
        return ResponseEntity.noContent().build();
    }
}
