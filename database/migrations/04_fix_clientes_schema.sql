DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'clientes' AND column_name = 'primer_nombre'
    ) THEN
        ALTER TABLE clientes ADD COLUMN IF NOT EXISTS nombre varchar(150);
        ALTER TABLE clientes ADD COLUMN IF NOT EXISTS direccion varchar(255);
        ALTER TABLE clientes ADD COLUMN IF NOT EXISTS editado_por bigint REFERENCES usuarios(id);
        ALTER TABLE clientes ADD COLUMN IF NOT EXISTS fecha_edicion timestamptz;

        UPDATE clientes c SET
            nombre = trim(regexp_replace(
                concat_ws(' ', c.primer_nombre, c.segundo_nombre, c.primer_apellido, c.segundo_apellido),
                '\s+', ' ', 'g'
            ));

        UPDATE clientes c SET
            direccion = trim(both ', ' from concat_ws(', ', d.calle, d.colonia, d.ciudad))
        FROM direcciones d
        WHERE c.direccion_id = d.id;

        ALTER TABLE clientes ALTER COLUMN nombre SET NOT NULL;

        ALTER TABLE clientes DROP COLUMN dni;
        ALTER TABLE clientes DROP COLUMN primer_nombre;
        ALTER TABLE clientes DROP COLUMN segundo_nombre;
        ALTER TABLE clientes DROP COLUMN primer_apellido;
        ALTER TABLE clientes DROP COLUMN segundo_apellido;
        ALTER TABLE clientes DROP COLUMN direccion_id;
    END IF;
END $$;
