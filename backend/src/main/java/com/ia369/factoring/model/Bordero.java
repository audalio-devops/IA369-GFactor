package com.ia369.factoring.model;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.math.BigDecimal;
import java.time.OffsetDateTime;

@Entity
@Table(name = "borderos")
@Data
@NoArgsConstructor
public class Bordero {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "numero_bordero", nullable = false, unique = true, length = 50)
    private String numeroBordero;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "cedente_id", nullable = false)
    private EmpresaCedente cedente;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private StatusBordero status = StatusBordero.GERADO;

    @Column(name = "valor_face_total", nullable = false, precision = 18, scale = 4)
    private BigDecimal valorFaceTotal;

    @Column(name = "desagio_total", nullable = false, precision = 18, scale = 4)
    private BigDecimal desagioTotal;

    @Column(name = "iof_total", nullable = false, precision = 18, scale = 4)
    private BigDecimal iofTotal;

    @Column(name = "tarifas_total", nullable = false, precision = 18, scale = 4)
    private BigDecimal tarifasTotal;

    @Column(name = "valor_liquido_total", nullable = false, precision = 18, scale = 4)
    private BigDecimal valorLiquidoTotal;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "parent_bordero_id")
    private Bordero parentBordero;

    @Column(name = "data_criacao", nullable = false, updatable = false)
    private OffsetDateTime dataCriacao = OffsetDateTime.now();

    @Version
    private Integer versao;
}
