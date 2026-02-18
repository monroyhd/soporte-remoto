# soporte-remoto

Servidor web en Node.js + Express que detecta automáticamente el sistema operativo del visitante y le presenta el archivo de descarga correcto para la herramienta de soporte remoto.

## Requisitos

- Node.js 18 o superior
- npm

## Instalación

```bash
npm install
```

## Uso

**Producción:**
```bash
npm start
```

**Desarrollo (con recarga automática):**
```bash
npm run dev
```

El servidor escucha en `http://localhost:3000` por defecto.
Para cambiar el puerto usa la variable de entorno `PORT`:

```bash
PORT=8080 npm start
```

## Estructura del proyecto

```
soporte-remoto/
├── server.js          # Servidor Express principal
├── package.json
├── public/
│   └── index.html     # Página de descarga con detección de SO
└── downloads/         # Coloca aquí los archivos de instalación
    ├── soporte-remoto-windows.exe
    ├── soporte-remoto-macos.dmg
    ├── soporte-remoto-linux.sh
    └── soporte-remoto-android.apk
```

## Rutas disponibles

| Ruta | Descripción |
|------|-------------|
| `GET /` | Página principal con detección automática de SO |
| `GET /api/platform` | JSON con la plataforma y archivo detectados |
| `GET /download` | Descarga automática según el SO del cliente |
| `GET /download/:platform` | Fuerza la descarga para una plataforma específica (`windows`, `macos`, `linux`, `android`) |

## Agregar archivos de descarga

Copia los instaladores en la carpeta `downloads/` con los nombres exactos:

- `soporte-remoto-windows.exe`
- `soporte-remoto-macos.dmg`
- `soporte-remoto-linux.sh`
- `soporte-remoto-android.apk`
