package com.ia369.factoring.model;

import jakarta.persistence.*;
import lombok.Data;
import java.math.BigDecimal;

@Data
@Entity
@Table(name = "parametros_taxas")
public class ParametrosTaxas {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "cedente_id", nullable = false)
    private String cedenteId; // Mocked or real ID for the client

    @Column(name = "taxa_mensal", precision = 10, scale = 4)
    private BigDecimal taxaMensal;

    @Column(name = "advalorem_percent", precision = 10, scale = 4)
    private BigDecimal advaloremPercent;

    @Column(name = "tarifa_boleto", precision = 10, scale = 2)
    private BigDecimal tarifaBoleto;

    @Column(name = "iof_fixo", precision = 10, scale = 4)
    private BigDecimal iofFixo = new BigDecimal("0.0038");

    @Column(name = "iof_diario", precision = 10, scale = 6)
    private BigDecimal iofDiario = new BigDecimal("0.0000411");

    @Column(name = "is_padrao")
    private boolean padrao = false;

    @Column(name = "float_bancario")
    private Integer floatBancario = 1;

    // false = dias corridos (padrão histórico); true = dias úteis.
    @Column(name = "contagem_dias_uteis")
    private boolean contagemDiasUteis = false;
}
