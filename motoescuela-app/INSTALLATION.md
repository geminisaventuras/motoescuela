# Guía Completa de Instalación - Sistema MotoEscuela

Esta guía describe la instalación paso a paso del sistema MotoEscuela en un entorno local, con React + Vite y Tailwind CSS v4. El proyecto ya está generado en la carpeta `motoescuela-app`.

## 1. Crear el proyecto

Abre una terminal y ejecuta:

```bash
npm create vite@latest motoescuela -- --template react
cd motoescuela
npm install
```

> En esta workspace ya se creó el proyecto en `motoescuela-app`.

## 2. Instalar dependencias

Instala los paquetes necesarios:

```bash
npm install firebase lucide-react
npm install -D tailwindcss @tailwindcss/vite
```

## 3. Configurar Tailwind CSS

Reemplaza el contenido de `vite.config.js` con:

```js
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
})
```

Reemplaza todo el contenido de `src/index.css` por:

```css
@import "tailwindcss";
```

## 4. Estructura del proyecto

Crea las siguientes carpetas dentro de `src`:

- `src/context`
- `src/components`
- `src/views`
- `src/admin`

En este proyecto ya están creados los archivos principales y las carpetas necesarias.

## 5. Código central

El código principal de la aplicación está unificado en los componentes de la carpeta `src/` y, en especial, en:

- `src/App.jsx`
- `src/context/AppContext.jsx`
- `src/components/UI.jsx`
- `src/views/InscripcionView.jsx`
- `src/views/PortalEstudiante.jsx`
- `src/views/LoginView.jsx`
- `src/admin/DashboardView.jsx`

### Nota importante de Firebase

El proyecto requiere credenciales de Firebase para funcionar con la base de datos en tiempo real. Si usas Firebase, habilita:

- Firestore
- Authentication con acceso anónimo

Luego coloca el objeto `firebaseConfig` con tus credenciales reales en `src/context/AppContext.jsx` o en el código central equivalente.

## 6. Ejecutar el proyecto

Desde la carpeta del proyecto:

```bash
cd motoescuela-app
npm run dev
```

Abre el navegador en:

```text
http://localhost:5173/
```

Si ves la pantalla inicial de MotoEscuela sin errores, el proyecto está listo.

## 7. Publicar en GitHub Pages

Para publicar en GitHub Pages, instala `gh-pages`:

```bash
cd motoescuela-app
npm install --save-dev gh-pages
```

Agrega estas entradas a `package.json`:

```json
"homepage": "https://geminisaventuras.github.io/motoescuela",
"scripts": {
  "dev": "vite",
  "build": "vite build",
  "preview": "vite preview",
  "predeploy": "npm run build",
  "deploy": "gh-pages -d dist"
}
```

Luego despliega con:

```bash
npm run deploy
```

> Si el repositorio se llama `motoescuela`, la URL final será `https://geminisaventuras.github.io/motoescuela`.

## 8. Resumen de comandos

```bash
npm create vite@latest motoescuela -- --template react
cd motoescuela
npm install
npm install firebase lucide-react
npm install -D tailwindcss @tailwindcss/vite
npm install --save-dev gh-pages
npm run dev
npm run deploy
```

## 9. Estado actual del proyecto

En este workspace, el proyecto ya está creado y configurado en `motoescuela-app`. La aplicación compila correctamente y el servidor de desarrollo responde en `http://localhost:5173`.
