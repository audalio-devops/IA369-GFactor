-- Migration V3: Add float_bancario and tarifas_customizadas table
ALTER TABLE parametros_taxas ADD COLUMN float_bancario INTEGER DEFAULT 1;

CREATE TABLE tarifas_customizadas (
    id SERIAL PRIMARY KEY,
    nome VARCHAR(255) NOT NULL,
    valor DECIMAL(10, 2) NOT NULL,
    tipo_cobranca VARCHAR(50) NOT NULL
);
