-- Migration Script: IA369 Factoring System
-- Module: Operational (Core)

-- 1. Table for Per-Cedent/Default Tax Parameters
CREATE TABLE IF NOT EXISTS parametros_taxas (
    id SERIAL PRIMARY KEY,
    cedente_id VARCHAR(100),
    taxa_mensal DECIMAL(10, 4) NOT NULL,
    advalorem_percent DECIMAL(10, 4) NOT NULL,
    tarifa_boleto DECIMAL(10, 2) NOT NULL,
    iof_fixo DECIMAL(10, 4) NOT NULL DEFAULT 0.0038,
    iof_diario DECIMAL(10, 6) NOT NULL DEFAULT 0.0000411,
    is_padrao BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. Table for Borderôs (Batch of titles)
CREATE TABLE IF NOT EXISTS borderos (
    id SERIAL PRIMARY KEY,
    cedente_id VARCHAR(100) NOT NULL,
    data_operacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    valor_total_face DECIMAL(18, 2),
    valor_total_liquido DECIMAL(18, 2),
    status VARCHAR(20) DEFAULT 'PENDENTE'
);

-- 3. Table for Titles (Invoices extracted from XML)
CREATE TABLE IF NOT EXISTS titulos (
    id SERIAL PRIMARY KEY,
    bordero_id INTEGER REFERENCES borderos(id),
    chave_acesso VARCHAR(44) UNIQUE NOT NULL,
    numero_nota VARCHAR(20),
    cnpj_emitente VARCHAR(14),
    cnpj_sacado VARCHAR(14),
    valor_face DECIMAL(18, 2) NOT NULL,
    data_vencimento DATE NOT NULL,
    prazo_dias INTEGER,
    valor_liquido DECIMAL(18, 2),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Initial Mock Data for System Defaults
INSERT INTO parametros_taxas (cedente_id, taxa_mensal, advalorem_percent, tarifa_boleto, is_padrao)
VALUES ('SYSTEM', 3.50, 0.50, 5.00, TRUE);
