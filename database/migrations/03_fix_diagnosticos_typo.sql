DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'diagnosticos' AND column_name = 'decripcion_falla'
    ) THEN
        ALTER TABLE diagnosticos RENAME COLUMN decripcion_falla TO descripcion_falla;
    END IF;
END $$;
