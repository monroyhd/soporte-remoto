# Soporte Remoto - Aplicación Web de Descarga

Aplicación web para descargar automáticamente la versión correcta de la aplicación de soporte remoto según el sistema operativo del usuario.

## Características

- ✅ Detección automática del sistema operativo (Windows, macOS, Linux)
- ✅ Descarga automática del instalador apropiado
- ✅ Opciones de descarga manual para todos los sistemas operativos
- ✅ Interfaz responsive y moderna
- ✅ Soporte para múltiples navegadores

## Cómo Funciona

La aplicación detecta el sistema operativo del usuario a través del navegador (User Agent y Platform API) y automáticamente ofrece descargar el archivo correspondiente:

- **Windows**: Descarga `soporte-remoto-windows.exe`
- **macOS**: Descarga `soporte-remoto-mac.dmg`
- **Linux**: Descarga `soporte-remoto-linux.deb`

## Instalación

1. Clona este repositorio:
```bash
git clone https://github.com/monroyhd/soporte-remoto.git
cd soporte-remoto
```

2. Coloca los archivos de instalación en el directorio `downloads/`:
   - `soporte-remoto-windows.exe`
   - `soporte-remoto-mac.dmg`
   - `soporte-remoto-linux.deb`

3. Sirve los archivos con cualquier servidor web. Por ejemplo:

```bash
# Usando Python 3
python3 -m http.server 8000

# Usando Node.js (npx)
npx http-server -p 8000

# Usando PHP
php -S localhost:8000
```

4. Abre tu navegador en `http://localhost:8000`

## Configuración

### Usar URLs Externas

Si los archivos están hospedados en otro servidor (como AWS S3, GitHub Releases, etc.), edita `script.js` y actualiza las URLs:

```javascript
const DOWNLOAD_URLS = {
    windows: 'https://tu-servidor.com/descargas/soporte-remoto-windows.exe',
    mac: 'https://tu-servidor.com/descargas/soporte-remoto-mac.dmg',
    linux: 'https://tu-servidor.com/descargas/soporte-remoto-linux.deb'
};
```

### Personalización

- **Estilos**: Edita `styles.css` para cambiar colores, fuentes y diseño
- **Texto**: Modifica `index.html` para cambiar los textos y descripciones
- **Detección de OS**: Ajusta la función `detectOS()` en `script.js` para casos especiales

## Estructura del Proyecto

```
soporte-remoto/
├── index.html          # Página principal
├── styles.css          # Estilos CSS
├── script.js           # Lógica de detección y descarga
├── downloads/          # Directorio para archivos de instalación
│   └── README.md       # Instrucciones para el directorio
└── README.md           # Este archivo
```

## Tecnologías Utilizadas

- HTML5
- CSS3 (con variables CSS y diseño responsive)
- JavaScript Vanilla (sin dependencias externas)

## Compatibilidad

- ✅ Chrome/Edge (últimas versiones)
- ✅ Firefox (últimas versiones)
- ✅ Safari (últimas versiones)
- ✅ Opera (últimas versiones)

## Deployment

### GitHub Pages

1. Ve a Settings > Pages en tu repositorio
2. Selecciona la rama `main` como fuente
3. La aplicación estará disponible en `https://monroyhd.github.io/soporte-remoto/`

### Netlify/Vercel

1. Conecta tu repositorio de GitHub
2. No necesitas configuración de build
3. El directorio de publicación es la raíz del proyecto

## Licencia

Este proyecto está disponible para uso libre.

## Contribuciones

Las contribuciones son bienvenidas. Por favor, abre un issue o pull request.