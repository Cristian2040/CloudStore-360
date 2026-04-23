/**
 * Script de Autenticación de Rutas y Cierre de Sesión
 * Protege las páginas y redirige a index.html si no hay sesión activa.
 */
document.addEventListener('DOMContentLoaded', () => {
    // Esperar a que el SDK de Firebase (compat) esté disponible globalmente
    const checkAuth = setInterval(() => {
        if (typeof firebase !== 'undefined' && firebase.auth) {
            clearInterval(checkAuth);

            // 1. Proteger rutas: redirigir a index.html si no hay usuario
            // Nota: index.html tiene su propia lógica que redirige a ventas.html si SÍ hay usuario.
            firebase.auth().onAuthStateChanged((user) => {
                if (!user) {
                    window.location.href = 'index.html';
                } else {
                    // Actualizar UI (Avatar y Correo) usando la función global de user-menu.js
                    if (typeof window.populateUserInfo === 'function') {
                        window.populateUserInfo(user.email);
                    }
                }
            });

            // 2. Manejar cerrado de sesión desde el perfil de usuario (Topbar / Móvil)
            const logoutBtns = document.querySelectorAll('#dropdown-logout-btn');
            logoutBtns.forEach(btn => {
                btn.addEventListener('click', () => {
                    firebase.auth().signOut().then(() => {
                        window.location.href = 'index.html';
                    }).catch(error => {
                        console.error('Error al cerrar sesión:', error);
                    });
                });
            });
        }
    }, 50);

    // Parada de seguridad si Firebase no llega a cargar en 5 segundos
    setTimeout(() => {
        clearInterval(checkAuth);
    }, 5000);
});
