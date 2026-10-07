# BDAT — Bone Guided Wave Analysis Tool

BDAT es una aplicación para configurar, ejecutar y analizar simulaciones numéricas de propagación de ondas ultrasónicas guiadas en hueso cortical. Su interfaz permite trabajar con modelos óseos multicapa, organizar simulaciones en una cola y revisar sus resultados sin tener que operar directamente el motor científico.

## Qué puedes hacer con BDAT

- Configurar modelos y parámetros de simulación, incluidos los modelos multicapa y la porosidad del material.
- Crear simulaciones individuales o importar lotes para procesarlos.
- Consultar el estado y el avance de los trabajos mientras se ejecutan.
- Administrar la cola de simulaciones: pausar, reanudar o cancelar trabajos.
- Revisar resultados con gráficos y visualizaciones, y descargar los archivos disponibles.

BDAT está pensado para investigación y análisis computacional. Los resultados dependen de los parámetros y modelos que se introduzcan; la aplicación no sustituye la validación científica de los datos.

## Cómo instalar y usar la aplicación de escritorio

La aplicación de escritorio se distribuye para **Windows x64**. Descarga el instalador más reciente desde [Releases de BDAT](https://github.com/DiegoSpinnoza/BDAT/releases/latest). Para usarla necesitas:

- Windows 10 u 11 de 64 bits.
- Docker Desktop instalado, con el motor de contenedores iniciado y WSL 2 habilitado.

No necesitas instalar Git, Node.js ni Python para usar el instalador.

1. Ejecuta `BDAT-Setup-1.0.0.exe` y completa el asistente de instalación.
2. Abre **BDAT** desde el acceso directo del escritorio o desde el menú Inicio.
3. En el primer inicio, BDAT comprueba e inicia Docker Desktop y prepara los servicios de la aplicación. La descarga y construcción inicial de las imágenes puede tardar varios minutos y requiere conexión a Internet.
4. Cuando la aplicación termine de iniciar, abre **Simulations** para configurar o importar trabajos.
5. Inicia una simulación y consulta su estado en la lista o en el administrador de cola. Desde ahí puedes pausar, reanudar o cancelar trabajos.
6. Abre los resultados de una simulación finalizada para revisar las visualizaciones y descargar los archivos disponibles.

En aperturas posteriores se reutilizan las imágenes ya preparadas. La base de datos, las mallas y los resultados se conservan en volúmenes de Docker entre sesiones. Si desinstalas BDAT, esos volúmenes de Docker no se eliminan automáticamente.

El instalador se publica como activo de una Release de GitHub. La carpeta local `release/` se excluye de Git; el `.exe` se descarga desde la página de Releases.

## Usar la aplicación de escritorio desde el código fuente

También puedes ejecutar BDAT como desarrollador sin crear ni instalar un `.exe`. Electron abre la aplicación directamente desde este repositorio y levanta los mismos servicios Docker que usa la versión instalada.

### Requisitos

- Git.
- Node.js con npm.
- Docker Desktop iniciado; en Windows, con WSL 2 habilitado.

### Inicio

1. Clona el repositorio y abre una terminal en su carpeta raíz.
2. Instala las dependencias de la interfaz y Electron:

   ```powershell
   npm run desktop:install-deps
   ```

3. Comprueba que Docker Desktop esté funcionando y ejecuta:

   ```powershell
   npm run desktop:dev
   ```

El comando compila la interfaz React y abre la ventana de BDAT mediante Electron. No crea un instalador ni requiere instalar la aplicación. En el primer inicio Docker construye las imágenes científicas y puede tardar varios minutos; los siguientes inicios reutilizan esas imágenes.

Después de modificar la interfaz, vuelve a ejecutar `npm run desktop:dev` para reconstruirla y abrirla con los cambios. Al cerrar la ventana, los contenedores de Docker pueden seguir activos. Para detenerlos, abre Docker Desktop, localiza el proyecto `bdat-desktop` en **Containers** y pulsa **Stop**.

> Este modo usa los archivos del repositorio como contexto de construcción. Si solo quieres desarrollar la versión web en el navegador, consulta la sección [Entorno web de desarrollo](#entorno-web-de-desarrollo).

## Tecnologías

| Área | Tecnologías | Uso |
| --- | --- | --- |
| Aplicación de escritorio | Electron, electron-builder, NSIS | Ventana de escritorio, arranque de servicios y empaquetado para Windows. |
| Interfaz | React 19, React Router, Zustand | Formularios, navegación y estado de la aplicación. |
| Gráficos y visualización | Recharts, Three.js, Socket.IO Client | Gráficos, vistas 3D y actualizaciones de estado en tiempo real. |
| API y lógica de aplicación | Python 3, Flask, Flask-SocketIO | API HTTP, coordinación con la interfaz y eventos en tiempo real. |
| Procesamiento asíncrono | Celery, Redis | Ejecución y coordinación de simulaciones en segundo plano. |
| Motor científico | FEniCS, Gmsh, meshio, NumPy, SciPy y Octave | Modelado numérico, generación y manejo de mallas, y cálculo científico. |
| Persistencia | MySQL 8 | Datos de la aplicación y metadatos de las simulaciones. |
| Entorno de ejecución | Docker, Docker Compose, WSL 2 en Windows | Servicios aislados y dependencias científicas reproducibles. |

## Arquitectura

La interfaz React se ejecuta dentro de Electron en la distribución de escritorio. Electron inicia un conjunto de servicios Docker Compose locales: una API Flask, un worker Celery, Redis y MySQL. El worker procesa las simulaciones de forma asíncrona y la interfaz recibe estados mediante Socket.IO. Los resultados y las mallas se almacenan en volúmenes persistentes de Docker.

```text
Aplicación Electron / Interfaz React
                 │ HTTP y Socket.IO
                 ▼
             API Flask ───── MySQL
                 │
                 ├────────── Redis
                 │              │
                 └──────── Celery worker
                                │
                         Motor científico
```

## Desarrollo

### Requisitos para desarrollar

- Git.
- Docker Desktop con Docker Compose; en Windows, WSL 2.
- Node.js y npm para compilar la interfaz y empaquetar la app de escritorio.

Las dependencias del backend científico se instalan dentro de la imagen Docker del backend. El Dockerfile del proyecto usa Ubuntu 20.04 y los paquetes científicos del sistema, incluida la distribución FEniCS compatible con ese entorno.

### Entorno web de desarrollo

Desde la raíz del repositorio, inicia los servicios de desarrollo:

```bash
docker compose -f docker-compose.dev.yml up --build
```

La interfaz de desarrollo se publica en `http://localhost:3002` y la API en `http://localhost:5000`. Para detener los contenedores, usa `Ctrl+C` y luego `docker compose -f docker-compose.dev.yml down`. Este comando conserva los volúmenes de datos; no añadas `-v` salvo que quieras eliminarlos.

### Crear el instalador de Windows

Desde PowerShell o una terminal en la raíz del proyecto:

```powershell
npm run desktop:install-deps
npm run desktop:build
```

El proceso compila la interfaz y empaqueta la aplicación con Electron. El instalador resultante es `release/BDAT-Setup-1.0.0.exe`. La primera ejecución del instalador generado también necesita Docker Desktop para construir y ejecutar los servicios científicos.

## Estructura del repositorio

```text
backend/       API Flask, tareas Celery y simulaciones científicas
database/      Imagen y archivos de inicialización de MySQL
electron/      Aplicación de escritorio y configuración Docker para escritorio
frontend/      Interfaz React
docs/          Documentación complementaria
docker-compose.dev.yml  Servicios del entorno de desarrollo
docker-compose.yml      Configuración Compose general
```
