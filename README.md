# 🦴 Simulador de Oodas guiadas en hueso cortical – Interfaz web

Aplicación web que permite ejecutar y visualizar simulaciones de propagación de ondas guiadas en hueso cortical. Esta herramienta está diseñada para facilitar el uso de un código de simulación científico mediante una interfaz intuitiva y accesible desde el navegador.

---

## 📌 Descripción general

La plataforma se divide en dos partes:

### 🔹 Frontend (React)
- **Tecnologías**: React, Socket.IO-client, CSS moderno
- **Funcionalidades**:
  - Interfaz de usuario responsiva y moderna
  - Formularios para configuración de parámetros
  - Visualización en tiempo real del estado de simulación
  - Tablas interactivas para gestión de simulaciones
  - Comunicación en tiempo real vía WebSockets

### 🔹 Backend (Python/Flask)
- **Tecnologías**: Flask, Socket.IO, MySQL
- **Funcionalidades**:
  - API RESTful para manejo de simulaciones
  - Integración con scripts científicos
  - Procesamiento asíncrono de simulaciones
  - Gestión de estado y notificaciones
  - Manejo de errores y monitoreo

### 🔹 Base de Datos (MySQL)
- Almacenamiento estructurado de:
  - Parámetros de simulación
  - Resultados
  - Estado de ejecución y metadatos

## 🔄 Instalación y Despliegue

### Requisitos Previos
- Docker y Docker Compose
- Git

### Pasos para Instalación
1. **Clonar el repositorio:**
   ```bash
   git clone https://github.com/tu-usuario/BDATProject.git
   cd BDATProject
2. **Iniciar los servicios con Docker Compose:**
   ```bash  
   docker-compose up -d

3. **Acceder a la aplicación:**
   - Frontend: http://localhost:3002
   - API Backend: http://localhost:5000