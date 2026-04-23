// Servicio de Productos
import { getFirestore } from './firebase.js';

const COLLECTION_NAME = 'productos';

/**
 * Obtiene todos los productos
 * @returns {Promise<Array>} Array de productos
 */
export async function getAllProducts() {
    try {
        const db = getFirestore();
        const snapshot = await db.collection(COLLECTION_NAME).orderBy('nombre').get();

        const products = [];
        snapshot.forEach(doc => {
            products.push({
                id: doc.id,
                ...doc.data()
            });
        });

        console.log(`✅ ${products.length} productos obtenidos`);
        return products;
    } catch (error) {
        console.error('❌ Error al obtener productos:', error);
        throw error;
    }
}

/**
 * Obtiene un producto por ID
 * @param {string} id - ID del producto
 * @returns {Promise<Object>} Producto encontrado
 */
export async function getProductById(id) {
    try {
        const db = getFirestore();
        const doc = await db.collection(COLLECTION_NAME).doc(id).get();

        if (!doc.exists) {
            throw new Error('Producto no encontrado');
        }

        return {
            id: doc.id,
            ...doc.data()
        };
    } catch (error) {
        console.error('❌ Error al obtener producto:', error);
        throw error;
    }
}

/**
 * Crea un nuevo producto
 * @param {Object} productData - Datos del producto
 * @returns {Promise<string>} ID del producto creado
 */
export async function createProduct(productData) {
    try {
        const db = getFirestore();

        // Validar datos requeridos
        validateProductData(productData);

        const product = {
            nombre: productData.nombre,
            descripcion: productData.descripcion || '',
            unidad: productData.unidad || 'pza',
            precio: parseFloat(productData.precio),
            costo: parseFloat(productData.costo || 0),
            stock: parseFloat(productData.stock || 0),
            categoria: productData.categoria || 'General',
            codigoBarras: productData.codigoBarras || '',
            imagen: productData.imagen || '',
            activo: true,
            fechaCreacion: firebase.firestore.FieldValue.serverTimestamp(),
            fechaActualizacion: firebase.firestore.FieldValue.serverTimestamp()
        };

        const docRef = await db.collection(COLLECTION_NAME).add(product);
        console.log('✅ Producto creado:', docRef.id);
        return docRef.id;
    } catch (error) {
        console.error('❌ Error al crear producto:', error);
        throw error;
    }
}

/**
 * Crea o actualiza múltiples productos en un lote (Upsert)
 * @param {Array} products - Array de productos
 */
export async function batchCreateProducts(products) {
    try {
        const db = getFirestore();
        const collectionRef = db.collection(COLLECTION_NAME);

        // 1. Obtener todos los productos existentes para verificar duplicados
        // (Optimización: en una BD muy grande esto debería ser paginado o por lotes de consulta)
        const snapshot = await collectionRef.get();
        const existingProductsMap = new Map();
        const existingNamesMap = new Map();

        snapshot.forEach(doc => {
            const data = doc.data();
            if (data.codigoBarras) {
                existingProductsMap.set(data.codigoBarras, doc.id);
            }
            if (data.nombre) {
                existingNamesMap.set(data.nombre.toLowerCase().trim(), doc.id);
            }
        });

        // 2. Preparar lotes
        const batchSize = 400; // Límite seguro de Firebase
        const chunks = [];
        for (let i = 0; i < products.length; i += batchSize) {
            chunks.push(products.slice(i, i + batchSize));
        }

        let createdCount = 0;
        let updatedCount = 0;

        for (const chunk of chunks) {
            const batch = db.batch();

            chunk.forEach(productData => {
                const codigo = productData.codigoBarras;
                const nombreNorm = (productData.nombre || '').toLowerCase().trim();
                let docRef;
                let existingId = null;

                // Prioridad: Código de Barras > Nombre Exacto
                if (codigo && existingProductsMap.has(codigo)) {
                    existingId = existingProductsMap.get(codigo);
                } else if (nombreNorm && existingNamesMap.has(nombreNorm)) {
                    existingId = existingNamesMap.get(nombreNorm);
                }

                if (existingId) {
                    // ACTUALIZAR (Si ya existe)
                    docRef = collectionRef.doc(existingId);

                    const updates = {
                        fechaActualizacion: firebase.firestore.FieldValue.serverTimestamp()
                    };

                    // Solo actualizar campos presentes en los datos de entrada
                    if (productData.nombre) {
                        let newName = productData.nombre;
                        if (!newName.includes('(Revisar)')) {
                            newName = newName + ' (Revisar)';
                        }
                        updates.nombre = newName;
                    }
                    if (productData.precio !== undefined) updates.precio = parseFloat(productData.precio);
                    if (productData.costo !== undefined) updates.costo = parseFloat(productData.costo);
                    if (productData.stock !== undefined && !isNaN(parseFloat(productData.stock))) updates.stock = parseFloat(productData.stock);
                    if (productData.categoria) updates.categoria = productData.categoria;
                    if (productData.codigoBarras) updates.codigoBarras = productData.codigoBarras;
                    if (productData.descripcion) updates.descripcion = productData.descripcion;
                    if (productData.unidad) updates.unidad = productData.unidad;

                    batch.update(docRef, updates);
                    updatedCount++;
                } else {
                    // CREAR (Si es nuevo)
                    docRef = collectionRef.doc();

                    // Valores por defecto para nuevos productos
                    const newProduct = {
                        nombre: productData.nombre || 'Sin Nombre',
                        descripcion: productData.descripcion || '',
                        unidad: productData.unidad || 'pza',
                        precio: parseFloat(productData.precio || 0),
                        costo: parseFloat(productData.costo || 0),
                        stock: parseFloat(productData.stock || 0),
                        categoria: productData.categoria || 'General',
                        codigoBarras: productData.codigoBarras || '', // Puede estar vacío
                        imagen: productData.imagen || '',
                        activo: true,
                        fechaCreacion: firebase.firestore.FieldValue.serverTimestamp(),
                        fechaActualizacion: firebase.firestore.FieldValue.serverTimestamp()
                    };

                    batch.set(docRef, newProduct);
                    createdCount++;
                }
            });

            await batch.commit();
            console.log(`✅ Lote procesado.`);
        }

        console.log(`Resumen: ${createdCount} creados, ${updatedCount} actualizados.`);
        return createdCount + updatedCount;
    } catch (error) {
        console.error('❌ Error en carga masiva:', error);
        throw error;
    }
}

/**
 * Actualiza un producto existente
 * @param {string} id - ID del producto
 * @param {Object} productData - Datos actualizados
 */
export async function updateProduct(id, productData) {
    try {
        const db = getFirestore();

        const updates = {
            ...productData,
            fechaActualizacion: firebase.firestore.FieldValue.serverTimestamp()
        };

        // Convertir tipos de datos
        if (updates.precio) updates.precio = parseFloat(updates.precio);
        if (updates.costo) updates.costo = parseFloat(updates.costo);
        if (updates.stock !== undefined) updates.stock = parseFloat(updates.stock);

        await db.collection(COLLECTION_NAME).doc(id).update(updates);
        console.log('✅ Producto actualizado:', id);
    } catch (error) {
        console.error('❌ Error al actualizar producto:', error);
        throw error;
    }
}

/**
 * Elimina un producto (soft delete)
 * @param {string} id - ID del producto
 */
export async function deleteProduct(id) {
    try {
        const db = getFirestore();

        // Soft delete: marcar como inactivo
        await db.collection(COLLECTION_NAME).doc(id).update({
            activo: false,
            fechaActualizacion: firebase.firestore.FieldValue.serverTimestamp()
        });

        console.log('✅ Producto eliminado:', id);
    } catch (error) {
        console.error('❌ Error al eliminar producto:', error);
        throw error;
    }
}

/**
 * Actualiza el stock de un producto
 * @param {string} id - ID del producto
 * @param {number} cantidad - Cantidad a agregar (positivo) o restar (negativo)
 */
export async function updateProductStock(id, cantidad) {
    try {
        const db = getFirestore();

        const docRef = db.collection(COLLECTION_NAME).doc(id);
        const doc = await docRef.get();

        if (!doc.exists) {
            throw new Error('Producto no encontrado');
        }

        const currentStock = doc.data().stock || 0;
        const newStock = currentStock + cantidad;

        if (newStock < 0) {
            throw new Error('Stock insuficiente');
        }

        await docRef.update({
            stock: newStock,
            fechaActualizacion: firebase.firestore.FieldValue.serverTimestamp()
        });

        console.log(`✅ Stock actualizado: ${currentStock} → ${newStock}`);
    } catch (error) {
        console.error('❌ Error al actualizar stock:', error);
        throw error;
    }
}

/**
 * Busca productos por nombre o código de barras
 * @param {string} query - Término de búsqueda
 * @returns {Promise<Array>} Productos encontrados
 */
export async function searchProducts(query) {
    try {
        const db = getFirestore();
        const queryLower = query.toLowerCase();

        // Obtener todos los productos (Firebase no soporta búsqueda LIKE)
        const snapshot = await db.collection(COLLECTION_NAME)
            .where('activo', '==', true)
            .get();

        const products = [];
        snapshot.forEach(doc => {
            const data = doc.data();
            const nombre = (data.nombre || '').toLowerCase();
            const codigoBarras = (data.codigoBarras || '').toLowerCase();

            if (nombre.includes(queryLower) || codigoBarras.includes(queryLower)) {
                products.push({
                    id: doc.id,
                    ...data
                });
            }
        });

        console.log(`✅ ${products.length} productos encontrados`);
        return products;
    } catch (error) {
        console.error('❌ Error al buscar productos:', error);
        throw error;
    }
}

/**
 * Obtiene productos con stock bajo
 * @param {number} threshold - Umbral de stock bajo (default: 10)
 * @returns {Promise<Array>} Productos con stock bajo
 */
export async function getLowStockProducts(threshold = 10) {
    try {
        const db = getFirestore();
        const snapshot = await db.collection(COLLECTION_NAME)
            .where('activo', '==', true)
            .where('stock', '<=', threshold)
            .get();

        const products = [];
        snapshot.forEach(doc => {
            products.push({
                id: doc.id,
                ...doc.data()
            });
        });

        console.log(`✅ ${products.length} productos con stock bajo`);
        return products;
    } catch (error) {
        console.error('❌ Error al obtener productos con stock bajo:', error);
        throw error;
    }
}

/**
 * Valida los datos del producto
 * @param {Object} data - Datos a validar
 */
function validateProductData(data) {
    if (!data.nombre || data.nombre.trim() === '') {
        throw new Error('El nombre del producto es requerido');
    }

    if (!data.precio || parseFloat(data.precio) <= 0) {
        throw new Error('El precio debe ser mayor a 0');
    }
}

/**
 * Obtiene productos por categoría
 * @param {string} categoria - Nombre de la categoría
 * @returns {Promise<Array>} Productos de la categoría
 */
export async function getProductsByCategory(categoria) {
    try {
        const db = getFirestore();
        const snapshot = await db.collection(COLLECTION_NAME)
            .where('categoria', '==', categoria)
            .where('activo', '==', true)
            .get();

        const products = [];
        snapshot.forEach(doc => {
            products.push({
                id: doc.id,
                ...doc.data()
            });
        });

        return products;
    } catch (error) {
        console.error('❌ Error al obtener productos por categoría:', error);
        throw error;
    }
}
