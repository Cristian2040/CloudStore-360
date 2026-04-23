// Servicio de Notas
import { getFirestore } from './firebase.js';

const COLLECTION_NAME = 'notas';

/**
 * Crea una nueva nota
 * @param {Object} noteData - Datos de la nota (contenido)
 * @returns {Promise<string>} ID de la nota creada
 */
export async function createNote(noteData) {
    try {
        const db = getFirestore();
        const user = firebase.auth().currentUser;

        if (!user) throw new Error('Usuario no autenticado');

        const note = {
            ...noteData,
            userId: user.uid,
            fechaCreacion: firebase.firestore.FieldValue.serverTimestamp(),
            fechaActualizacion: firebase.firestore.FieldValue.serverTimestamp()
        };

        const docRef = await db.collection(COLLECTION_NAME).add(note);
        return docRef.id;
    } catch (error) {
        console.error('Error al crear nota:', error);
        throw error;
    }
}

/**
 * Obtiene todas las notas del usuario actual
 * @returns {Promise<Array>} Lista de notas
 */
export async function getUserNotes() {
    try {
        const db = getFirestore();
        const user = firebase.auth().currentUser;

        if (!user) return [];

        const snapshot = await db.collection(COLLECTION_NAME)
            .where('userId', '==', user.uid)
            .orderBy('fechaActualizacion', 'desc')
            .get();

        const notes = [];
        snapshot.forEach(doc => {
            notes.push({
                id: doc.id,
                ...doc.data(),
                fechaActualizacion: doc.data().fechaActualizacion?.toDate()
            });
        });

        return notes;
    } catch (error) {
        console.error('Error al obtener notas:', error);
        return [];
    }
}

/**
 * Actualiza una nota existente
 * @param {string} noteId - ID de la nota
 * @param {Object} data - Datos a actualizar
 */
export async function updateNote(noteId, data) {
    try {
        const db = getFirestore();
        await db.collection(COLLECTION_NAME).doc(noteId).update({
            ...data,
            fechaActualizacion: firebase.firestore.FieldValue.serverTimestamp()
        });
    } catch (error) {
        console.error('Error al actualizar nota:', error);
        throw error;
    }
}

/**
 * Elimina una nota
 * @param {string} noteId - ID de la nota
 */
export async function deleteNote(noteId) {
    try {
        const db = getFirestore();
        await db.collection(COLLECTION_NAME).doc(noteId).delete();
    } catch (error) {
        console.error('Error al eliminar nota:', error);
        throw error;
    }
}
