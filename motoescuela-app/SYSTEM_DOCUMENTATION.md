# Documentación del sistema - MotoEscuela

## 1. Descripción general
MotoEscuela es una aplicación web de inscripción y gestión de reservas para una escuela de manejo de motos. Está construida con React + Vite y usa Firebase para autenticación y Firestore para datos en tiempo real.

## 2. Stack tecnológico
- React 19
- Vite 8
- Tailwind CSS 4
- Firebase (Auth + Firestore)
- ESLint para linting
- Lucide React para iconos

## 3. Estructura principal
- `src/App.jsx` - punto de entrada de la aplicación, con `AppProvider` y routing entre vistas.
- `src/context/AppContext.jsx` - proveedor global que inicializa Firebase, gestiona autenticación, sincroniza colecciones y ofrece helpers centrales.
- `src/context/AppContextValue.js` - define el contexto de React.
- `src/views/InscripcionView.jsx` - vista de inscripción con selección de curso, sede, fecha, horario, datos personales, pago y lógica de locks.
- `src/views/PortalEstudiante.jsx` - portal de estudiante (actualmente cargado desde el contexto, no se documenta en detalle aquí).
- `src/views/LoginView.jsx` - vista de acceso para usuarios.
- `src/admin/DashboardView.jsx` - panel administrativo y vistas de roles (`admin`, `instructor`, `proveedor`).
- `src/components/UI` - componentes de interfaz reutilizables como `Button`, `Input`, `Select`, `Spinner`.

## 4. Flujo principal de la aplicación
1. El usuario abre la app y navega al flujo de inscripción.
2. El usuario selecciona curso, sede, fecha, tipo de moto y si traerá moto propia.
3. El sistema consulta disponibilidad de bloques y reserva un lock temporal para el horario.
4. El usuario completa datos personales y los datos de pago.
5. La reserva se confirma usando un lock y se guarda en Firestore.

## 5. Firebase y autenticación
- La configuración de Firebase se obtiene desde `window.__firebase_config` y `window.__app_id`.
- La app inicializa Firebase en `src/context/AppContext.jsx`.
- Si no hay configuración disponible, la app se marca como lista para renderizar (`authReady = true`) aunque no tenga Firebase.
- El usuario se autentica de forma anónima o con token personalizado (`window.__initial_auth_token`).

## 6. Modelos de datos y colecciones
Las principales colecciones manejadas son:
- `artifacts/{appId}/public/data/configuraciones` - configuración de la escuela y tasas.
- `artifacts/{appId}/public/data/sedes` - sedes disponibles.
- `artifacts/{appId}/public/data/horarios` - bloques horarios.
- `artifacts/{appId}/public/data/cursos` - cursos disponibles.
- `artifacts/{appId}/public/data/instructores` - instructores.
- `artifacts/{appId}/public/data/proveedores` - proveedores.
- `artifacts/{appId}/public/data/motos` - motos disponibles.
- `artifacts/{appId}/public/data/reservas` - reservas de inscripción.
- `artifacts/{appId}/public/data/movimientos` - movimientos, posiblemente pagos o transacciones.
- `locks` - colección de locks temporales para reservar bloques.

## 7. Lógica de reserva y locks
### Reserva segura
- `saveReservaSeguro` realiza un `runTransaction` para guardar reservas en Firestore.
- Verifica conflictos de horario y reservas activas antes de asignar instructor y moto.
- Asigna instructor principal disponible o el siguiente instructor libre.
- Para clientes que no traen moto, asigna una moto disponible del tipo seleccionado.

### Locks de horario
- `createScheduleLock` bloquea un horario durante 5 minutos para evitar reservas dobles.
- `fetchActiveLocks` consulta los locks activos para una fecha.
- `releaseScheduleLock` libera un lock cuando el usuario cambia selección.
- `confirmReservaConLock` confirma la reserva final y elimina el lock dentro de una transacción.

## 8. Validaciones importantes
- Edad mínima: 18 años.
- Cédula válida: 6 a 10 dígitos.
- Teléfono válido: 10 u 11 dígitos.
- Pago: últimos 4 dígitos de referencia, teléfono y cédula del pagador.
- CAPTCHA simple de suma para evitar envíos automáticos.

## 9. Estados y ayudas de contexto
`AppContext` expone:
- `view`, `setView` - navegación de pantallas.
- `user`, `setUser` - usuario actual para paneles y portal.
- `toast`, `showToast` - mensajes de notificación.
- `config`, `saveConfig` - configuración global.
- `sedes`, `horarios`, `cursos`, `instructores`, `proveedores`, `motos`, `reservas`, `movimientos` - datos sincronizados.
- `calcularBaseUSD` - cálculo de precio base.
- `findAvailableResources` - determina instructor/moto disponible según fecha, hora y locks.
- `authReady` - estado de carga de auth y Firebase.
- funciones de lock y confirmación: `createScheduleLock`, `fetchActiveLocks`, `releaseScheduleLock`, `confirmReservaConLock`.

## 10. Estado actual del sistema
### Lo que está implementado
- Interfaz React con navegación entre home, inscripción, portal, login y panel admin.
- Firebase Auth + Firestore con lectura/escritura de colecciones.
- Flujo de inscripción con selección de curso, sede, fecha, horario y pago.
- Lock temporal de horario para evitar reservaciones simultáneas.
- Transacción segura para confirmar reserva con lock.
- Lectura y actualización de configuración remota de tasas de cambio.

### Lo que falta para producción
- Reglas de seguridad de Firestore no incluidas en el repositorio.
- Configuración segura de Firebase para ambiente de producción.
- Verificación de pagos y confirmación real de recibos.
- Manejo de expiración de locks desde el lado cliente y eliminación automática programada.
- Pruebas de casos concurrentes y flujo de reserva con múltiples usuarios.

## 11. Cómo ejecutar
Dentro de `motoescuela-app`:
```bash
npm install
npm run dev
```
Para producción:
```bash
npm run build
```

## 12. Archivos clave para revisar
- `src/context/AppContext.jsx`
- `src/views/InscripcionView.jsx`
- `src/App.jsx`
- `src/context/AppContextValue.js`
- `src/admin/DashboardView.jsx`
- `src/components/UI/*`

## 13. Notas de diseño
- `AppContext` centraliza la mayor parte de la lógica de datos y Firebase.
- La vista de inscripción usa un wizard de 3 pasos.
- Los locks se basan en un ID compuesto de `fecha1`, `horaId`, `instructorId` y `motoAsignadaId`.
- El cálculo de disponibilidad considera reservas activas, bloqueos y módulos de horario.
- El sistema aún depende de datos iniciales en Firestore y de un objeto `firebaseConfig` inyectado en el cliente.

---

Este documento resume el estado actual del sistema y su arquitectura. Para extenderlo, conviene agregar secciones de reglas de seguridad y casos de prueba una vez que el backend esté definido completamente.