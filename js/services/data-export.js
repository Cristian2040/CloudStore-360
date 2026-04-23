
import { getFirestore } from './firebase.js';

/**
 * Exporta todas las colecciones principales a un archivo Excel (.xlsx)
 */
export async function exportDatabase() {
    try {
        if (typeof XLSX === 'undefined') {
            throw new Error('La librería SheetJS (XLSX) no está cargada. Asegúrate de incluir el script en el HTML.');
        }

        const db = getFirestore();
        const workbook = XLSX.utils.book_new();

        // Metadata sheet
        const metadata = [{
            fecha_exportacion: new Date().toISOString(),
            generated_by: 'Sistema Tienda'
        }];
        const metadataSheet = XLSX.utils.json_to_sheet(metadata);
        XLSX.utils.book_append_sheet(workbook, metadataSheet, "Info");

        // Colecciones a exportar
        const collections = ['productos', 'ventas', 'clientes', 'gastos', 'movimientos_inventario', 'notas'];

        for (const collectionName of collections) {
            console.log(`📦 Procesando colección: ${collectionName}...`);
            const snapshot = await db.collection(collectionName).get();
            const data = [];

            snapshot.forEach(doc => {
                const docData = doc.data();

                // Aplanar y formatear datos para Excel
                const flatData = { id: doc.id };

                Object.entries(docData).forEach(([key, value]) => {
                    if (value && typeof value === 'object' && value.toDate) {
                        // Firebase Timestamp -> Date String
                        flatData[key] = value.toDate().toLocaleString();
                    } else if (Array.isArray(value)) {
                        // Arrays (como items de venta) -> JSON String para que quepa en una celda
                        flatData[key] = JSON.stringify(value);
                    } else if (value && typeof value === 'object') {
                        // Objetos anidados -> JSON String
                        flatData[key] = JSON.stringify(value);
                    } else {
                        // Primitivos
                        flatData[key] = value;
                    }
                });

                data.push(flatData);
            });

            if (data.length > 0) {
                const worksheet = XLSX.utils.json_to_sheet(data);
                // Ajustar ancho de columnas automáticamente (básico)
                const storedKeys = Object.keys(data[0]);
                worksheet['!cols'] = storedKeys.map(key => ({ wch: 20 }));

                XLSX.utils.book_append_sheet(workbook, worksheet, collectionName);
            } else {
                // Hoja vacía si no hay datos
                const worksheet = XLSX.utils.json_to_sheet([{ info: "Sin datos" }]);
                XLSX.utils.book_append_sheet(workbook, worksheet, collectionName);
            }
        }

        // Generar archivo y descargar
        const filename = `reporte_general_${new Date().toISOString().split('T')[0]}.xlsx`;
        XLSX.writeFile(workbook, filename);

        console.log('✅ Base de datos exportada a Excel correctamente');
        return true;
    } catch (error) {
        console.error('❌ Error al exportar a Excel:', error);
        throw error;
    }
}
