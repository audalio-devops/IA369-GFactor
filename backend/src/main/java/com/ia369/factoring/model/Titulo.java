package com.ia369.factoring.model;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.math.BigDecimal;
import java.time.LocalDate;

@Entity
@Table(name = "titulos")
@Data
@NoArgsConstructor
public class Titulo {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "chave_nfe", unique = true, length = 44)
    private String chaveNfe;

    @Column(name = "numero_documento", nullable = false, length = 50)
    private String numeroDocumento;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "cedente_id", nullable = false)
    private EmpresaCedente cedente;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "sacado_id", nullable = false)
    private Sacado sacado;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "bordero_id")
    private Bordero bordero;

    @Column(name = "valor_face", nullable = false, precision = 18, scale = 4)
    private BigDecimal valorFace;

    @Column(name = "valor_liquido_alocado", precision = 18, scale = 4)
    private BigDecimal valorLiquidoAlocado;

    @Column(name = "data_emissao", nullable = false)
    private LocalDate dataEmissao;

    @Column(name = "data_vencimento", nullable = false)
    private LocalDate dataVencimento;

    @Column(name = "data_vencimento_ajustada", nullable = false)
    private LocalDate dataVencimentoAjustada;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private EstadoTitulo estado = EstadoTitulo.DISPONIVEL;

    @Version
    private Integer versao;
}
