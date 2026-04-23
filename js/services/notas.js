
import { getFirestore } from '../firebase.js';

const COLLECTION_NAME = 'notas';

/**
 * Crea una nueva nota
 * @param {Object} noteData - Datos de la nota { titulo, contenido, color }
 * @returns {Promise<string>} ID de la nota creada
 */
export async function createNote(noteData) {
    try {
        const db = getFirestore();
        const user = firebase.auth().currentUser;

        if (!user) throw new Error('Usuario no autenticado');

        const note = {
            userId: user.uid,
            titulo: noteData.titulo || '',
            contenido: noteData.contenido || '',
            color: noteData.color || '#ffffff',
            fechaCreatcion: firebase.firestore.FieldValue.serverTimestamp(),
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
 * Actualiza una nota existente
 * @param {string} id - ID de la nota
 * @param {Object} noteData - Datos a actualizar
 */
export async function updateNote(id, noteData) {
    try {
        const db = getFirestore();
        const noteRef = db.collection(COLLECTION_NAME).doc(id);

        await noteRef.update({
            ...noteData,
            fechaActualizacion: firebase.firestore.FieldValue.serverTimestamp()
        });
    } catch (error) {
        console.error('Error al actualizar nota:', error);
        throw error;
    }
}

/**
 * Elimina una nota
 * @param {string} id - ID de la nota
 */
export async function deleteNote(id) {
    try {
        const db = getFirestore();
        await db.collection(COLLECTION_NAME).doc(id).delete();
    } catch (error) {
        console.error('Error al eliminar nota:', error);
        throw error;
    }
}

/**
 * Suscribe a los cambios de las notas del usuario
 * @param {Function} callback - Función a ejecutar cuando cambian los datos
 * @returns {Function} Función para desuscribirse
 */
export function subscribeToNotes(callback) {
    const db = getFirestore();
    const user = firebase.auth().currentUser;

    if (!user) {
        console.error('Usuario no autenticado');
        return () => { };
    }

    return db.collection(COLLECTION_NAME)
        .where('userId', '==', user.uid)
        .orderBy('fechaActualizacion', 'desc')
        .onSnapshot((snapshot) => {
            const notes = [];
            snapshot.forEach((doc) => {
                notes.push({
                    id: doc.id,
                    ...doc.data(),
                    fecha: doc.data().fechaActualizacion?.toDate()
                });
            });
            callback(notes);
        }, (error) => {
            console.error('Error al obtener notas en tiempo real:', error);
        });
}
