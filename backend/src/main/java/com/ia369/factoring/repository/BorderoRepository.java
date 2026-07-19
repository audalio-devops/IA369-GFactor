package com.ia369.factoring.repository;

import com.ia369.factoring.model.Bordero;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface BorderoRepository extends JpaRepository<Bordero, Long> {
}
