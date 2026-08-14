-- Migration V8: Add contagem_dias_uteis to parametros_taxas
--
-- Auditoria SistemaFactoring.pdf: a regra de prazo exige suportar contagem em
-- dias corridos OU dias úteis, conforme configuração. O motor de cálculo
-- (CalendarService.calculateBusinessDays) já existia mas nunca era usado
-- porque não havia nenhum parâmetro configurável para selecionar o modo.
-- Default FALSE preserva o comportamento histórico (dias corridos) para
-- não alterar retroativamente operações já calculadas.
ALTER TABLE parametros_taxas
    ADD COLUMN IF NOT EXISTS contagem_dias_uteis BOOLEAN NOT NULL DEFAULT FALSE;
