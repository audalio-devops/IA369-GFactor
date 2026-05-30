package com.ia369.factoring.repository;

import com.ia369.factoring.model.TarifaCustomizada;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface TarifaCustomizadaRepository extends JpaRepository<TarifaCustomizada, Long> {
}
