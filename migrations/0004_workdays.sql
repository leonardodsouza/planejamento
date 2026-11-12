-- Opção: não agendar etapas em sábados, domingos e feriados nacionais
ALTER TABLE users ADD COLUMN skip_non_workdays INTEGER NOT NULL DEFAULT 0;
