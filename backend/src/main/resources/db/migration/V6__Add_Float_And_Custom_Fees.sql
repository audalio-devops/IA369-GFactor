-- Migration V6: Add float_bancario to parametros_taxas and create tarifas_customizadas

-- Issue #2/#3: Add float_bancario column (was defined in Java entity but missing from DB schema)
ALTER TABLE parametros_taxas
    ADD COLUMN IF NOT EXISTS float_bancario INTEGER NOT NULL DEFAULT 1;

-- Issue #4: Create tarifas_customizadas table (was defined in Java entity but never migrated)
CREATE TABLE IF NOT EXISTS tarifas_customizadas (
    id            BIGSERIAL    PRIMARY KEY,
    nome          VARCHAR(255) NOT NULL,
    valor         DECIMAL(10, 2) NOT NULL,
    tipo_cobranca VARCHAR(50)  NOT NULL
);
