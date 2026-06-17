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
  '$2b$10$aCvu87De0wTOOclfLRcPmOrrELOKsDWGrRTK3PSqPWTDN5K/t8I3a',
  (SELECT id FROM roles WHERE nombre = 'administrador')
) ON CONFLICT (nombre_usuario) DO NOTHING;