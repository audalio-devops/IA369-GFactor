package com.ia369.factoring.model;

import jakarta.persistence.*;
import lombok.Data;
import java.math.BigDecimal;

@Data
@Entity
@Table(name = "tarifas_customizadas")
public class TarifaCustomizada {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String nome;

    @Column(precision = 10, scale = 2, nullable = false)
    private BigDecimal valor;

    @Enumerated(EnumType.STRING)
    @Column(name = "tipo_cobranca", nullable = false)
    private TipoCobranca tipoCobranca;

    public enum TipoCobranca {
        BORDERÔ,
        NOTA_FISCAL,
        TITULO
    }
}
