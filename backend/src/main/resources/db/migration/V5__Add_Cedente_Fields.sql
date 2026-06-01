-- Migration V5: Add new fields to empresas_cedentes
ALTER TABLE empresas_cedentes 
ADD COLUMN faturamento_anual DECIMAL(18,2),
ADD COLUMN endereco_completo VARCHAR(500),
ADD COLUMN contato_nome VARCHAR(200),
ADD COLUMN contato_telefone_fixo VARCHAR(20),
ADD COLUMN contato_celular VARCHAR(20),
ADD COLUMN contato_email VARCHAR(200);
