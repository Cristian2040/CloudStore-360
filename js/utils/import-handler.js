/**
 * Utility to handle file imports from legacy systems
 */

export class ImportHandler {
    /**
     * Parse the legacy TSV/Excel export file
     * @param {File} file - The file object from input
     * @returns {Promise<Array>} Array of product objects
     */
    static async parseInventoryFile(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();

            reader.onload = (e) => {
                try {
                    const text = e.target.result;
                    let products = [];

                    // Detect file type by extension or content
                    if (file.name.endsWith('.csv') || text.includes(',')) {
                        products = this.processCSVData(text);
                    } else {
                        products = this.processTSVData(text);
                    }

                    resolve(products);
                } catch (error) {
                    reject(error);
                }
            };

            reader.onerror = () => reject(new Error('Error al leer el archivo'));
            // Use ISO-8859-1 (Latin1) to handle accents correctly in typical Excel CSVs
            reader.readAsText(file, 'ISO-8859-1');
        });
    }

    /**
     * Process CSV text (comma separated)
     */
    static processCSVData(text) {
        const lines = text.split(/\r\n|\n/);
        const products = [];

        // Detect headers to map columns dynamically
        // Format anticipated: Nombre del Producto,Precio Venta,Costo

        for (let i = 1; i < lines.length; i++) {
            const line = lines[i].trim();
            if (!line) continue;

            // Simple CSV split (handling basic commas)
            // Note: Does not handle commas inside quotes, but sufficient for simple files
            const columns = line.split(',');

            if (columns.length < 2) continue;

            try {
                // Mapping based on "Nombre, Precio, Costo" structure
                // Col 0: Nombre
                // Col 1: Precio Venta
                // Col 2: Costo (Optional)

                const nombre = columns[0]?.trim();
                const precio = this.parseCurrency(columns[1]);
                const costo = columns[2] ? this.parseCurrency(columns[2]) : undefined;

                if (nombre) {
                    const product = {
                        nombre: nombre,
                        precio: precio,
                    };

                    if (costo !== undefined) product.costo = costo;

                    // Do not set stock or other fields to allow partial updates
                    products.push(product);
                }
            } catch (err) {
                console.warn(`Error parsing CSV line ${i}:`, err);
            }
        }

        return products;
    }

    /**
     * Process raw TSV text into product objects
     * @param {string} text - Raw text content
     * @returns {Array} List of mapped products
     */
    static processTSVData(text) {
        const lines = text.split(/\r\n|\n/);
        const products = [];

        // Skip header row (starts at index 1)
        // Assuming headers: Codigo, Descripcion, Precio Costo, Precio Venta, Precio Mayoreo, Inventario, Inv. Minimo, Departamento

        for (let i = 1; i < lines.length; i++) {
            const line = lines[i].trim();
            if (!line) continue;

            const columns = line.split('\t'); // Split by Tab

            // Ensure we have enough columns (basic validation)
            if (columns.length < 4) continue;

            try {
                // Map columns based on user's file structure
                // 0: Codigo
                // 1: Descripcion
                // 2: Precio Costo
                // 3: Precio Venta
                // 5: Inventario
                // 7: Departamento

                const product = {
                    codigoBarras: columns[0]?.trim() || '',
                    nombre: columns[1]?.trim() || 'Sin Nombre',
                    costo: this.parseCurrency(columns[2]),
                    precio: this.parseCurrency(columns[3]),
                    stock: parseFloat(columns[5] || '0'),
                    categoria: columns[7]?.trim() || 'General',
                    activo: true,
                    fechaCreacion: new Date()
                };

                // Basic validation
                if (product.nombre && product.precio >= 0) {
                    products.push(product);
                }
            } catch (err) {
                console.warn(`Error parsing line ${i}:`, err);
            }
        }

        return products;
    }

    /**
     * Helper to clean currency strings (e.g., "$35.00")
     */
    static parseCurrency(value) {
        if (!value) return 0;
        // Remove $ and commas, then parse
        const clean = value.toString().replace(/[$,]/g, '').trim();
        const number = parseFloat(clean);
        return isNaN(number) ? 0 : number;
    }
}
