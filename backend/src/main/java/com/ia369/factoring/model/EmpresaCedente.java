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

    @Column(name = "faturamento_anual", precision = 18, scale = 2)
    private BigDecimal faturamentoAnual;

    @Column(name = "endereco_completo", length = 500)
    private String enderecoCompleto;

    @Column(name = "contato_nome", length = 200)
    private String contatoNome;

    @Column(name = "contato_telefone_fixo", length = 20)
    private String contatoTelefoneFixo;

    @Column(name = "contato_celular", length = 20)
    private String contatoCelular;

    @Column(name = "contato_email", length = 200)
    private String contatoEmail;

    @Version
    private Integer versao;

    @Column(nullable = false)
    private boolean ativo = true;
}
