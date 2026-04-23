import { GEMINI_API_KEY } from '../gemini-config.js';

const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent';

/**
 * Convierte un archivo a Base64
 * @param {File} file 
 * @returns {Promise<string>} Promesa que resuelve en Base64 (sin el prefijo data:MIME;base64,)
 */
export function fileToBase64(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => {
            let base64String = reader.result;
            // Remover el prefijo 'data:image/jpeg;base64,' o 'data:application/pdf;base64,'
            const substrIndex = base64String.indexOf(',') + 1;
            resolve(base64String.substring(substrIndex));
        };
        reader.onerror = error => reject(error);
    });
}

/**
 * Procesa la imagen del ticket junto con el inventario actual para extraer información estructurada
 * @param {string} fileBase64 - Archivo en base64 (sin la cabecera MIME)
 * @param {string} mimeType - Tipo MIME del archivo (ej. image/jpeg, application/pdf)
 * @param {Array} inventario - Arreglo de productos ({ codigoBarras, nombre, precioVenta, stock, ... })
 * @returns {Promise<Object>} JSON con la extracción y mapeo
 */
export async function procesarTicketConGemini(fileBase64, mimeType, inventario) {
    if (!GEMINI_API_KEY || GEMINI_API_KEY === 'TU_API_KEY_AQUI') {
        throw new Error('API Key de Gemini no configurada.');
    }

    // Simplificar el inventario para no enviar datos innecesarios a la API (ahorra tokens)
    const inventarioReducido = inventario.map(p => ({
        id: p.id,
        nombre: p.nombre,
        codigoBarras: p.codigoBarras,
        precio: p.precio
    }));

    const prompt = `
Eres un asistente experto en contabilidad e inventarios de tiendas locales.
Tu tarea es leer este ticket de compra (Nota de Venta, Remisión o Factura) que usualmente tiene nombres de productos acortados.
Debes extraer la siguiente información y devolverla EXCLUSIVAMENTE en formato JSON, sin texto markdown alrededor ni explicaciones.

Reglas para la extracción:
1. "fecha": La fecha de la compra en formato "YYYY-MM-DD". Si no hay, usa "1970-01-01".
2. "total": El monto total pagado en el ticket (número).
3. "productos": Un arreglo de objetos. Por cada línea en el ticket, extrae la cantidad comprada.
   - ¡CUIDADO CON LAS PRESENTACIONES!: NO multipliques por el tamaño o formato del paquete. Por ejemplo, si dice "PALL MALL 20s" o "COCA 600ML" con cantidad 3, la "cantidadTotalUnidades" es 3. El "20s" se refiere a que la cajetilla trae 20 cigarros, pero la unidad física de venta del inventario es la cajetilla entera.
   - SOLO multipliques cajas por unidades si la descripción indica claramente un empaque al por mayor que se venderá suelto (ej. "RUFFLES 24X1" = 24 unidades). Ante la duda, usa la cantidad exacta que dice la columna de 'Cant.' del ticket.
   - En cada producto extraído, debes encontrar el producto que MÁS SE PAREZCA o COINCIDA en mi inventario proporcionado abajo.

Estructura del JSON esperado:
{
  "fecha": "YYYY-MM-DD",
  "total": 0.00,
  "productosTotalesExtraidos": 0,
  "productos": [
    {
      "nombreOriginalTicket": "SABRITAS RC FH 57GR",
      "cantidadLeidaTicket": 1,
      "unidadesPorCajaDeducidas": 1,
      "cantidadTotalUnidades": 1,
      "precioUnitarioLeido": 15.85,
      "subtotal": 15.85,
      "productoMapeadoEnInventario": {
         "id": "ID_DEL_INVENTARIO",
         "nombre": "NOMBRE_DEL_INVENTARIO",
         "confianzaSimilitud": "ALTA|MEDIA|BAJA" 
      }
    }
  ]
}

Si no logras mapear un producto con el inventario, deja "productoMapeadoEnInventario" como nulo.

A continuación, la lista de productos de mi inventario en formato JSON (usa esto como base de datos para mapear):
${JSON.stringify(inventarioReducido)}
`;

    const requestBody = {
        contents: [
            {
                role: 'user',
                parts: [
                    {
                        text: prompt
                    },
                    {
                        inlineData: {
                            mimeType: mimeType,
                            data: fileBase64
                        }
                    }
                ]
            }
        ],
        generationConfig: {
            temperature: 0.1, // Baja temperatura para mayor precisión y menor invención
            responseMimeType: "application/json" // Forzar salida JSON directa
        }
    };

    try {
        const response = await fetch(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(requestBody)
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error?.message || 'Error en la API de Gemini');
        }

        const data = await response.json();

        let jsonResponse;
        if (data.candidates && data.candidates.length > 0) {
            const rawText = data.candidates[0].content.parts[0].text;
            // Gemini podría incluir markdown a pesar de generationConfig en algunas versiones betas,
            // pero con responseMimeType: "application/json" suele devolver JSON puro.
            try {
                jsonResponse = JSON.parse(rawText);
            } catch (e) {
                console.error("Error parseando JSON de Gemini:", rawText);
                throw new Error("Gemini no devolvió un JSON válido.");
            }
        } else {
            throw new Error("Gemini no devolvió ninguna extracción.");
        }

        return jsonResponse;
    } catch (error) {
        console.error('Error procesando ticket:', error);
        throw error;
    }
}
