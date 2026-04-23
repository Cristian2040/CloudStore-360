// Utilidades generales

/**
 * Formatea un número como moneda
 * @param {number} amount - Cantidad a formatear
 * @returns {string} Cantidad formateada
 */
export function formatCurrency(amount) {
    return new Intl.NumberFormat('es-MX', {
        style: 'currency',
        currency: 'MXN'
    }).format(amount);
}

/**
 * Formatea una fecha
 * @param {Date} date - Fecha a formatear
 * @param {string} format - Formato ('short', 'long', 'time')
 * @returns {string} Fecha formateada
 */
export function formatDate(date, format = 'short') {
    if (!date) return '';

    const d = date instanceof Date ? date : new Date(date);

    if (format === 'short') {
        return d.toLocaleDateString('es-MX');
    } else if (format === 'long') {
        return d.toLocaleDateString('es-MX', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    } else if (format === 'time') {
        return d.toLocaleTimeString('es-MX', {
            hour: '2-digit',
            minute: '2-digit'
        });
    } else if (format === 'datetime') {
        return `${formatDate(d, 'short')} ${formatDate(d, 'time')}`;
    }

    return d.toLocaleDateString('es-MX');
}

/**
 * Muestra un mensaje de alerta
 * @param {string} message - Mensaje a mostrar
 * @param {string} type - Tipo ('success', 'error', 'warning', 'info')
 */
export function showAlert(message, type = 'info') {
    const alertContainer = document.getElementById('alert-container') || createAlertContainer();

    const alert = document.createElement('div');
    alert.className = `alert alert-${type} fade-in`;
    alert.textContent = message;

    alertContainer.appendChild(alert);

    // Auto-remover después de 5 segundos
    setTimeout(() => {
        alert.style.opacity = '0';
        setTimeout(() => alert.remove(), 300);
    }, 5000);
}

/**
 * Crea el contenedor de alertas si no existe
 */
function createAlertContainer() {
    const container = document.createElement('div');
    container.id = 'alert-container';
    container.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    z-index: 10000;
    display: flex;
    flex-direction: column;
    gap: 10px;
    max-width: 400px;
  `;
    document.body.appendChild(container);
    return container;
}

/**
 * Muestra un spinner de carga
 * @param {HTMLElement} element - Elemento donde mostrar el spinner
 * @param {string} message - Mensaje opcional
 */
export function showLoading(element, message = 'Cargando...') {
    element.innerHTML = `
    <div class="loading-container">
      <div class="spinner"></div>
      <p>${message}</p>
    </div>
  `;
}

/**
 * Muestra un modal de confirmación
 * @param {string} message - Mensaje de confirmación
 * @param {Function} onConfirm - Callback al confirmar
 */
export function showConfirm(message, onConfirm) {
    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay';

    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.innerHTML = `
    <div class="modal-header">
      <h3>Confirmación</h3>
    </div>
    <div class="modal-body">
      <p>${message}</p>
    </div>
    <div class="modal-footer">
      <button class="btn btn-outline" id="cancel-btn">Cancelar</button>
      <button class="btn btn-primary" id="confirm-btn">Confirmar</button>
    </div>
  `;

    overlay.appendChild(modal);
    document.body.appendChild(overlay);

    // Event listeners
    document.getElementById('cancel-btn').addEventListener('click', () => {
        overlay.remove();
    });

    document.getElementById('confirm-btn').addEventListener('click', () => {
        overlay.remove();
        if (onConfirm) onConfirm();
    });

    // Cerrar al hacer click fuera del modal
    overlay.addEventListener('click', (e) => {
        if (e.target === overlay) {
            overlay.remove();
        }
    });
}

/**
 * Valida un email
 * @param {string} email - Email a validar
 * @returns {boolean} true si es válido
 */
export function isValidEmail(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
}

/**
 * Trunca un texto
 * @param {string} text - Texto a truncar
 * @param {number} maxLength - Longitud máxima
 * @returns {string} Texto truncado
 */
export function truncateText(text, maxLength = 50) {
    if (!text) return '';
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
}

/**
 * Debounce function para optimizar eventos
 * @param {Function} func - Función a ejecutar
 * @param {number} wait - Tiempo de espera en ms
 * @returns {Function} Función con debounce
 */
export function debounce(func, wait = 300) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

/**
 * Escapa HTML para prevenir XSS
 * @param {string} text - Texto a escapar
 * @returns {string} Texto escapado
 */
export function escapeHtml(text) {
    const map = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#039;'
    };
    return text.replace(/[&<>"']/g, m => map[m]);
}

/**
 * Genera un ID único
 * @returns {string} ID único
 */
export function generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
}
