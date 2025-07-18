
DROP DATABASE IF EXISTS BDAT_FE_simulations;
-- Crear base de datos si no existe
CREATE DATABASE IF NOT EXISTS BDAT_FE_simulations;

-- Usar la base de datos
USE BDAT_FE_simulations;

-- Crear tabla 'simulation' si no existe
CREATE TABLE IF NOT EXISTS simulation (
  id INT NOT NULL AUTO_INCREMENT,
  sim_name VARCHAR(255) NOT NULL,
  n_transmitter INT NOT NULL,
  n_receiver INT NOT NULL,
  emitters_pitch FLOAT DEFAULT NULL,
  receivers_pitch FLOAT DEFAULT NULL,
  sensor_width FLOAT DEFAULT NULL,
  sensor_distance FLOAT DEFAULT NULL,
  sensor_edge_margin FLOAT DEFAULT NULL,
  typical_mesh_size FLOAT DEFAULT NULL,
  plate_thickness FLOAT DEFAULT NULL,
  plate_length FLOAT DEFAULT NULL,
  porosity DECIMAL(10,0) NOT NULL, 
  attenuation FLOAT DEFAULT NULL, 
  result_step_01 TEXT NULL,
  p_status TEXT NULL,
  start_datetime DATETIME DEFAULT NULL,
  finish_datetime DATETIME DEFAULT NULL,
  time TIME DEFAULT NULL,
  image LONGBLOB NULL,
  PRIMARY KEY (id)
);

-- Ejecutar consulta segura (retorna 0 filas si la tabla está vacía)
SELECT * FROM simulation;

-- Crear usuario si no existe (disponible desde MySQL 5.7.6+)
-- CREATE USER IF NOT EXISTS 'UserBDAT'@'localhost' IDENTIFIED BY 'BDATpassword';

-- -- Otorgar privilegios al usuario
-- GRANT ALL PRIVILEGES ON BDAT_FE_simulations.* TO 'UserBDAT'@'localhost';

-- -- Aplicar los cambios
-- FLUSH PRIVILEGES;