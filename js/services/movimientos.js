// Servicio de Movimientos de Inventario - Registro de entradas/salidas de mercancía
import { getFirestore } from './firebase.js';

const COLLECTION_NAME = 'movimientos_inventario';

/**
 * Tipos de movimiento
 */
export const TIPOS_MOVIMIENTO = {
    ENTRADA: 'entrada',      // Reabastecimiento
    SALIDA: 'salida',        // Venta
    AJUSTE: 'ajuste',        // Ajuste manual
    DEVOLUCION: 'devolucion' // Devolución de cliente
};

/**
 * Registrar un movimiento de inventario
 * @param {Object} movimientoData - Datos del movimiento
 * @returns {Promise<string>} ID del movimiento
 */
export async function registrarMovimiento(movimientoData) {
    try {
        const db = getFirestore();

        const movimiento = {
            productoId: movimientoData.productoId,
            productoNombre: movimientoData.productoNombre,
            tipo: movimientoData.tipo,
            cantidad: parseInt(movimientoData.cantidad),
            stockAnterior: movimientoData.stockAnterior || 0,
            stockNuevo: movimientoData.stockNuevo || 0,
            motivo: movimientoData.motivo || '',
            costo: parseFloat(movimientoData.costo || 0),
            fecha: firebase.firestore.FieldValue.serverTimestamp(),
            usuarioId: movimientoData.usuarioId || null
        };

        const docRef = await db.collection(COLLECTION_NAME).add(movimiento);
        console.log('✅ Movimiento registrado:', docRef.id);
        return docRef.id;
    } catch (error) {
        console.error('❌ Error al registrar movimiento:', error);
        throw error;
    }
}

/**
 * Obtener movimientos por producto
 * @param {string} productoId - ID del producto
 * @param {number} limit - Límite de resultados
 * @returns {Promise<Array>} Movimientos del producto
 */
export async function getMovimientosByProducto(productoId, limit = 50) {
    try {
        const db = getFirestore();
        const snapshot = await db.collection(COLLECTION_NAME)
            .where('productoId', '==', productoId)
            .orderBy('fecha', 'desc')
            .limit(limit)
            .get();

        const movimientos = [];
        snapshot.forEach(doc => {
            movimientos.push({
                id: doc.id,
                ...doc.data(),
                fecha: doc.data().fecha?.toDate()
            });
        });

        return movimientos;
    } catch (error) {
        console.error('❌ Error al obtener movimientos:', error);
        throw error;
    }
}

/**
 * Obtener todos los movimientos
 * @param {number} limit - Límite de resultados
 * @returns {Promise<Array>} Todos los movimientos
 */
export async function getAllMovimientos(limit = 100) {
    try {
        const db = getFirestore();
        const snapshot = await db.collection(COLLECTION_NAME)
            .orderBy('fecha', 'desc')
            .limit(limit)
            .get();

        const movimientos = [];
        snapshot.forEach(doc => {
            movimientos.push({
                id: doc.id,
                ...doc.data(),
                fecha: doc.data().fecha?.toDate()
            });
        });

        return movimientos;
    } catch (error) {
        console.error('❌ Error al obtener movimientos:', error);
        throw error;
    }
}

/**
 * Obtener estadísticas de movimientos
 * @returns {Promise<Object>} Estadísticas
 */
export async function getEstadisticasMovimientos() {
    try {
        const movimientos = await getAllMovimientos(1000);

        const stats = {
            totalEntradas: 0,
            totalSalidas: 0,
            totalAjustes: 0,
            cantidadEntradas: 0,
            cantidadSalidas: 0
        };

        movimientos.forEach(mov => {
            if (mov.tipo === TIPOS_MOVIMIENTO.ENTRADA) {
                stats.totalEntradas += mov.cantidad;
                stats.cantidadEntradas++;
            } else if (mov.tipo === TIPOS_MOVIMIENTO.SALIDA) {
                stats.totalSalidas += mov.cantidad;
                stats.cantidadSalidas++;
            } else if (mov.tipo === TIPOS_MOVIMIENTO.AJUSTE) {
                stats.totalAjustes += mov.cantidad;
            }
        });

        return stats;
    } catch (error) {
        console.error('❌ Error al obtener estadísticas:', error);
        throw error;
    }
}
