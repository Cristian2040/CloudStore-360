// Servicio de Gastos - CRUD y gestión de gastos operativos
import { getFirestore } from './firebase.js';

export const COLLECTION_NAME = 'gastos';

/**
 * Categorías predefinidas de gastos
 */
export const CATEGORIAS_GASTOS = [
    'Renta',
    'Servicios (Luz, Agua, Gas)',
    'Empleados',
    'Proveedores',
    'Mantenimiento',
    'Marketing',
    'Transporte',
    'Impuestos',
    'Otro'
];

/**
 * Crear un nuevo gasto
 * @param {Object} gastoData - Datos del gasto
 * @returns {Promise<string>} ID del gasto creado
 */
export async function createGasto(gastoData) {
    try {
        const db = getFirestore();

        // Validar datos
        validateGastoData(gastoData);

        const batch = db.batch();
        const docRef = db.collection(COLLECTION_NAME).doc();

        const gasto = {
            categoria: gastoData.categoria,
            descripcion: gastoData.descripcion || '',
            monto: parseFloat(gastoData.monto),
            fecha: gastoData.fecha || firebase.firestore.FieldValue.serverTimestamp(),
            metodoPago: gastoData.metodoPago || 'efectivo',
            recurrente: gastoData.recurrente || false,
            activo: true,
            fechaCreacion: firebase.firestore.FieldValue.serverTimestamp()
        };

        // Si el gasto incluye productos (ej. reabasto de inventario), guardarlos
        if (gastoData.productos && Array.isArray(gastoData.productos)) {
            gasto.productos = gastoData.productos;
        }

        batch.set(docRef, gasto);

        const commitPromise = batch.commit();
        const timeoutPromise = new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), 2000));

        try {
            if (!navigator.onLine) throw new Error('Offline');
            await Promise.race([commitPromise, timeoutPromise]);
            console.log('✅ Gasto registrado (Online):', docRef.id);
        } catch (e) {
            console.log('⚠️ Gasto guardado offline/lento:', docRef.id);
            commitPromise.catch(err => console.log('Background sync:', err.message));
        }

        return docRef.id;
    } catch (error) {
        console.error('❌ Error al crear gasto:', error);
        throw error;
    }
}

/**
 * Obtener todos los gastos
 * @param {number} limit - Límite de resultados
 * @returns {Promise<Array>} Array de gastos
 */
export async function getAllGastos(limit = 100) {
    try {
        const db = getFirestore();
        const snapshot = await db.collection(COLLECTION_NAME)
            .where('activo', '==', true)
            .orderBy('fecha', 'desc')
            .limit(limit)
            .get();

        const gastos = [];
        snapshot.forEach(doc => {
            gastos.push({
                id: doc.id,
                ...doc.data(),
                fecha: doc.data().fecha?.toDate()
            });
        });

        console.log(`✅ ${gastos.length} gastos obtenidos`);
        return gastos;
    } catch (error) {
        console.error('❌ Error al obtener gastos:', error);
        throw error;
    }
}

/**
 * Obtener gastos por rango de fechas
 * @param {Date} startDate - Fecha inicial
 * @param {Date} endDate - Fecha final
 * @returns {Promise<Array>} Gastos en el rango
 */
export async function getGastosByDateRange(startDate, endDate) {
    try {
        const db = getFirestore();
        const snapshot = await db.collection(COLLECTION_NAME)
            .where('activo', '==', true)
            .where('fecha', '>=', startDate)
            .where('fecha', '<=', endDate)
            .get();

        const gastos = [];
        snapshot.forEach(doc => {
            gastos.push({
                id: doc.id,
                ...doc.data(),
                fecha: doc.data().fecha?.toDate()
            });
        });

        // Ordenar en memoria para evitar índice compuesto
        gastos.sort((a, b) => (b.fecha?.getTime() || 0) - (a.fecha?.getTime() || 0));

        console.log(`✅ ${gastos.length} gastos obtenidos en el rango`);
        return gastos;
    } catch (error) {
        console.error('❌ Error al obtener gastos por rango:', error);
        throw error;
    }
}

/**
 * Obtener gastos del día actual
 * @returns {Promise<Array>} Gastos del día
 */
export async function getTodayGastos() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    return getGastosByDateRange(today, tomorrow);
}

/**
 * Obtener gastos del mes actual
 * @returns {Promise<Array>} Gastos del mes
 */
export async function getMonthGastos() {
    const now = new Date();
    const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

    return getGastosByDateRange(firstDay, lastDay);
}

/**
 * Actualizar un gasto
 * @param {string} id - ID del gasto
 * @param {Object} updates - Datos a actualizar
 * @returns {Promise<void>}
 */
export async function updateGasto(id, updates) {
    try {
        const db = getFirestore();

        const updateData = {
            ...updates,
            fechaActualizacion: firebase.firestore.FieldValue.serverTimestamp()
        };

        // Si hay monto, convertir a número
        if (updates.monto !== undefined) {
            updateData.monto = parseFloat(updates.monto);
        }

        await db.collection(COLLECTION_NAME).doc(id).update(updateData);
        console.log('✅ Gasto actualizado:', id);
    } catch (error) {
        console.error('❌ Error al actualizar gasto:', error);
        throw error;
    }
}

/**
 * Eliminar un gasto (soft delete)
 * @param {string} id - ID del gasto
 * @returns {Promise<void>}
 */
export async function deleteGasto(id) {
    try {
        const db = getFirestore();
        await db.collection(COLLECTION_NAME).doc(id).update({
            activo: false,
            fechaEliminacion: firebase.firestore.FieldValue.serverTimestamp()
        });
        console.log('✅ Gasto eliminado:', id);
    } catch (error) {
        console.error('❌ Error al eliminar gasto:', error);
        throw error;
    }
}

/**
 * Calcular total de gastos para un período
 * @param {Array} gastos - Array de gastos
 * @returns {number} Total de gastos
 */
export function calculateTotalGastos(gastos) {
    return gastos.reduce((sum, gasto) => sum + (gasto.monto || 0), 0);
}

/**
 * Agrupar gastos por categoría
 * @param {Array} gastos - Array de gastos
 * @returns {Object} Gastos agrupados por categoría
 */
export function groupGastosByCategory(gastos) {
    const grouped = {};

    gastos.forEach(gasto => {
        const categoria = gasto.categoria || 'Otro';
        if (!grouped[categoria]) {
            grouped[categoria] = {
                categoria,
                total: 0,
                cantidad: 0
            };
        }
        grouped[categoria].total += gasto.monto || 0;
        grouped[categoria].cantidad++;
    });

    return grouped;
}

function validateGastoData(data) {
    if (!data.categoria) {
        throw new Error('La categoría es requerida');
    }

    if (!data.monto || parseFloat(data.monto) <= 0) {
        throw new Error('El monto debe ser mayor a 0');
    }
}

/**
 * Buscar gastos por descripción o categoría
 * @param {string} query - Término de búsqueda
 * @returns {Promise<Array>} Gastos encontrados
 */
export async function searchGastos(query) {
    try {
        const db = getFirestore();
        const queryLower = query.toLowerCase();

        // Obtener todos los gastos activos (optimizable con índices si crece mucho)
        // Por ahora obtenemos los últimos 100 para buscar reciente
        // O mejor, obtenemos una colección más amplia si es búsqueda

        const snapshot = await db.collection(COLLECTION_NAME)
            .where('activo', '==', true)
            .orderBy('fecha', 'desc')
            .limit(200) // Límite razonable para búsqueda rápida
            .get();

        const gastos = [];
        snapshot.forEach(doc => {
            const data = doc.data();
            const descripcion = (data.descripcion || '').toLowerCase();
            const categoria = (data.categoria || '').toLowerCase();

            if (descripcion.includes(queryLower) || categoria.includes(queryLower)) {
                gastos.push({
                    id: doc.id,
                    ...data,
                    fecha: data.fecha?.toDate()
                });
            }
        });

        console.log(`✅ ${gastos.length} gastos encontrados`);
        return gastos;
    } catch (error) {
        console.error('❌ Error al buscar gastos:', error);
        throw error;
    }
}
