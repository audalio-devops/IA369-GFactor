-- Extensão para geração de UUIDs, se necessário
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. CADASTROS BASE
CREATE TABLE empresas_cedentes (
    id BIGSERIAL PRIMARY KEY,
    razao_social VARCHAR(255) NOT NULL,
    cnpj VARCHAR(14) UNIQUE NOT NULL,
    taxa_padrao_desagio NUMERIC(18,6) NOT NULL,
    versao INT DEFAULT 0,
    ativo BOOLEAN DEFAULT TRUE NOT NULL
);

CREATE TABLE sacados (
    id BIGSERIAL PRIMARY KEY,
    razao_social VARCHAR(255) NOT NULL,
    cnpj_cpf VARCHAR(14) UNIQUE NOT NULL,
    limite_credito NUMERIC(18,4) NOT NULL,
    versao INT DEFAULT 0,
    ativo BOOLEAN DEFAULT TRUE NOT NULL
);

-- 2. CORE DE BORDERÔS
DO $$ BEGIN
    CREATE TYPE status_bordero AS ENUM ('GERADO', 'FINALIZADO', 'CANCELADO', 'SUBSTITUIDO');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

CREATE TABLE borderos (
    id BIGSERIAL PRIMARY KEY,
    numero_bordero VARCHAR(50) UNIQUE NOT NULL,
    cedente_id BIGINT NOT NULL,
    status status_bordero NOT NULL DEFAULT 'GERADO',
    valor_face_total NUMERIC(18,4) NOT NULL,
    desagio_total NUMERIC(18,4) NOT NULL,
    iof_total NUMERIC(18,4) NOT NULL,
    tarifas_total NUMERIC(18,4) NOT NULL,
    valor_liquido_total NUMERIC(18,4) NOT NULL,
    parent_bordero_id BIGINT REFERENCES borderos(id),
    data_criacao TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    versao INT DEFAULT 0,
    CONSTRAINT fk_bordero_cedente FOREIGN KEY (cedente_id) REFERENCES empresas_cedentes(id)
);

-- 3. CORE DE TÍTULOS / NOTAS FISCAIS
DO $$ BEGIN
    CREATE TYPE estado_titulo AS ENUM ('DISPONIVEL', 'EM_BORDERO', 'LIQUIDADO', 'VENCIDO', 'PROTESTADO');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

CREATE TABLE titulos (
    id BIGSERIAL PRIMARY KEY,
    chave_nfe VARCHAR(44) UNIQUE,
    numero_documento VARCHAR(50) NOT NULL,
    cedente_id BIGINT NOT NULL,
    sacado_id BIGINT NOT NULL,
    bordero_id BIGINT REFERENCES borderos(id),
    valor_face NUMERIC(18,4) NOT NULL,
    valor_liquido_alocado NUMERIC(18,4),
    data_emissao DATE NOT NULL,
    data_vencimento DATE NOT NULL,
    data_vencimento_ajustada DATE NOT NULL,
    estado estado_titulo NOT NULL DEFAULT 'DISPONIVEL',
    versao INT DEFAULT 0,
    CONSTRAINT fk_titulo_cedente FOREIGN KEY (cedente_id) REFERENCES empresas_cedentes(id),
    CONSTRAINT fk_titulo_sacado FOREIGN KEY (sacado_id) REFERENCES sacados(id)
);

-- 4. AUDITORIA IMUTÁVEL
CREATE TABLE auditoria_sistema (
    id BIGSERIAL PRIMARY KEY,
    usuario_username VARCHAR(100) NOT NULL,
    acao VARCHAR(100) NOT NULL,
    modulo VARCHAR(50) NOT NULL,
    id_entidade VARCHAR(50) NOT NULL,
    estado_anterior JSONB,
    estado_posterior JSONB,
    ip_endereco VARCHAR(45) NOT NULL,
    data_hora TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_titulo_chave_nfe ON titulos(chave_nfe);
CREATE INDEX IF NOT EXISTS idx_titulo_bordero ON titulos(bordero_id);
CREATE INDEX IF NOT EXISTS idx_bordero_status ON borderos(status);
CREATE INDEX IF NOT EXISTS idx_auditoria_entidade ON auditoria_sistema(modulo, id_entidade);
