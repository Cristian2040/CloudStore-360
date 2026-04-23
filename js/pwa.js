/**
 * PWA Service Worker Registration & Connectivity Managment
 */
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/service-worker.js')
            .then(registration => {
                console.log('✅ Service Worker registrado con éxito:', registration.scope);
            })
            .catch(error => {
                console.error('❌ Falló el registro del Service Worker:', error);
            });
    });
}

// Connectivity Handler
function updateOnlineStatus() {
    const isOnline = navigator.onLine;
    showConnectionToast(isOnline);
}

function showConnectionToast(isOnline) {
    let toast = document.getElementById('connection-toast');

    // Create toast if doesn't exist
    if (!toast) {
        toast = document.createElement('div');
        toast.id = 'connection-toast';
        toast.className = 'offline-toast';
        document.body.appendChild(toast);
    }

    if (!isOnline) {
        toast.innerHTML = '<span class="offline-icon"><i data-lucide="wifi-off" style="width:1em; height:1em; vertical-align: middle;"></i></span> <span>Estás desconectado. Trabajando en modo offline.</span>';
        toast.classList.remove('online-toast');
        toast.classList.add('visible');
    } else {
        // Show "Back Online" briefly
        toast.innerHTML = '<span class="offline-icon"><i data-lucide="wifi" style="width:1em; height:1em; vertical-align: middle;"></i></span> <span>Conexión restaurada. Sincronizando...</span>';
        toast.classList.add('online-toast');
        toast.classList.add('visible');

        // Hide after 3 seconds
        setTimeout(() => {
            toast.classList.remove('visible');
        }, 3000);
    }
    if (window.lucide) window.lucide.createIcons({ root: toast });
}

window.addEventListener('online', updateOnlineStatus);
window.addEventListener('offline', updateOnlineStatus);

// Check initial status
document.addEventListener('DOMContentLoaded', () => {
    if (!navigator.onLine) {
        updateOnlineStatus();
    }
});
