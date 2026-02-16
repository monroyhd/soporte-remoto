// Configuration for download URLs
const DOWNLOAD_URLS = {
    windows: 'downloads/soporte-remoto-windows.exe',
    mac: 'downloads/soporte-remoto-mac.dmg',
    linux: 'downloads/soporte-remoto-linux.deb'
};

// Detect Operating System
function detectOS() {
    const userAgent = window.navigator.userAgent;
    const platform = window.navigator.platform;
    const macosPlatforms = ['Macintosh', 'MacIntel', 'MacPPC', 'Mac68K'];
    const windowsPlatforms = ['Win32', 'Win64', 'Windows', 'WinCE'];
    const iosPlatforms = ['iPhone', 'iPad', 'iPod'];

    let os = null;
    let osName = 'Desconocido';

    if (macosPlatforms.indexOf(platform) !== -1) {
        os = 'mac';
        osName = 'macOS';
    } else if (iosPlatforms.indexOf(platform) !== -1) {
        os = 'mac';
        osName = 'iOS (use macOS)';
    } else if (windowsPlatforms.indexOf(platform) !== -1) {
        os = 'windows';
        osName = 'Windows';
    } else if (/Android/.test(userAgent)) {
        os = 'linux';
        osName = 'Android (use Linux)';
    } else if (/Linux/.test(platform)) {
        os = 'linux';
        osName = 'Linux';
    }

    return { os, osName };
}

// Download file
function downloadFile(os) {
    const url = DOWNLOAD_URLS[os];
    
    if (!url) {
        alert('No hay una versión disponible para tu sistema operativo.');
        return;
    }

    // Create a temporary link and trigger download
    const link = document.createElement('a');
    link.href = url;
    link.download = '';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    // Show download started message
    const downloadInfo = document.getElementById('download-info');
    downloadInfo.textContent = 'Descarga iniciada... Si no comienza automáticamente, usa las opciones de descarga manual.';
    downloadInfo.style.color = 'var(--success-color)';
}

// Initialize the page
function init() {
    const { os, osName } = detectOS();
    
    // Update detected OS display
    const osDetectedElement = document.getElementById('os-detected');
    osDetectedElement.textContent = osName;

    // Update auto-download button
    const autoDownloadBtn = document.getElementById('auto-download-btn');
    const downloadText = document.getElementById('download-text');
    
    if (os) {
        downloadText.textContent = `Descargar para ${osName}`;
        autoDownloadBtn.addEventListener('click', () => downloadFile(os));
    } else {
        downloadText.textContent = 'Sistema no detectado';
        autoDownloadBtn.disabled = true;
        document.getElementById('download-info').textContent = 
            'No se pudo detectar tu sistema operativo. Por favor, usa las opciones de descarga manual.';
    }

    // Setup manual download buttons
    const manualButtons = document.querySelectorAll('.download-card button');
    manualButtons.forEach(button => {
        button.addEventListener('click', () => {
            const targetOS = button.getAttribute('data-os');
            downloadFile(targetOS);
        });
    });
}

// Run initialization when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}
