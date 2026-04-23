// User Dropdown Menu Handler
// Este script maneja el menú desplegable de usuario en el navbar

document.addEventListener('DOMContentLoaded', () => {
    const userDropdownBtn = document.getElementById('user-dropdown-btn');
    const userDropdownMenu = document.getElementById('user-dropdown-menu');

    if (!userDropdownBtn || !userDropdownMenu) return;

    // Toggle dropdown
    userDropdownBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        userDropdownBtn.classList.toggle('active');
        userDropdownMenu.classList.toggle('active');
    });

    // Cerrar dropdown al hacer click fuera
    document.addEventListener('click', (e) => {
        if (!userDropdownBtn.contains(e.target) && !userDropdownMenu.contains(e.target)) {
            userDropdownBtn.classList.remove('active');
            userDropdownMenu.classList.remove('active');
        }
    });

    // Cerrar con ESC
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && userDropdownMenu.classList.contains('active')) {
            userDropdownBtn.classList.remove('active');
            userDropdownMenu.classList.remove('active');
        }
    });
});

// Función global para poblar información del usuario
window.populateUserInfo = function (email) {
    const dropdownUserEmail = document.getElementById('dropdown-user-email');
    const userDisplayName = document.getElementById('user-display-name');
    const userAvatar = document.getElementById('user-avatar');

    if (!email) return;

    const firstName = email.split('@')[0];
    const initials = firstName.charAt(0).toUpperCase();

    if (dropdownUserEmail) dropdownUserEmail.textContent = email;
    if (userDisplayName) userDisplayName.textContent = firstName;
    if (userAvatar) userAvatar.textContent = initials;
};
