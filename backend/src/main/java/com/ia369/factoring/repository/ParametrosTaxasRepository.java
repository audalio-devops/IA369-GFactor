package com.ia369.factoring.repository;

import com.ia369.factoring.model.ParametrosTaxas;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;

public interface ParametrosTaxasRepository extends JpaRepository<ParametrosTaxas, Long> {
    Optional<ParametrosTaxas> findByCedenteId(String cedenteId);

    Optional<ParametrosTaxas> findByPadraoTrue();
}
