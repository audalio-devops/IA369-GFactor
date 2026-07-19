package com.ia369.factoring.repository;

import com.ia369.factoring.model.Bordero;
import com.ia369.factoring.model.Titulo;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface TituloRepository extends JpaRepository<Titulo, Long> {
    List<Titulo> findByBordero(Bordero bordero);
}
