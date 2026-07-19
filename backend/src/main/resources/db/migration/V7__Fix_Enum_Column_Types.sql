-- Migration V7: Convert native PostgreSQL enum columns to VARCHAR for Hibernate 6 compatibility
-- Hibernate sends enum values as character varying; native enum types reject this without explicit CAST.
-- Converting to VARCHAR is simpler and more portable; application-level validation is preserved.

ALTER TABLE borderos
    ALTER COLUMN status TYPE VARCHAR(50) USING status::text;

ALTER TABLE titulos
    ALTER COLUMN estado TYPE VARCHAR(50) USING estado::text;
