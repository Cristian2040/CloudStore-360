/**
 * Global Search Module
 * Provides search functionality across products, clients, and sales
 */

// Import services dynamically based on page context
var searchServices = {
    products: null,
    clients: null,
    sales: null
};

// Initialize search when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    initGlobalSearch();
});

function initGlobalSearch() {
    const searchContainer = document.getElementById('global-search-container');
    const searchInput = document.getElementById('global-search-input');
    const searchResults = document.getElementById('global-search-results');
    const mobileToggle = document.getElementById('mobile-search-toggle');
    const closeBtn = document.getElementById('global-search-close');

    if (!searchInput) return;

    // Mobile toggle behavior
    if (mobileToggle) {
        mobileToggle.addEventListener('click', () => {
            searchContainer.classList.add('active');
            searchInput.focus();
        });
    }

    // Close button
    if (closeBtn) {
        closeBtn.addEventListener('click', () => {
            searchContainer.classList.remove('active');
            searchInput.value = '';
            searchResults.innerHTML = '';
            searchResults.classList.remove('visible');
        });
    }

    // Search input with debounce
    let debounceTimer;
    searchInput.addEventListener('input', (e) => {
        clearTimeout(debounceTimer);
        const query = e.target.value.trim();

        if (query.length < 2) {
            searchResults.innerHTML = '';
            searchResults.classList.remove('visible');
            return;
        }

        debounceTimer = setTimeout(() => {
            performSearch(query);
        }, 300);
    });

    // Close results when clicking outside
    document.addEventListener('click', (e) => {
        if (!searchContainer.contains(e.target)) {
            searchResults.classList.remove('visible');
        }
    });

    // Focus shows results if there are any
    searchInput.addEventListener('focus', () => {
        if (searchResults.innerHTML.trim()) {
            searchResults.classList.add('visible');
        }
    });

    // ESC key closes search
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            searchContainer.classList.remove('active');
            searchResults.classList.remove('visible');
        }
    });
}

async function performSearch(query) {
    const searchResults = document.getElementById('global-search-results');
    const closeBtn = document.getElementById('global-search-close');

    // Show close button when there is text
    if (closeBtn) closeBtn.style.display = 'flex';

    // Show loading
    searchResults.innerHTML = '<div class="search-loading"><i data-lucide="loader-circle" data-anim="pulse" style="width:1em; height:1em; vertical-align: middle;"></i> Buscando...</div>';
    searchResults.classList.add('visible');
    if (window.lucide) window.lucide.createIcons({ root: searchResults });
    if (window.initGlobalAnimations) window.initGlobalAnimations(searchResults);

    const results = {
        products: [],
        clients: [],
        sales: []
    };

    try {
        // Execute searches in parallel if services are available
        const promises = [];

        if (window.searchProducts) {
            promises.push(window.searchProducts(query).then(res => results.products = res));
        }

        if (window.searchClients) {
            promises.push(window.searchClients(query).then(res => results.clients = res));
        }

        if (window.searchSales) {
            promises.push(window.searchSales(query).then(res => results.sales = res));
        }

        if (window.searchGastos) {
            promises.push(window.searchGastos(query).then(res => results.gastos = res));
        }

        await Promise.all(promises);

        displaySearchResults(results, query);
    } catch (error) {
        console.error('Search error:', error);
        searchResults.innerHTML = '<div class="search-no-results"><p>Error al buscar. Intente nuevamente.</p></div>';
    }
}

function displaySearchResults(results, query) {
    const searchResults = document.getElementById('global-search-results');
    const totalResults = (results.products?.length || 0) + (results.clients?.length || 0) + (results.sales?.length || 0) + (results.gastos?.length || 0);

    if (totalResults === 0) {
        searchResults.innerHTML = `
            <div class="search-no-results">
                <span><i data-lucide="frown" style="width:2em; height:2em;"></i></span>
                <p>No se encontraron resultados para "<strong>${escapeHtml(query)}</strong>"</p>
            </div>
        `;
        if (window.lucide) window.lucide.createIcons({ root: searchResults });
        return;
    }

    let html = '';

    // Products section
    if (results.products && results.products.length > 0) {
        html += `
            <div class="search-section">
                <div class="search-section-title"><i data-lucide="package" style="width:1em; height:1em; vertical-align: middle;"></i> Productos (${results.products.length})</div>
                ${results.products.slice(0, 5).map(p => `
                    <a href="productos.html?highlight=${p.id}" class="search-result-item">
                        <span class="search-result-icon"><i data-lucide="package" style="width:1em; height:1em; vertical-align: middle;"></i></span>
                        <div class="search-result-info">
                            <div class="search-result-name">${escapeHtml(p.nombre)}</div>
                            <div class="search-result-detail">$${p.precio?.toFixed(2) || '0.00'} · Stock: ${p.stock || 0}</div>
                        </div>
                    </a>
                `).join('')}
                ${results.products.length > 5 ? `<a href="productos.html?search=${encodeURIComponent(query)}" class="search-view-all">Ver todos los productos →</a>` : ''}
            </div>
        `;
    }

    // Clients section
    if (results.clients && results.clients.length > 0) {
        html += `
            <div class="search-section">
                <div class="search-section-title"><i data-lucide="users" style="width:1em; height:1em; vertical-align: middle;"></i> Clientes (${results.clients.length})</div>
                ${results.clients.slice(0, 5).map(c => `
                    <a href="clientes.html?highlight=${c.id}" class="search-result-item">
                        <span class="search-result-icon"><i data-lucide="user" style="width:1em; height:1em; vertical-align: middle;"></i></span>
                        <div class="search-result-info">
                            <div class="search-result-name">${escapeHtml(c.nombre)}</div>
                            <div class="search-result-detail">${c.telefono || c.email || 'Sin contacto'}</div>
                        </div>
                    </a>
                `).join('')}
                ${results.clients.length > 5 ? `<a href="clientes.html?search=${encodeURIComponent(query)}" class="search-view-all">Ver todos los clientes →</a>` : ''}
            </div>
        `;
    }

    // Sales section
    if (results.sales && results.sales.length > 0) {
        html += `
            <div class="search-section">
                <div class="search-section-title"><i data-lucide="shopping-cart" style="width:1em; height:1em; vertical-align: middle;"></i> Ventas (${results.sales.length})</div>
                ${results.sales.slice(0, 5).map(s => `
                    <a href="ventas.html?highlight=${s.id}" class="search-result-item">
                        <span class="search-result-icon"><i data-lucide="receipt" style="width:1em; height:1em; vertical-align: middle;"></i></span>
                        <div class="search-result-info">
                            <div class="search-result-name">Venta #${s.id?.slice(-6) || 'N/A'}</div>
                            <div class="search-result-detail">$${s.total?.toFixed(2) || '0.00'} · ${formatSearchDate(s.fecha)}</div>
                        </div>
                    </a>
                `).join('')}
            </div>
        `;
    }

    // Expenses (Gastos) section
    if (results.gastos && results.gastos.length > 0) {
        html += `
            <div class="search-section">
                <div class="search-section-title"><i data-lucide="receipt" style="width:1em; height:1em; vertical-align: middle;"></i> Gastos (${results.gastos.length})</div>
                ${results.gastos.slice(0, 5).map(g => `
                    <a href="gastos.html?highlight=${g.id}" class="search-result-item">
                        <span class="search-result-icon"><i data-lucide="wallet" style="width:1em; height:1em; vertical-align: middle;"></i></span>
                        <div class="search-result-info">
                            <div class="search-result-name">${escapeHtml(g.descripcion || g.categoria)}</div>
                            <div class="search-result-detail">$${g.monto?.toFixed(2) || '0.00'} · ${formatSearchDate(g.fecha)}</div>
                        </div>
                    </a>
                `).join('')}
                ${results.gastos.length > 5 ? `<a href="gastos.html?search=${encodeURIComponent(query)}" class="search-view-all">Ver todos los gastos →</a>` : ''}
            </div>
        `;
    }

    searchResults.innerHTML = html;
    if (window.lucide) window.lucide.createIcons({ root: searchResults });
    if (window.initGlobalAnimations) window.initGlobalAnimations(searchResults);
}

function formatSearchDate(fecha) {
    if (!fecha) return 'Sin fecha';
    try {
        const date = fecha.toDate ? fecha.toDate() : new Date(fecha);
        return date.toLocaleDateString('es-MX', { day: 'numeric', month: 'short' });
    } catch {
        return 'Sin fecha';
    }
}

function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Export search functions for pages to implement
window.registerSearchService = function (type, searchFn) {
    if (type === 'products') window.searchProducts = searchFn;
    if (type === 'clients') window.searchClients = searchFn;
    if (type === 'sales') window.searchSales = searchFn;
    if (type === 'gastos') window.searchGastos = searchFn;
};
