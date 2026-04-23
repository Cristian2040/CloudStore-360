import {
    createNote,
    updateNote,
    deleteNote,
    getUserNotes
} from './services/notes.js';
import { onAuthStateChanged } from './services/firebase.js';

// HTML Template for the Notes Widget
const NOTES_WIDGET_HTML = `
<div id="notes-panel" class="notes-panel">
    <div class="notes-header">
        <h3><i data-lucide="notebook-pen" style="width:1em; height:1em; vertical-align: middle;"></i> Mis Notas</h3>
        <button id="close-notes-btn" class="notes-close-btn">&times;</button>
    </div>
    <div class="notes-toolbar">
        <button id="add-note-btn" class="notes-btn-primary">+ Nueva Nota</button>
    </div>
    <div id="notes-list" class="notes-list">
        <!-- Notes will be inserted here -->
        <p class="notes-empty">Cargando notas...</p>
    </div>
    <div id="note-editor" class="note-editor hidden">
        <input type="text" id="note-title-input" placeholder="Título de la nota..." class="note-input-title">
        <textarea id="note-content-input" placeholder="Escribe aquí tu nota..." class="note-input-content"></textarea>
        <div class="editor-actions">
            <button id="delete-note-btn" class="notes-btn-danger">Eliminar</button>
            <button id="save-note-btn" class="notes-btn-primary">Guardar</button>
            <button id="cancel-edit-btn" class="notes-btn-secondary">Volver</button>
        </div>
    </div>
</div>
<div id="notes-overlay" class="notes-overlay"></div>
`;

// Inject Styles dynamically (or add to css/styles.css - I'll do styles.css for maintainability, but inline styles for quick preview if needed. I'll stick to styles.css)

document.addEventListener('DOMContentLoaded', () => {
    // Inject HTML
    const div = document.createElement('div');
    div.innerHTML = NOTES_WIDGET_HTML;
    document.body.appendChild(div);
    if (window.lucide) window.lucide.createIcons({ root: div });

    // Initial Setup
    setupNotesButton();
    setupEventListeners();

    // Auth Listener to load notes
    onAuthStateChanged(user => {
        if (user) {
            loadNotes();
        } else {
            document.getElementById('notes-list').innerHTML = '<p class="notes-empty">Inicia sesión para ver tus notas.</p>';
        }
    });
});

let currentNotes = [];
let activeNoteId = null;

function setupNotesButton() {
    // Determine the right container based on screen size due to mobile responsive layout
    let targetContainer = document.querySelector('.navbar-user-mobile');
    if (!targetContainer || window.innerWidth > 768) {
        targetContainer = document.querySelector('.navbar-user');
    }

    if (targetContainer) {
        const btn = document.createElement('button');
        btn.id = 'toggle-notes-btn';
        btn.className = 'navbar-icon-btn';
        btn.innerHTML = '<i data-lucide="notebook-pen" style="width:1em; height:1em;"></i>';
        btn.title = 'Mis Notas';

        // Insert before the dropdown
        targetContainer.insertBefore(btn, targetContainer.firstChild);
        if (window.lucide) window.lucide.createIcons({ root: btn });

        btn.addEventListener('click', toggleNotesPanel);
    }
}

function setupEventListeners() {
    document.getElementById('close-notes-btn').addEventListener('click', closeNotesPanel);
    document.getElementById('notes-overlay').addEventListener('click', closeNotesPanel);

    document.getElementById('add-note-btn').addEventListener('click', () => showEditor(null));
    document.getElementById('cancel-edit-btn').addEventListener('click', hideEditor);

    document.getElementById('save-note-btn').addEventListener('click', saveCurrentNote);
    document.getElementById('delete-note-btn').addEventListener('click', deleteCurrentNote);
}

function toggleNotesPanel() {
    const panel = document.getElementById('notes-panel');
    const overlay = document.getElementById('notes-overlay');
    panel.classList.toggle('active');
    overlay.classList.toggle('active');

    if (panel.classList.contains('active')) {
        loadNotes();
    }
}

function closeNotesPanel() {
    document.getElementById('notes-panel').classList.remove('active');
    document.getElementById('notes-overlay').classList.remove('active');
}

async function loadNotes() {
    const list = document.getElementById('notes-list');
    list.innerHTML = '<p class="notes-empty">Cargando...</p>';

    try {
        currentNotes = await getUserNotes();
        renderNotesList();
    } catch (error) {
        console.error('Error loading notes:', error);
        list.innerHTML = '<p class="notes-empty error">Error al cargar notas.</p>';
    }
}

function renderNotesList() {
    const list = document.getElementById('notes-list');

    if (currentNotes.length === 0) {
        list.innerHTML = '<p class="notes-empty">No tienes notas. ¡Crea una nueva!</p>';
        return;
    }

    list.innerHTML = currentNotes.map(note => `
        <div class="note-item" data-id="${note.id}">
            <div class="note-item-title">${escapeHtml(note.title || 'Sin título')}</div>
            <div class="note-item-preview">${escapeHtml(note.content ? note.content.substring(0, 50) + '...' : 'Sin contenido')}</div>
            <div class="note-item-date">${formatDate(note.fechaActualizacion)}</div>
        </div>
    `).join('');

    // Add click listeners
    document.querySelectorAll('.note-item').forEach(item => {
        item.addEventListener('click', () => {
            const id = item.dataset.id;
            const note = currentNotes.find(n => n.id === id);
            showEditor(note);
        });
    });
}

function showEditor(note) {
    const editor = document.getElementById('note-editor');
    const list = document.getElementById('notes-list');
    const toolbar = document.querySelector('.notes-toolbar');
    const deleteBtn = document.getElementById('delete-note-btn');

    activeNoteId = note ? note.id : null;

    document.getElementById('note-title-input').value = note ? note.title || '' : '';
    document.getElementById('note-content-input').value = note ? note.content || '' : '';

    if (note) {
        deleteBtn.style.display = 'block';
    } else {
        deleteBtn.style.display = 'none';
    }

    editor.classList.remove('hidden');
    list.classList.add('hidden');
    toolbar.classList.add('hidden');
}

function hideEditor() {
    const editor = document.getElementById('note-editor');
    const list = document.getElementById('notes-list');
    const toolbar = document.querySelector('.notes-toolbar');

    editor.classList.add('hidden');
    list.classList.remove('hidden');
    toolbar.classList.remove('hidden');
    activeNoteId = null;
}

async function saveCurrentNote() {
    const title = document.getElementById('note-title-input').value.trim();
    const content = document.getElementById('note-content-input').value.trim();
    const saveBtn = document.getElementById('save-note-btn');

    if (!title && !content) {
        alert('La nota no puede estar vacía');
        return;
    }

    saveBtn.textContent = 'Guardando...';
    saveBtn.disabled = true;

    try {
        if (activeNoteId) {
            await updateNote(activeNoteId, { title, content });
        } else {
            await createNote({ title, content });
        }

        await loadNotes();
        hideEditor();
    } catch (error) {
        console.error('Error saving note:', error);
        alert('Error al guardar la nota');
    } finally {
        saveBtn.textContent = 'Guardar';
        saveBtn.disabled = false;
    }
}

async function deleteCurrentNote() {
    if (!activeNoteId) return;

    if (!confirm('¿Eliminar esta nota?')) return;

    const deleteBtn = document.getElementById('delete-note-btn');
    deleteBtn.textContent = '...';
    deleteBtn.disabled = true;

    try {
        await deleteNote(activeNoteId);
        await loadNotes();
        hideEditor();
    } catch (error) {
        console.error('Error deleting note:', error);
        alert('Error al eliminar la nota');
    } finally {
        deleteBtn.textContent = 'Eliminar';
        deleteBtn.disabled = false;
    }
}

// Utilities
function escapeHtml(text) {
    if (!text) return text;
    return text
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

function formatDate(date) {
    if (!date) return '';
    const d = date instanceof Date ? date : date.toDate();
    return d.toLocaleDateString('es-MX', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
}
