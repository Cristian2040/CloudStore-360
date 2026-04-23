// Servicio de Caja - Gestión de cortes de caja
import { getFirestore } from './firebase.js';

export const COLLECTION_NAME = 'cortes_caja';

/**
 * Registra un nuevo corte de caja
 * @param {Object} corteData - Datos del corte
 * @returns {Promise<string>} ID del corte creado
 */
export async function createCorteCaja(corteData) {
    try {
        const db = getFirestore();

        // Validar datos básicos
        if (corteData.efectivoReal === undefined || corteData.efectivoEsperado === undefined) {
             throw new Error('Faltan datos financieros para el corte (Efectivo real/esperado)');
        }

        const docRef = db.collection(COLLECTION_NAME).doc();

        const corte = {
            fecha: firebase.firestore.FieldValue.serverTimestamp(),
            ventasTotales: parseFloat(corteData.ventasTotales) || 0,
            ventasEfectivo: parseFloat(corteData.ventasEfectivo) || 0,
            ventasTarjeta: parseFloat(corteData.ventasTarjeta) || 0,
            ventasTransferencia: parseFloat(corteData.ventasTransferencia) || 0,
            gastosEfectivo: parseFloat(corteData.gastosEfectivo) || 0,
            fondoCaja: parseFloat(corteData.fondoCaja) || 0,
            efectivoEsperado: parseFloat(corteData.efectivoEsperado) || 0,
            efectivoReal: parseFloat(corteData.efectivoReal) || 0,
            diferencia: parseFloat(corteData.diferencia) || 0,
            notas: corteData.notas || '',
            fechaCorte: new Date().toISOString()
        };

        // Guardarlo todo
        await docRef.set(corte);
        console.log('✅ Corte de caja registrado:', docRef.id);
        
        return docRef.id;
    } catch (error) {
        console.error('❌ Error al registrar corte de caja:', error);
        throw error;
    }
}
