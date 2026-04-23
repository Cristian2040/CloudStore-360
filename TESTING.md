# 🧪 Guía de Testing - Fase 1 MVP

## Pruebas Requeridas

### ✅ Test 1: Login y Autenticación
- [ ] Cerrar sesión (botón "Cerrar Sesión")
- [ ] Volver a iniciar sesión con tus credenciales
- [ ] Verificar redirección automática al dashboard

---

### ✅ Test 2: Gestión de Productos
1. **Crear productos** (mínimo 3):
   ```
   Producto 1: Coca Cola - Precio: $25 - Costo: $15 - Stock: 50
   Producto 2: Sabritas - Precio: $18 - Costo: $10 - Stock: 30
   Producto 3: Pan Bimbo - Precio: $35 - Costo: $20 - Stock: 20
   ```

2. **Editar producto**:
   - Selecciona un producto
   - Cambia el precio o stock
   - Guarda

3. **Buscar producto**:
   - Usa la barra de búsqueda
   - Busca por nombre

4. **Verificar**:
   - [ ] Los productos aparecen en la lista
   - [ ] Se muestran con el stock correcto
   - [ ] El margen de ganancia se calcula

---

### ✅ Test 3: Proceso de Venta (POS)
1. Ve a **Ventas**
2. Busca y agrega productos al carrito
3. Ajusta cantidades con +/-
4. Verifica que:
   - [ ] El subtotal se calcula correctamente
   - [ ] El IVA se suma (16%)
   - [ ] El total es correcto
5. Selecciona método de pago
6. Haz clic en **"Procesar Venta"**
7. Verifica mensaje de éxito

---

### ✅ Test 4: Verificar Actualización de Stock
1. Después de la venta, ve a **Productos**
2. Verifica que:
   - [ ] El stock disminuyó correctamente
   - [ ] Los productos vendidos tienen menos unidades

---

### ✅ Test 5: Dashboard
1. Ve al **Dashboard**
2. Verifica que muestra:
   - [ ] Ventas del día
   - [ ] Ganancias calculadas
   - [ ] Total de productos
   - [ ] Ventas recientes

---

### ✅ Test 6: Persistencia
1. Cierra el navegador completamente
2. Vuelve a abrir el sistema
3. Verifica:
   - [ ] Sigues con sesión iniciada
   - [ ] Tus productos siguen ahí
   - [ ] Las ventas se mantienen

---

## 🔧 Índice de Firestore (IMPORTANTE)

Para eliminar el error en consola, crea el índice:

1. Abre la consola del navegador (F12)
2. Copia el link que aparece en el error (empieza con `https://console.firebase.google.com/...`)
3. Pégalo en el navegador
4. Haz clic en **"Crear índice"**
5. Espera 1-2 minutos

---

## 🚀 Deployment Final

Cuando todas las pruebas estén ✅:

```cmd
firebase deploy
```

Tu sistema estará en: `https://sistema-tienda-local.web.app`

---

## ✅ Checklist de Completitud

- [ ] Todos los tests pasaron
- [ ] Índice de Firestore creado
- [ ] Sistema desplegado
- [ ] URL pública funcionando

**Fase 1 MVP: COMPLETADA** 🎉
