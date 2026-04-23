// Servicio de Ventas
import { getFirestore } from './firebase.js';
import { updateProductStock } from './products.js';

const COLLECTION_NAME = 'ventas';

/**
 * Registra una nueva venta
 * @param {Object} saleData - Datos de la venta
 * @returns {Promise<string>} ID de la venta creada
 */
/**
 * Registra una nueva venta
 * @param {Object} saleData - Datos de la venta
 * @returns {Promise<string>} ID de la venta creada
 */
export async function createSale(saleData) {
    try {
        const db = getFirestore();
        const batch = db.batch();

        // Validar datos
        validateSaleData(saleData);

        // Calcular totales
        const total = calculateSubtotal(saleData.items);
        const costoTotal = calculateTotalCost(saleData.items);
        const ganancia = total - costoTotal;

        // 1. Crear documento de venta
        const saleRef = db.collection(COLLECTION_NAME).doc();
        const sale = {
            items: saleData.items.map(item => ({
                productoId: item.productoId,
                nombre: item.nombre,
                cantidad: parseFloat(item.cantidad),
                precio: parseFloat(item.precio),
                costo: parseFloat(item.costo || 0),
                subtotal: parseFloat(item.precio) * parseFloat(item.cantidad)
            })),
            total: total,
            costoTotal: costoTotal,
            ganancia: ganancia,
            metodoPago: saleData.metodoPago || 'efectivo',
            cliente: saleData.clienteNombre || saleData.cliente || 'Público general',
            clienteId: saleData.clienteId || null,
            montoPagado: saleData.montoPagado !== undefined ? parseFloat(saleData.montoPagado) : total,
            saldoPendiente: saleData.saldoPendiente !== undefined ? parseFloat(saleData.saldoPendiente) : 0,
            estado: (saleData.saldoPendiente > 0) ? 'pendiente' : 'pagada',
            notas: saleData.notas || '',
            fecha: firebase.firestore.FieldValue.serverTimestamp(),
            fechaCreacion: firebase.firestore.FieldValue.serverTimestamp()
        };

        batch.set(saleRef, sale);

        // 2. Actualizar stock de productos (Usando increment para evitar lecturas offline)
        for (const item of saleData.items) {
            const productRef = db.collection('productos').doc(item.productoId);
            batch.update(productRef, {
                stock: firebase.firestore.FieldValue.increment(-parseFloat(item.cantidad)),
                fechaActualizacion: firebase.firestore.FieldValue.serverTimestamp()
            });
        }

        // 3. Actualizar registro acumulativo del cliente si se le fió o compró
        if (saleData.clienteId) {
            const clienteRef = db.collection('clientes').doc(saleData.clienteId);
            const pend = saleData.saldoPendiente !== undefined ? parseFloat(saleData.saldoPendiente) : 0;
            batch.update(clienteRef, {
                totalCompras: firebase.firestore.FieldValue.increment(total),
                cantidadCompras: firebase.firestore.FieldValue.increment(1),
                deudaTotal: firebase.firestore.FieldValue.increment(pend),
                ultimaCompra: firebase.firestore.FieldValue.serverTimestamp()
            });
        }

        // 3. Ejecutar batch (Atómico y funciona offline)
        // 3. Ejecutar batch
        // 3. Ejecutar batch con Timeout
        // Mágica solución para "Online pero sin internet real" o "Offline detectado"
        const COMMIT_TIMEOUT_MS = 2500;

        const commitPromise = batch.commit();

        const timeoutPromise = new Promise((_, reject) =>
            setTimeout(() => reject(new Error('Timeout')), COMMIT_TIMEOUT_MS)
        );

        try {
            if (!navigator.onLine) {
                throw new Error('Offline detected manually');
            }
            await Promise.race([commitPromise, timeoutPromise]);
            console.log('✅ Venta registrada (Online - Rápido):', saleRef.id);
        } catch (error) {
            // Si falla por timeout o por estar offline, no importa.
            // Firestore ya tiene los datos en memoria y los sincronizará cuando pueda.
            // Nosotros liberamos la UI ¡YA!
            console.log('⚠️ Guardando en background (Offline/Lento):', error.message);
            // Asegurarnos de que el commit no lance error no capturado después
            commitPromise.catch(err => console.log('Background sync status:', err.message));
        }

        return saleRef.id;

        return saleRef.id;
    } catch (error) {
        console.error('❌ Error al registrar venta:', error);
        throw error;
    }
}

/**
 * Obtiene todas las ventas
 * @param {number} limit - Número máximo de ventas a obtener
 * @returns {Promise<Array>} Array de ventas
 */
export async function getAllSales(limit = 100) {
    try {
        const db = getFirestore();
        const snapshot = await db.collection(COLLECTION_NAME)
            .orderBy('fecha', 'desc')
            .limit(limit)
            .get();

        const sales = [];
        snapshot.forEach(doc => {
            sales.push({
                id: doc.id,
                ...doc.data(),
                fecha: doc.data().fecha?.toDate() // Convertir Timestamp a Date
            });
        });

        console.log(`✅ ${sales.length} ventas obtenidas`);
        return sales;
    } catch (error) {
        console.error('❌ Error al obtener ventas:', error);
        throw error;
    }
}

/**
 * Obtiene ventas paginadas para scroll infinito
 * @param {number} limit - Número máximo de ventas a obtener
 * @param {Object} startAfterDoc - Documento a partir del cual iniciar
 * @returns {Promise<Object>} Objeto con las ventas y el último documento
 */
export async function getSalesPaginated(limit = 20, startAfterDoc = null) {
    try {
        const db = getFirestore();
        let query = db.collection(COLLECTION_NAME).orderBy('fecha', 'desc').limit(limit);

        if (startAfterDoc) {
            query = query.startAfter(startAfterDoc);
        }

        const snapshot = await query.get();

        const sales = [];
        snapshot.forEach(doc => {
            sales.push({
                id: doc.id,
                ...doc.data(),
                fecha: doc.data().fecha?.toDate(), // Convertir Timestamp a Date
                _docInfo: doc // Guardamos la referencia para el cliente
            });
        });

        const numDocs = snapshot.docs.length;
        const lastDoc = numDocs > 0 ? snapshot.docs[numDocs - 1] : null;

        console.log(`✅ ${sales.length} ventas obtenidas paginadas`);
        return { sales, lastDoc };
    } catch (error) {
        console.error('❌ Error al obtener ventas paginadas:', error);
        throw error;
    }
}

/**
 * Obtiene ventas de un rango de fechas
 * @param {Date} startDate - Fecha inicial
 * @param {Date} endDate - Fecha final
 * @returns {Promise<Array>} Ventas en el rango
 */
export async function getSalesByDateRange(startDate, endDate) {
    try {
        const db = getFirestore();
        const snapshot = await db.collection(COLLECTION_NAME)
            .where('fecha', '>=', startDate)
            .where('fecha', '<=', endDate)
            .orderBy('fecha', 'desc')
            .get();

        const sales = [];
        snapshot.forEach(doc => {
            sales.push({
                id: doc.id,
                ...doc.data(),
                fecha: doc.data().fecha?.toDate()
            });
        });

        console.log(`✅ ${sales.length} ventas obtenidas en el rango`);
        return sales;
    } catch (error) {
        console.error('❌ Error al obtener ventas por rango:', error);
        throw error;
    }
}

/**
 * Obtiene las ventas del día actual
 * @returns {Promise<Array>} Ventas del día
 */
export async function getTodaySales() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    return getSalesByDateRange(today, tomorrow);
}

/**
 * Obtiene una venta por ID
 * @param {string} id - ID de la venta
 * @returns {Promise<Object>} Venta encontrada
 */
export async function getSaleById(id) {
    try {
        const db = getFirestore();
        const doc = await db.collection(COLLECTION_NAME).doc(id).get();

        if (!doc.exists) {
            throw new Error('Venta no encontrada');
        }

        return {
            id: doc.id,
            ...doc.data(),
            fecha: doc.data().fecha?.toDate()
        };
    } catch (error) {
        console.error('❌ Error al obtener venta:', error);
        throw error;
    }
}

/**
 * Calcula estadísticas de ventas para un período
 * @param {Date} startDate - Fecha inicial
 * @param {Date} endDate - Fecha final
 * @returns {Promise<Object>} Estadísticas
 */
export async function getSalesStats(startDate, endDate) {
    try {
        const sales = await getSalesByDateRange(startDate, endDate);

        const stats = {
            totalVentas: sales.length,
            totalIngresos: 0,
            totalGanancias: 0,
            totalCostos: 0,
            promedioVenta: 0,
            ventaPorMetodoPago: {},
            productosVendidos: 0
        };

        sales.forEach(sale => {
            stats.totalIngresos += sale.total || 0;
            stats.totalGanancias += sale.ganancia || 0;
            stats.totalCostos += sale.costoTotal || 0;

            // Contar por método de pago
            const metodo = sale.metodoPago || 'efectivo';
            stats.ventaPorMetodoPago[metodo] = (stats.ventaPorMetodoPago[metodo] || 0) + 1;

            // Contar productos vendidos
            if (sale.items) {
                sale.items.forEach(item => {
                    stats.productosVendidos += item.cantidad || 0;
                });
            }
        });

        stats.promedioVenta = stats.totalVentas > 0 ? stats.totalIngresos / stats.totalVentas : 0;

        console.log('✅ Estadísticas calculadas:', stats);
        return stats;
    } catch (error) {
        console.error('❌ Error al calcular estadísticas:', error);
        throw error;
    }
}

/**
 * Obtiene los productos más vendidos
 * @param {Date} startDate - Fecha inicial
 * @param {Date} endDate - Fecha final
 * @param {number} limit - Número de productos a retornar
 * @returns {Promise<Array>} Productos más vendidos
 */
export async function getTopSellingProducts(startDate, endDate, limit = 10) {
    try {
        const sales = await getSalesByDateRange(startDate, endDate);

        // Agrupar por producto
        const productMap = {};

        sales.forEach(sale => {
            if (sale.items) {
                sale.items.forEach(item => {
                    const id = item.productoId;
                    if (!productMap[id]) {
                        productMap[id] = {
                            productoId: id,
                            nombre: item.nombre,
                            cantidadVendida: 0,
                            totalIngresos: 0
                        };
                    }
                    productMap[id].cantidadVendida += item.cantidad;
                    productMap[id].totalIngresos += item.subtotal;
                });
            }
        });

        // Convertir a array y ordenar
        const topProducts = Object.values(productMap)
            .sort((a, b) => b.cantidadVendida - a.cantidadVendida)
            .slice(0, limit);

        console.log(`✅ Top ${limit} productos calculados`);
        return topProducts;
    } catch (error) {
        console.error('❌ Error al obtener productos más vendidos:', error);
        throw error;
    }
}

/**
 * Valida los datos de la venta
 * @param {Object} data - Datos a validar
 */
function validateSaleData(data) {
    if (!data.items || !Array.isArray(data.items) || data.items.length === 0) {
        throw new Error('La venta debe tener al menos un producto');
    }

    data.items.forEach((item, index) => {
        if (!item.productoId) {
            throw new Error(`Item ${index + 1}: ID de producto requerido`);
        }
        if (!item.cantidad || parseFloat(item.cantidad) <= 0) {
            throw new Error(`Item ${index + 1}: Cantidad inválida`);
        }
        if (!item.precio || parseFloat(item.precio) <= 0) {
            throw new Error(`Item ${index + 1}: Precio inválido`);
        }
    });
}

/**
 * Calcula el subtotal de los items
 * @param {Array} items - Items de la venta
 * @returns {number} Subtotal
 */
function calculateSubtotal(items) {
    return items.reduce((sum, item) => {
        return sum + (parseFloat(item.precio) * parseFloat(item.cantidad));
    }, 0);
}

/**
 * Calcula el costo total de los items
 * @param {Array} items - Items de la venta
 * @returns {number} Costo total
 */
function calculateTotalCost(items) {
    return items.reduce((sum, item) => {
        return sum + ((parseFloat(item.costo) || 0) * parseFloat(item.cantidad));
    }, 0);
}

/**
 * Registra un abono a una venta pendiente
 * @param {string} saleId - ID de la venta
 * @param {number} montoAbono - Monto abonado
 * @returns {Promise<void>}
 */
export async function registrarAbonoVenta(saleId, montoAbono) {
    try {
        const db = getFirestore();
        const saleRef = db.collection(COLLECTION_NAME).doc(saleId);
        
        await db.runTransaction(async (transaction) => {
            const doc = await transaction.get(saleRef);
            if (!doc.exists) {
                throw new Error("Venta no encontrada");
            }
            
            const saleData = doc.data();
            let abonoReal = parseFloat(montoAbono) || 0;
            const nuevoMontoPagado = (parseFloat(saleData.montoPagado) || 0) + abonoReal;
            let nuevoSaldo = (parseFloat(saleData.total) || 0) - nuevoMontoPagado;
            
            if (nuevoSaldo < 0) {
                 abonoReal += nuevoSaldo; // Remove excess
                 nuevoSaldo = 0;
            }
            
            transaction.update(saleRef, {
                montoPagado: parseFloat(saleData.montoPagado || 0) + abonoReal,
                saldoPendiente: nuevoSaldo,
                estado: nuevoSaldo <= 0 ? 'pagada' : 'pendiente',
                ultimaModificacion: firebase.firestore.FieldValue.serverTimestamp()
            });

            if (saleData.clienteId) {
                const clienteRef = db.collection('clientes').doc(saleData.clienteId);
                transaction.update(clienteRef, {
                    deudaTotal: firebase.firestore.FieldValue.increment(-abonoReal)
                });
            }
        });
        
        console.log(`✅ Abono registrado para la venta ${saleId}`);
    } catch (error) {
        console.error('❌ Error al registrar abono:', error);
        throw error;
    }
}

/**
 * Elimina (soft delete) una venta y reversa el inventario y estado del cliente
 * @param {string} saleId - ID de la venta
 * @returns {Promise<void>}
 */
export async function deleteSale(saleId) {
    try {
        const db = getFirestore();
        const saleRef = db.collection(COLLECTION_NAME).doc(saleId);

        await db.runTransaction(async (transaction) => {
            const doc = await transaction.get(saleRef);
            if (!doc.exists) {
                throw new Error("Venta no encontrada");
            }

            const saleData = doc.data();
            if (saleData.estado === 'eliminada') {
                throw new Error("La venta ya estaba eliminada");
            }

            // 1. FASE DE LECTURA (Reads)
            const productRefsToUpdate = [];
            if (saleData.items && Array.isArray(saleData.items)) {
                for (const item of saleData.items) {
                    const productRef = db.collection('productos').doc(item.productoId);
                    const pDoc = await transaction.get(productRef);
                    if(pDoc.exists) {
                        productRefsToUpdate.push({ ref: productRef, qty: parseFloat(item.cantidad) });
                    }
                }
            }

            let clientRefToUpdate = null;
            let clientUpdateData = null;
            if (saleData.clienteId) {
                const clienteRef = db.collection('clientes').doc(saleData.clienteId);
                const cDoc = await transaction.get(clienteRef);
                if(cDoc.exists) {
                    clientRefToUpdate = clienteRef;
                    const pend = saleData.saldoPendiente !== undefined ? parseFloat(saleData.saldoPendiente) : 0;
                    clientUpdateData = {
                        totalCompras: firebase.firestore.FieldValue.increment(-(parseFloat(saleData.total) || 0)),
                        cantidadCompras: firebase.firestore.FieldValue.increment(-1),
                        deudaTotal: firebase.firestore.FieldValue.increment(-pend)
                    };
                }
            }

            // 2. FASE DE ESCRITURA (Writes)
            for (const { ref, qty } of productRefsToUpdate) {
                transaction.update(ref, {
                    stock: firebase.firestore.FieldValue.increment(qty),
                    fechaActualizacion: firebase.firestore.FieldValue.serverTimestamp()
                });
            }

            if (clientRefToUpdate) {
                transaction.update(clientRefToUpdate, clientUpdateData);
            }

            // Modificar el estado de la venta
            transaction.update(saleRef, {
                estado: 'eliminada',
                fechaEliminacion: firebase.firestore.FieldValue.serverTimestamp()
            });
        });

        console.log(`✅ Venta ${saleId} eliminada correctamente`);
    } catch (error) {
        console.error('❌ Error al eliminar venta:', error);
        throw error;
    }
}
