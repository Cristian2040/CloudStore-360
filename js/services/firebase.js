// Firebase Service - Configuración e inicialización
import firebaseConfig from '../firebase-config.js';

// Importar Firebase desde CDN (se cargará en HTML)
// Este archivo asume que Firebase SDK ya está cargado globalmente

let app;
let auth;
let db;

/**
 * Inicializa Firebase con la configuración proporcionada
 */
export function initializeFirebase() {
    try {
        if (!firebase) {
            throw new Error('Firebase SDK no está cargado. Asegúrate de incluir los scripts en el HTML.');
        }

        // Inicializar Firebase App
        app = firebase.initializeApp(firebaseConfig);

        // Inicializar servicios
        auth = firebase.auth();
        db = firebase.firestore();

        // Habilitar persistencia offline
        try {
            db.enablePersistence({ synchronizeTabs: true });
            console.log('📦 Persistencia offline habilitada');
        } catch (err) {
            if (err.code == 'failed-precondition') {
                console.warn('Persistencia falló: Múltiples pestañas abiertas');
            } else if (err.code == 'unimplemented') {
                console.warn('Persistencia no soportada por el navegador');
            }
        }

        console.log('✅ Firebase inicializado correctamente');

        // Configurar monitoreo de conexión
        setupConnectionMonitoring(db);

        return { app, auth, db };
    } catch (error) {
        console.error('❌ Error al inicializar Firebase:', error);
        throw error;
    }
}

/**
 * Obtiene la instancia de Auth
 */
export function getAuth() {
    if (!auth) {
        throw new Error('Firebase Auth no está inicializado');
    }
    return auth;
}

/**
 * Obtiene la instancia de Firestore
 */
export function getFirestore() {
    if (!db) {
        throw new Error('Firestore no está inicializado');
    }
    return db;
}

/**
 * Observa el estado de autenticación del usuario
 * @param {Function} callback - Función que se ejecuta cuando cambia el estado de auth
 */
export function onAuthStateChanged(callback) {
    const auth = getAuth();
    return auth.onAuthStateChanged(callback);
}

/**
 * Configura el monitoreo de conexión para habilitar/deshabilitar Firestore
 * @param {Object} db - Instancia de Firestore
 */
function setupConnectionMonitoring(db) {
    const handleConnectionChange = () => {
        if (navigator.onLine) {
            console.log('🌐 Conexión detectada: Habilitando red de Firestore...');
            db.enableNetwork().catch(err => console.error('Error al habilitar red:', err));
        } else {
            console.log('📴 Sin conexión: Deshabilitando red de Firestore para evitar errores...');
            db.disableNetwork().catch(err => console.error('Error al deshabilitar red:', err));
        }
    };

    // Escuchar eventos online/offline
    window.addEventListener('online', handleConnectionChange);
    window.addEventListener('offline', handleConnectionChange);

    // Estado inicial
    if (!navigator.onLine) {
        handleConnectionChange();
    }
}

