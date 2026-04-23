// Servicio de Autenticación
import { getAuth } from './firebase.js';

/**
 * Inicia sesión con email y contraseña
 * @param {string} email - Email del usuario
 * @param {string} password - Contraseña
 * @returns {Promise} Usuario autenticado
 */
export async function login(email, password) {
    try {
        if (!navigator.onLine) {
            throw new Error('auth/network-request-failed');
        }
        const auth = getAuth();
        const userCredential = await auth.signInWithEmailAndPassword(email, password);
        console.log('✅ Login exitoso:', userCredential.user.email);
        return userCredential.user;
    } catch (error) {
        console.error('❌ Error en login:', error);
        throw getAuthError(error.code);
    }
}

/**
 * Registra un nuevo usuario con email y contraseña
 * @param {string} email - Email del usuario
 * @param {string} password - Contraseña
 * @returns {Promise} Usuario creado
 */
export async function register(email, password) {
    try {
        if (!navigator.onLine) {
            throw new Error('auth/network-request-failed');
        }
        const auth = getAuth();
        const userCredential = await auth.createUserWithEmailAndPassword(email, password);
        console.log('✅ Registro exitoso:', userCredential.user.email);
        return userCredential.user;
    } catch (error) {
        console.error('❌ Error en registro:', error);
        throw getAuthError(error.code);
    }
}

/**
 * Cierra la sesión del usuario actual
 */
export async function logout() {
    try {
        const auth = getAuth();
        await auth.signOut();
        console.log('✅ Sesión cerrada');
    } catch (error) {
        console.error('❌ Error al cerrar sesión:', error);
        throw error;
    }
}

/**
 * Obtiene el usuario actualmente autenticado
 * @returns {Object|null} Usuario actual o null
 */
export function getCurrentUser() {
    const auth = getAuth();
    return auth.currentUser;
}

/**
 * Convierte códigos de error de Firebase en mensajes legibles
 * @param {string} errorCode - Código de error de Firebase
 * @returns {Error} Error con mensaje en español
 */
function getAuthError(errorCode) {
    const errorMessages = {
        'auth/email-already-in-use': 'El email ya está registrado',
        'auth/invalid-email': 'El email no es válido',
        'auth/operation-not-allowed': 'Operación no permitida',
        'auth/weak-password': 'La contraseña es muy débil (mínimo 6 caracteres)',
        'auth/user-disabled': 'Esta cuenta ha sido deshabilitada',
        'auth/user-not-found': 'No existe un usuario con este email',
        'auth/wrong-password': 'Contraseña incorrecta',
        'auth/too-many-requests': 'Demasiados intentos fallidos. Intenta más tarde',
        'auth/network-request-failed': 'Error de conexión. Verifica tu internet'
    };

    const message = errorMessages[errorCode] || 'Error de autenticación';
    return new Error(message);
}

/**
 * Verifica si el usuario está autenticado
 * @returns {boolean} true si hay un usuario autenticado
 */
export function isAuthenticated() {
    return getCurrentUser() !== null;
}

/**
 * Restablece la contraseña enviando un email
 * @param {string} email - Email del usuario
 */
export async function resetPassword(email) {
    try {
        if (!navigator.onLine) {
            throw new Error('auth/network-request-failed');
        }
        const auth = getAuth();
        await auth.sendPasswordResetEmail(email);
        console.log('✅ Email de recuperación enviado');
    } catch (error) {
        console.error('❌ Error al enviar email de recuperación:', error);
        throw getAuthError(error.code);
    }
}
