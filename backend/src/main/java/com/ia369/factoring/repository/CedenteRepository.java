package com.ia369.factoring.repository;

import com.ia369.factoring.model.EmpresaCedente;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface CedenteRepository extends JpaRepository<EmpresaCedente, Long> {
    List<EmpresaCedente> findByAtivoTrue();
}
