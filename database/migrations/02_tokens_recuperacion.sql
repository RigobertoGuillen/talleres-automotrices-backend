CREATE TABLE IF NOT EXISTS tokens_recuperacion (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  email varchar(150) NOT NULL,
  token varchar(255) NOT NULL UNIQUE,
  expires_at timestamptz NOT NULL,
  used boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_tokens_recuperacion_token ON tokens_recuperacion(token);
CREATE INDEX idx_tokens_recuperacion_email ON tokens_recuperacion(email);