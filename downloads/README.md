# Directorio de Descargas

Este directorio debe contener los archivos de instalación para cada sistema operativo.

## Archivos Requeridos

Coloca los siguientes archivos en este directorio:

- **soporte-remoto-windows.exe** - Instalador para Windows
- **soporte-remoto-mac.dmg** - Instalador para macOS
- **soporte-remoto-linux.deb** - Paquete para Linux (Debian/Ubuntu)

## Notas

- Los archivos deben tener exactamente los nombres especificados arriba
- Puedes usar otros formatos para Linux (como .rpm, .AppImage, etc.) ajustando el script.js
- Asegúrate de que los archivos tengan los permisos correctos para ser descargados

## Alternativa: Usar URLs Externas

Si los archivos están hospedados en otro servidor o servicio de almacenamiento, edita el archivo `script.js` y actualiza el objeto `DOWNLOAD_URLS` con las URLs completas:

```javascript
const DOWNLOAD_URLS = {
    windows: 'https://tu-servidor.com/descargas/soporte-remoto-windows.exe',
    mac: 'https://tu-servidor.com/descargas/soporte-remoto-mac.dmg',
    linux: 'https://tu-servidor.com/descargas/soporte-remoto-linux.deb'
};
```
