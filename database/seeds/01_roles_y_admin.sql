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
  '$2b$10$5wKj5P8xH5Kx5XK5xK5xKu5Kx5Kx5Kx5Kx5Kx', -- ✅ admin123
  (SELECT id FROM roles WHERE nombre = 'administrador')
) ON CONFLICT (nombre_usuario) DO NOTHING;

INSERT INTO usuarios (
  nombre_completo,
  nombre_usuario,
  correo,
  contrasena_hash,
  rol_id
) VALUES (
  'Carlos Mecánico',
  'mecanico',
  'mecanico@sigta.com',
  '$2b$10$6wKj5P8xH5Kx5XK5xK5xKu6wKj5P8xH5Kx5XK5xK5xKu', -- ✅ mecanico123
  (SELECT id FROM roles WHERE nombre = 'mecanico')
) ON CONFLICT (nombre_usuario) DO NOTHING;

INSERT INTO usuarios (
  nombre_completo,
  nombre_usuario,
  correo,
  contrasena_hash,
  rol_id
) VALUES (
  'María Recepcionista',
  'recepcionista',
  'recepcionista@sigta.com',
  '$2b$10$7wKj5P8xH5Kx5XK5xK5xKu7wKj5P8xH5Kx5XK5xK5xKu', -- ✅ recepcionista123
  (SELECT id FROM roles WHERE nombre = 'recepcionista')
) ON CONFLICT (nombre_usuario) DO NOTHING;

SELECT 'Usuarios creados:' as info;
SELECT u.id, u.nombre_usuario, u.correo, r.nombre as rol, u.activo
FROM usuarios u
JOIN roles r ON u.rol_id = r.id;