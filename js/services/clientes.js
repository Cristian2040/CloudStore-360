// Servicio de Clientes - CRUD y gestión de clientes
import { getFirestore } from './firebase.js';

const COLLECTION_NAME = 'clientes';

/**
 * Crear un nuevo cliente
 * @param {Object} clienteData - Datos del cliente
 * @returns {Promise<string>} ID del cliente creado
 */
export async function createCliente(clienteData) {
    try {
        const db = getFirestore();

        // Validar datos
        if (!clienteData.nombre) {
            throw new Error('El nombre es requerido');
        }

        const batch = db.batch();
        const docRef = db.collection(COLLECTION_NAME).doc();

        const cliente = {
            nombre: clienteData.nombre,
            telefono: clienteData.telefono || '',
            email: clienteData.email || '',
            direccion: clienteData.direccion || '',
            notas: clienteData.notas || '',
            totalCompras: 0,
            cantidadCompras: 0,
            deudaTotal: 0,
            activo: true,
            fechaCreacion: firebase.firestore.FieldValue.serverTimestamp(),
            ultimaCompra: null
        };

        batch.set(docRef, cliente);

        const commitPromise = batch.commit();
        const timeoutPromise = new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), 2000));

        try {
            if (!navigator.onLine) throw new Error('Offline');
            await Promise.race([commitPromise, timeoutPromise]);
            console.log('✅ Cliente creado (Online):', docRef.id);
        } catch (e) {
            console.log('⚠️ Cliente guardado offline/lento:', docRef.id);
            commitPromise.catch(err => console.log('Background sync:', err.message));
        }

        return docRef.id;
    } catch (error) {
        console.error('❌ Error al crear cliente:', error);
        throw error;
    }
}

/**
 * Obtener todos los clientes
 * @returns {Promise<Array>} Array de clientes
 */
export async function getAllClientes() {
    try {
        const db = getFirestore();
        const snapshot = await db.collection(COLLECTION_NAME)
            .where('activo', '==', true)
            .orderBy('nombre')
            .get();

        const clientes = [];
        snapshot.forEach(doc => {
            clientes.push({
                id: doc.id,
                ...doc.data(),
                fechaCreacion: doc.data().fechaCreacion?.toDate(),
                ultimaCompra: doc.data().ultimaCompra?.toDate()
            });
        });

        console.log(`✅ ${clientes.length} clientes obtenidos`);
        return clientes;
    } catch (error) {
        console.error('❌ Error al obtener clientes:', error);
        throw error;
    }
}

/**
 * Obtener un cliente por ID
 * @param {string} id - ID del cliente
 * @returns {Promise<Object>} Cliente
 */
export async function getClienteById(id) {
    try {
        const db = getFirestore();
        const doc = await db.collection(COLLECTION_NAME).doc(id).get();

        if (!doc.exists) {
            throw new Error('Cliente no encontrado');
        }

        return {
            id: doc.id,
            ...doc.data(),
            fechaCreacion: doc.data().fechaCreacion?.toDate(),
            ultimaCompra: doc.data().ultimaCompra?.toDate()
        };
    } catch (error) {
        console.error('❌ Error al obtener cliente:', error);
        throw error;
    }
}

/**
 * Buscar clientes por nombre o teléfono
 * @param {string} query - Texto de búsqueda
 * @returns {Promise<Array>} Clientes encontrados
 */
export async function searchClientes(query) {
    try {
        const allClientes = await getAllClientes();
        const searchLower = query.toLowerCase();

        return allClientes.filter(cliente => {
            return (
                cliente.nombre.toLowerCase().includes(searchLower) ||
                (cliente.telefono && cliente.telefono.includes(query)) ||
                (cliente.email && cliente.email.toLowerCase().includes(searchLower))
            );
        });
    } catch (error) {
        console.error('❌ Error al buscar clientes:', error);
        throw error;
    }
}

/**
 * Actualizar un cliente
 * @param {string} id - ID del cliente
 * @param {Object} updates - Datos a actualizar
 * @returns {Promise<void>}
 */
export async function updateCliente(id, updates) {
    try {
        const db = getFirestore();

        const updateData = {
            ...updates,
            fechaActualizacion: firebase.firestore.FieldValue.serverTimestamp()
        };

        await db.collection(COLLECTION_NAME).doc(id).update(updateData);
        console.log('✅ Cliente actualizado:', id);
    } catch (error) {
        console.error('❌ Error al actualizar cliente:', error);
        throw error;
    }
}

/**
 * Eliminar un cliente (soft delete)
 * @param {string} id - ID del cliente
 * @returns {Promise<void>}
 */
export async function deleteCliente(id) {
    try {
        const db = getFirestore();
        await db.collection(COLLECTION_NAME).doc(id).update({
            activo: false,
            fechaEliminacion: firebase.firestore.FieldValue.serverTimestamp()
        });
        console.log('✅ Cliente eliminado:', id);
    } catch (error) {
        console.error('❌ Error al eliminar cliente:', error);
        throw error;
    }
}

/**
/**
 * Actualiza los datos de compra y deuda del cliente al procesar una venta
 * @param {string} clienteId - ID del cliente
 * @param {number} montoTotal - Monto total de la venta (sin importar abonos)
 * @param {number} saldoPendiente - Deuda que quedó en esta transacción
 * @returns {Promise<void>}
 */
export async function actualizarDatosCliente(clienteId, montoTotal, saldoPendiente) {
    try {
        const db = getFirestore();
        const clienteRef = db.collection(COLLECTION_NAME).doc(clienteId);

        await clienteRef.update({
            totalCompras: firebase.firestore.FieldValue.increment(parseFloat(montoTotal) || 0),
            cantidadCompras: firebase.firestore.FieldValue.increment(1),
            deudaTotal: firebase.firestore.FieldValue.increment(parseFloat(saldoPendiente) || 0),
            ultimaCompra: firebase.firestore.FieldValue.serverTimestamp()
        });

        console.log('✅ Compra/Deuda registrada para cliente:', clienteId);
    } catch (error) {
        console.error('❌ Error al actualizar datos del cliente:', error);
        throw error;
    }
}

/**
 * Disminuye la deuda total de un cliente debido a un abono
 * @param {string} clienteId - ID del cliente
 * @param {number} montoAbono - Monto abonado a su deuda
 * @returns {Promise<void>}
 */
export async function abonarDeudaCliente(clienteId, montoAbono) {
    try {
        const db = getFirestore();
        const clienteRef = db.collection(COLLECTION_NAME).doc(clienteId);

        await clienteRef.update({
            deudaTotal: firebase.firestore.FieldValue.increment(-(parseFloat(montoAbono) || 0))
        });

        console.log('✅ Abono restado a la deuda global del cliente:', clienteId);
    } catch (error) {
        console.error('❌ Error al abonar deuda del cliente:', error);
        throw error;
    }
}

/**
 * Obtener clientes frecuentes (top compradores)
 * @param {number} limit - Número de clientes
 * @returns {Promise<Array>} Top clientes
 */
export async function getTopClientes(limit = 10) {
    try {
        const db = getFirestore();
        const snapshot = await db.collection(COLLECTION_NAME)
            .where('activo', '==', true)
            .orderBy('totalCompras', 'desc')
            .limit(limit)
            .get();

        const clientes = [];
        snapshot.forEach(doc => {
            clientes.push({
                id: doc.id,
                ...doc.data(),
                fechaCreacion: doc.data().fechaCreacion?.toDate(),
                ultimaCompra: doc.data().ultimaCompra?.toDate()
            });
        });

        return clientes;
    } catch (error) {
        console.error('❌ Error al obtener top clientes:', error);
        throw error;
    }
}

/**
 * Obtener estadísticas de clientes
 * @returns {Promise<Object>} Estadísticas
 */
export async function getEstadisticasClientes() {
    try {
        const clientes = await getAllClientes();

        const stats = {
            totalClientes: clientes.length,
            clientesActivos: clientes.filter(c => c.cantidadCompras > 0).length,
            totalGastado: clientes.reduce((sum, c) => sum + (c.totalCompras || 0), 0),
            promedioGasto: 0
        };

        if (stats.clientesActivos > 0) {
            stats.promedioGasto = stats.totalGastado / stats.clientesActivos;
        }

        return stats;
    } catch (error) {
        console.error('❌ Error al obtener estadísticas:', error);
        throw error;
    }
}
