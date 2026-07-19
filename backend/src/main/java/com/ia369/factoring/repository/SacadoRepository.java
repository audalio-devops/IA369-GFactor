package com.ia369.factoring.repository;

import com.ia369.factoring.model.Sacado;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.Optional;

@Repository
public interface SacadoRepository extends JpaRepository<Sacado, Long> {
    Optional<Sacado> findByRazaoSocial(String razaoSocial);

    Optional<Sacado> findByCnpjCpf(String cnpjCpf);
}
