package com.ia369.factoring.service;

import com.ia369.factoring.model.EmpresaCedente;
import com.ia369.factoring.repository.CedenteRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class CedenteService {

    private final CedenteRepository repository;

    public List<EmpresaCedente> listarAtivos() {
        return repository.findByAtivoTrue();
    }

    public List<EmpresaCedente> listarTodos() {
        return repository.findAll();
    }

    public Optional<EmpresaCedente> buscarPorId(Long id) {
        return repository.findById(id)
                .filter(EmpresaCedente::isAtivo);
    }

    @Transactional
    public EmpresaCedente salvar(EmpresaCedente cedente) {
        return repository.save(cedente);
    }

    @Transactional
    public void excluirLogico(Long id) {
        repository.findById(id).ifPresent(cedente -> {
            cedente.setAtivo(false);
            repository.save(cedente);
        });
    }
}
