INSERT INTO roles (nombre, descripcion) VALUES
('administrador', 'Acceso total al sistema'),
('mecanico', 'Gestión de diagnósticos y reparaciones'),
('recepcionista', 'Atención al cliente y registro de órdenes')
ON CONFLICT (nombre) DO NOTHING;

INSERT INTO usuarios (
  nombre_completo,
  nombre_usuario,
  correo,
  contrasena_hash,
  rol_id
) VALUES (
  'Administrador Principal',
  'admin',
  'admin@sigta.com',
  '$2b$10$L7Ym8vU0ZdfM597vFm7vO.N1jGv8yYv8u6rP6t8yXW3Z2u1r2u3v.',
  (SELECT id FROM roles WHERE nombre = 'administrador')
) ON CONFLICT (nombre_usuario) DO NOTHING;

SELECT 'Usuario admin creado:' as info;
SELECT id, nombre_usuario, correo, activo 
FROM usuarios 
WHERE nombre_usuario = 'admin';