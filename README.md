# MAZK Frontend

Plataforma para clonar tu voz y personalidad para cerrar ventas high-ticket mientras escalas tu negocio.

## 🚀 Características

- **React 18** - React con características mejoradas de renderizado
- **TypeScript** - JavaScript con tipos para mejor experiencia de desarrollo
- **Vite** - Herramienta de build rápida y servidor de desarrollo
- **TailwindCSS** - Framework CSS utility-first con personalización extensa
- **React Router v6** - Enrutamiento declarativo para aplicaciones React
- **Tema Oscuro** - Diseño oscuro minimalista con acentos cyan
- **Pantalla de Bienvenida** - Interfaz elegante para comenzar el flujo de clonación

## 📋 Prerrequisitos

- Node.js (v14.x o superior)
- npm

## 🛠️ Instalación

1. Instalar dependencias:
   ```bash
   npm install
   ```
   
2. Iniciar el servidor de desarrollo:
   ```bash
   npm start
   ```

El servidor se iniciará en `http://localhost:4029`

## 📁 Estructura del Proyecto

```
├── public/
│   ├── manifest.json   # Manifest PWA
│   └── robots.txt      # Archivo robots para SEO
├── src/
│   ├── components/     # Componentes reutilizables
│   │   ├── ui/         # Componentes base UI (Button, etc.)
│   │   ├── AppIcon.tsx # Componente de iconos
│   │   ├── ErrorBoundary.tsx
│   │   └── ScrollToTop.tsx
│   ├── contexts/       # Contextos de React
│   │   └── ThemeContext.tsx
│   ├── pages/          # Componentes de páginas
│   │   ├── welcome-onboarding/  # Pantalla de bienvenida
│   │   └── NotFound.tsx
│   ├── styles/         # Estilos globales y configuración Tailwind
│   ├── utils/          # Funciones utilitarias
│   ├── App.tsx         # Componente principal de la aplicación
│   ├── Routes.tsx      # Rutas de la aplicación
│   └── index.tsx       # Punto de entrada de la aplicación
├── index.html          # Plantilla HTML
├── package.json        # Dependencias y scripts del proyecto
├── tailwind.config.js  # Configuración de Tailwind CSS
├── tsconfig.json       # Configuración de TypeScript
└── vite.config.ts      # Configuración de Vite
```

## 📜 Scripts Disponibles

- `npm start` - Iniciar el servidor de desarrollo
- `npm run build` - Construir la aplicación para producción
- `npm run serve` - Previsualizar el build de producción localmente

## 🎨 Diseño

Este proyecto usa Tailwind CSS para estilos. El diseño incluye:

- Tema oscuro por defecto con acentos cyan (#22d3ee)
- Tipografía Satoshi e Inter
- Diseño minimalista y elegante
- Responsive design con breakpoints de Tailwind CSS

## 🎯 Pantalla de Bienvenida

La pantalla de bienvenida (`/`) ofrece dos opciones:

1. **Clona tu vendedor** - Configura tu gemelo digital con tu voz, estilo e información del producto
2. **Usar closer por defecto** - Comienza rápido con un AI Closer pre-configurado

## 📦 Despliegue

Construir la aplicación para producción:

```bash
npm run build
```

## 🙏 Agradecimientos

- Construido con [Rocket.new](https://rocket.new)
- Potenciado por React y Vite
- Estilizado con Tailwind CSS

---

**MAZK** - Clona tu voz. Cierra más ventas. Escala sin límites.
