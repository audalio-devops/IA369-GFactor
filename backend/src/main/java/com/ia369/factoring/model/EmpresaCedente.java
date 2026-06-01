package com.ia369.factoring.model;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.math.BigDecimal;

@Entity
@Table(name = "empresas_cedentes")
@Data
@NoArgsConstructor
public class EmpresaCedente {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "razao_social", nullable = false)
    private String razao_social;

    @Column(nullable = false, unique = true, length = 14)
    private String cnpj;

    @Column(name = "taxa_padrao_desagio", nullable = false, precision = 18, scale = 6)
    private BigDecimal taxaPadraoDesagio;

    @Version
    private Integer versao;

    @Column(nullable = false)
    private boolean ativo = true;
}
