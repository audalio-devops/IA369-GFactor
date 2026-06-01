package com.ia369.factoring.model;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.math.BigDecimal;

@Entity
@Table(name = "sacados")
@Data
@NoArgsConstructor
public class Sacado {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "razao_social", nullable = false)
    private String razaoSocial;

    @Column(name = "cnpj_cpf", nullable = false, unique = true, length = 14)
    private String cnpjCpf;

    @Column(name = "limite_credito", nullable = false, precision = 18, scale = 4)
    private BigDecimal limiteCredito;

    @Version
    private Integer versao;

    @Column(nullable = false)
    private boolean ativo = true;
}
