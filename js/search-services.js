/**
 * Search Services
 * Provides search functionality for products, clients, and sales
 * This file should be loaded after Firebase is initialized
 */

// Import the necessary services
import { searchProducts } from './services/products.js';
import { getAllClientes } from './services/clientes.js';
import { getAllSales, getAllSales as getAllSales_alias } from './services/sales.js'; // Assuming getAllSales is exported
import { searchGastos } from './services/gastos.js';

// Register search service for products
window.searchProducts = async function (query) {
    try {
        // Use the searchProducts function directly from products service
        const products = await searchProducts(query);
        return products.slice(0, 10);
    } catch (error) {
        console.error('Error searching products:', error);
        return [];
    }
};

// Register search service for clients
window.searchClients = async function (query) {
    try {
        const clients = await getAllClientes();
        const lowerQuery = query.toLowerCase();

        return clients.filter(c =>
            c.nombre?.toLowerCase().includes(lowerQuery) ||
            c.telefono?.includes(query) ||
            c.email?.toLowerCase().includes(lowerQuery)
        ).slice(0, 10);
    } catch (error) {
        console.error('Error searching clients:', error);
        return [];
    }
};

// Register search service for sales
window.searchSales = async function (query) {
    try {
        const sales = await getAllSales();
        const lowerQuery = query.toLowerCase();

        return sales.filter(s => {
            // Search by ID
            if (s.id?.toLowerCase().includes(lowerQuery)) return true;

            // Search by product names in items
            if (s.items?.some(item =>
                item.nombre?.toLowerCase().includes(lowerQuery)
            )) return true;

            // Search by client name
            if (s.cliente?.toLowerCase().includes(lowerQuery)) return true;

            // Search by date (e.g. "14 feb", "2023-02")
            try {
                if (s.fecha) {
                    const date = s.fecha.toDate ? s.fecha.toDate() : new Date(s.fecha);
                    // Format variations: "14/02/2024", "14 feb 2024", "february"
                    const dateStr = date.toLocaleDateString('es-MX').toLowerCase(); // 14/2/2024
                    const dateFullStr = date.toLocaleDateString('es-MX', { day: 'numeric', month: 'long', year: 'numeric' }).toLowerCase(); // 14 de febrero de 2024
                    const dateShortStr = date.toLocaleDateString('es-MX', { day: 'numeric', month: 'short' }).toLowerCase(); // 14 feb

                    if (dateStr.includes(lowerQuery) || dateFullStr.includes(lowerQuery) || dateShortStr.includes(lowerQuery)) {
                        return true;
                    }
                }
            } catch (e) {
                // ignore date parsing errors
            }

            return false;
        }).slice(0, 10);
    } catch (error) {
        console.error('Error searching sales:', error);
        return [];
    }
};

// Register search service for expenses
window.searchGastos = async function (query) {
    try {
        const gastos = await searchGastos(query);
        return gastos.slice(0, 10);
    } catch (error) {
        console.error('Error searching gastos:', error);
        return [];
    }
};

console.log('✅ Search services registered');
