package com.ia369.factoring.model;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;
import java.time.OffsetDateTime;
import com.fasterxml.jackson.databind.JsonNode;

@Entity
@Table(name = "auditoria_sistema")
@Data
@NoArgsConstructor
public class AuditoriaSistema {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "usuario_username", nullable = false, length = 100)
    private String usuarioUsername;

    @Column(nullable = false, length = 100)
    private String acao;

    @Column(nullable = false, length = 50)
    private String modulo;

    @Column(name = "id_entidade", nullable = false, length = 50)
    private String idEntidade;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "estado_anterior")
    private JsonNode estadoAnterior;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "estado_posterior")
    private JsonNode estadoPosterior;

    @Column(name = "ip_endereco", nullable = false, length = 45)
    private String ipEndereco;

    @Column(name = "data_hora", nullable = false, updatable = false)
    private OffsetDateTime dataHora = OffsetDateTime.now();
}
