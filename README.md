# <i class="fas fa-store"></i> Sistema de Gestión de Tienda

Sistema web progresivo (PWA) para gestionar ventas, inventario y finanzas de tiendas locales, con acceso desde cualquier dispositivo y backend gratuito en Firebase.

## <i class="fas fa-star"></i> Características

### <i class="fas fa-check-circle"></i> Fase 1 - MVP (COMPLETADA)

- **<i class="fas fa-lock"></i> Autenticación**: Login y registro de usuarios con Firebase Auth
- **<i class="fas fa-box"></i> Gestión de Productos**: CRUD completo con búsqueda y filtros
- **<i class="fas fa-shopping-cart"></i> Punto de Venta**: Sistema POS con carrito de compras
- **<i class="fas fa-money-bill-wave"></i> Gestión Financiera**: Cálculo automático de ganancias y pérdidas
- **<i class="fas fa-chart-bar"></i> Dashboard**: Métricas en tiempo real y estadísticas del día
- **<i class="fas fa-palette"></i> Diseño Moderno**: Interfaz dark mode con animaciones suaves
- **<i class="fas fa-mobile-alt"></i> Responsive**: Funciona en desktop, tablet y móvil

## <i class="fas fa-rocket"></i> Instalación y Configuración

### Requisitos Previos

**Requisitos Mínimos:**
- <i class="fab fa-chrome"></i> Navegador web moderno (Chrome, Firefox, Edge, Safari)
- <i class="fab fa-google"></i> Cuenta de Google (para Firebase)
- <i class="fas fa-desktop"></i> Pantalla con resolución mínima de 1024x768
- <i class="fas fa-wifi"></i> Conexión a internet básica

**Requisitos Recomendados:**
- <i class="fab fa-chrome"></i> Google Chrome o Microsoft Edge (últimas versiones)
- <i class="fas fa-memory"></i> 4GB de RAM o superior (para rendimiento fluido del Dashboard)
- <i class="fab fa-node-js"></i> Node.js instalado (opcional, recomendado para entorno de desarrollo)
- <i class="fas fa-tachometer-alt"></i> Conexión a internet estable (para sincronización en tiempo real)

### Paso 1: Crear Proyecto en Firebase

1. Ve a [Firebase Console](https://console.firebase.google.com/)
2. Haz clic en "Agregar proyecto"
3. Nombra tu proyecto (ej: "sistema-tienda-local")
4. Desactiva Google Analytics (opcional)
5. Haz clic en "Crear proyecto"

### Paso 2: Configurar Firebase

#### Habilitar Authentication

1. En el menú lateral, ve a **Build** > **Authentication**
2. Haz clic en "Comenzar"
3. En la pestaña **Sign-in method**, habilita:
   - **Correo electrónico/contraseña** → Activar

#### Configurar Firestore Database

1. En el menú lateral, ve a **Build** > **Firestore Database**
2. Haz clic en "Crear base de datos"
3. Selecciona **"Comenzar en modo de prueba"** (puedes cambiar las reglas después)
4. Elige una ubicación cercana a tu región
5. Haz clic en "Habilitar"

#### Configurar Hosting (Opcional)

1. En el menú lateral, ve a **Build** > **Hosting**
2. Haz clic en "Comenzar"
3. Sigue los pasos del asistente

### Paso 3: Obtener Credenciales de Firebase

1. En Firebase Console, haz clic en el ícono de configuración <i class="fas fa-cog"></i> > **Configuración del proyecto**
2. En la sección "Tus apps", haz clic en el ícono web **</>**
3. Registra tu app:
   - Nombre de la app: "Sistema Tienda Web"
   - <i class="fas fa-check-circle"></i> Marca "También configurar Firebase Hosting" (opcional)
4. Copia el objeto `firebaseConfig` que aparece

### Paso 4: Configurar el Proyecto Local

1. **Copia el archivo de ejemplo**:
   - Duplica `firebase-config.example.js`
   - Renómbralo a `firebase-config.js`

2. **Pega tu configuración**:
   Abre `firebase-config.js` y reemplaza con tus credenciales:

```javascript
const firebaseConfig = {
  apiKey: "TU_API_KEY_AQUI",
  authDomain: "tu-proyecto.firebaseapp.com",
  projectId: "tu-proyecto-id",
  storageBucket: "tu-proyecto.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abcdef123456"
};

export default firebaseConfig;
```

### Paso 5: Ejecutar el Sistema

#### Opción A: Con Live Server (Recomendado)

```powershell
# En la carpeta del proyecto
npm start
```

El sistema se abrirá automáticamente en `http://localhost:3000`

#### Opción B: Con servidor local Python

```powershell
# Python 3
python -m http.server 3000
```

#### Opción C: Abrir directamente

Simplemente abre `index.html` en tu navegador (puede haber limitaciones de CORS)

## <i class="fas fa-book"></i> Uso del Sistema

### Primer Acceso

1. Abre el sistema en tu navegador
2. Haz clic en **"Registrarse"**
3. Crea una cuenta con tu email y contraseña (mínimo 6 caracteres)
4. Inicia sesión automáticamente

### Gestionar Productos

1. Ve a **Productos** en el menú
2. Haz clic en **"+ Nuevo Producto"**
3. Completa el formulario:
   - Nombre (obligatorio)
   - Precio de venta (obligatorio)
   - Costo (opcional, para calcular ganancias)
   - Stock inicial
   - Categoría
   - Código de barras (opcional)
4. Haz clic en **"Guardar Producto"**

### Registrar Ventas

1. Ve a **Ventas** en el menú
2. Busca productos por nombre o código
3. Haz clic en un producto para agregarlo al carrito
4. Ajusta cantidades con los botones + / -
5. Selecciona el método de pago
6. Haz clic en **"Procesar Venta"**

### Ver Dashboard

- El dashboard muestra automáticamente:
  - Ventas del día
  - Ganancias calculadas
  - Total de productos
  - Alertas de stock bajo
  - Últimas transacciones

## <i class="fas fa-lock"></i> Reglas de Seguridad de Firestore

Para producción, ve a **Firestore Database** > **Reglas** y usa:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Permitir lectura/escritura solo a usuarios autenticados
    match /{document=**} {
      allow read, write: if request.auth != null;
    }
  }
}
```

## <i class="fas fa-folder"></i> Estructura del Proyecto

```
sistema-tienda/
├── index.html              # Página de login
├── dashboard.html          # Dashboard principal
├── productos.html          # Gestión de productos
├── ventas.html            # Punto de venta
├── css/
│   └── styles.css         # Sistema de diseño
├── js/
│   ├── services/
│   │   ├── firebase.js    # Configuración Firebase
│   │   ├── auth.js        # Autenticación
│   │   ├── products.js    # CRUD productos
│   │   └── sales.js       # Gestión de ventas
│   └── utils/
│       └── helpers.js     # Funciones auxiliares
├── firebase-config.js     # TU configuración (NO SUBIR A GIT)
└── package.json          # Configuración del proyecto
```

## <i class="fas fa-money-bill-wave"></i> Costos

### Firebase - Plan Gratuito (Spark)

<i class="fas fa-check-circle"></i> **100% GRATIS** para tiendas locales:

- **Firestore**: 
  - 1 GB de almacenamiento
  - 50,000 lecturas/día
  - 20,000 escrituras/día
  - 20,000 eliminaciones/día

- **Authentication**: 
  - Usuarios ilimitados

- **Hosting** (opcional):
  - 10 GB de almacenamiento
  - 360 MB/día de transferencia

### ¿Cuánto soporta?

Una tienda local típica:
- ~50-100 productos
- ~30-50 ventas diarias
- ~5-10 usuarios

**Consume aproximadamente**: 500 lecturas/día

<i class="fas fa-check-circle"></i> **Muy por debajo de los límites gratuitos**

## <i class="fas fa-globe"></i> Acceso Remoto

### Opción 1: Firebase Hosting (GRATIS)

```powershell
# Instalar Firebase CLI
npm install -g firebase-tools

# Login
firebase login

# Inicializar
firebase init hosting

# Desplegar
firebase deploy
```

Tu sistema estará disponible en: `https://tu-proyecto.web.app`

### Opción 2: Netlify/Vercel (GRATIS)

1. Sube el proyecto a GitHub
2. Conecta con Netlify o Vercel
3. Despliega automáticamente

## <i class="fas fa-tools"></i> Solución de Problemas

### Error: "Firebase SDK no está cargado"

- Verifica que tienes conexión a internet
- Los scripts de Firebase se cargan desde CDN

### Error: "Firebase Auth no está inicializado"

- Asegúrate de haber creado `firebase-config.js`
- Verifica que las credenciales sean correctas

### No puedo crear usuarios

- Verifica que habilitaste **Email/Password** en Authentication
- Revisa las reglas de Firestore

### Los productos no aparecen

- Abre la consola del navegador (F12)
- Verifica errores de conexión
- Revisa que Firestore esté configurado

## <i class="fas fa-phone"></i> Soporte

Si tienes problemas:
1. Revisa la consola del navegador (F12)
2. Verifica la configuración de Firebase
3. Asegúrate de tener conexión a internet

## <i class="fas fa-magic"></i> Próximas Fases

### Fase 2: Funcionalidad Completa
- Registro de gastos
- Reportes detallados con gráficas
- Exportación a PDF/Excel
- Categorías personalizadas

### Fase 3: Features Avanzados
- PWA instalable (funciona offline)
- Notificaciones push
- Múltiples usuarios/roles
- Sincronización en tiempo real

## <i class="fas fa-file-alt"></i> Licencia

MIT License - Libre para uso comercial y personal

---

**¡Listo para usar! <i class="fas fa-rocket"></i>**

Sigue los pasos de configuración y tendrás tu sistema funcionando en menos de 10 minutos.
