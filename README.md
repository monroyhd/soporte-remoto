# soporte-remoto

Servidor web en Node.js + Express que detecta automáticamente el sistema operativo del visitante y le presenta el archivo de descarga correcto para la herramienta de soporte remoto.

Diseñado para ejecutarse detrás de un proxy inverso **Caddy** que gestiona TLS y el tráfico público.

## Requisitos

- Node.js 18 o superior
- npm
- [Caddy](https://caddyserver.com/) (para producción con HTTPS)

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

El servidor escucha en `http://0.0.0.0:5001` por defecto (todas las interfaces),
lo que permite que Caddy, instalado en otro servidor, alcance el puerto 5001.
Para cambiar el puerto o la dirección usa variables de entorno:

```bash
PORT=5001 HOST=0.0.0.0 npm start
```

## Configuración con Caddy (proxy inverso)

### 1. Instalar Caddy

```bash
# Debian / Ubuntu
sudo apt install -y debian-keyring debian-archive-keyring apt-transport-https curl
curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/gpg.key' | sudo gpg --dearmor -o /usr/share/keyrings/caddy-stable-archive-keyring.gpg
curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/debian.deb.txt' | sudo tee /etc/apt/sources.list.d/caddy-stable.list
sudo apt update && sudo apt install caddy
```

### 2. Configurar el Caddyfile

Edita `/etc/caddy/Caddyfile` (o usa el `Caddyfile` incluido en este repositorio):

```caddy
soporte.example.com {
    reverse_proxy 10.10.10.88:5001 {
        header_up X-Real-IP        {remote_host}
        header_up X-Forwarded-For  {remote_host}
        header_up X-Forwarded-Proto {scheme}
    }
    encode gzip zstd
}
```

Reemplaza `soporte.example.com` con tu dominio real.
Caddy obtiene y renueva el certificado TLS automáticamente.

### 3. Recargar Caddy

```bash
sudo systemctl reload caddy
```

### 4. Iniciar el servidor Node

```bash
npm start
```

### Flujo de tráfico

```
Cliente (HTTPS :443)
    └─► Caddy (servidor proxy)
            └─► Express 10.10.10.88:5001  (servidor de la aplicación)
```

Caddy termina TLS y añade las cabeceras `X-Forwarded-For` / `X-Forwarded-Proto`.
Express las acepta gracias a `trust proxy`.

Express recibe las cabeceras `X-Forwarded-For` y `X-Forwarded-Proto` de Caddy gracias a `app.set('trust proxy', 1)`, lo que permite conocer la IP real del cliente y el protocolo original (HTTPS).

## Estructura del proyecto

```
soporte-remoto/
├── server.js          # Servidor Express principal
├── package.json
├── Caddyfile          # Ejemplo de configuración de Caddy
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
