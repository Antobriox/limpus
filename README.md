<div align="center">

# 🏆 Limpus

### Sistema de Gestión de Torneos y Olimpiadas Universitarias

Una plataforma web completa y moderna para administrar torneos deportivos, equipos, partidos, resultados y clasificaciones en tiempo real.

[![Next.js](https://img.shields.io/badge/Next.js-16.0.10-black?style=for-the-badge&logo=next.js)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19.2.1-61DAFB?style=for-the-badge&logo=react)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?style=for-the-badge&logo=typescript)](https://www.typescriptlang.org/)
[![Supabase](https://img.shields.io/badge/Supabase-Backend-3ECF8E?style=for-the-badge&logo=supabase)](https://supabase.com/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-4-38B2AC?style=for-the-badge&logo=tailwind-css)](https://tailwindcss.com/)
![Status](https://img.shields.io/badge/Status-Producción-success?style=for-the-badge)

[Características](#-características-principales) • 
[Stack](#-stack-tecnológico) • 
[Instalación](#-instalación-y-configuración) • 
[Scripts](#-scripts-disponibles) • 
[Roles](#-roles-y-permisos) • 
[Manual de usuario](#-manual-de-usuario) • 
[Base de Datos](#-esquema-de-base-de-datos) • 
[Realtime](#-actualizaciones-en-tiempo-real) • 
[Despliegue](#-build-y-despliegue)

</div>

---

## ✨ Características Principales

- ⚡ **Actualizaciones en Tiempo Real** - Los cambios se reflejan instantáneamente sin recargar
- 🎮 **Gestión Completa de Torneos** - Crear y administrar múltiples torneos deportivos
- 👥 **Sistema de Equipos** - Registro de equipos con carreras y líderes
- 📅 **Programación Inteligente** - Programar partidos con fecha, hora, cancha y árbitros
- 📊 **Resultados en Vivo** - Publicar goles, tarjetas, sets y estadísticas en tiempo real
- 🏅 **Clasificaciones Automáticas** - Tablas de posiciones dinámicas por disciplina y género
- 📝 **Sistema de Inscripciones** - Gestión completa de inscripción de jugadores
- 👤 **Múltiples Roles** - Administrador, Líder de Equipo, Árbitro y Viewer
- 🌙 **Modo Oscuro** - Interfaz elegante con soporte para tema claro y oscuro
- 📱 **Diseño Responsive** - Optimizado para móviles, tablets y escritorio
- 📄 **Generación de PDFs** - Exportar resultados, tablas y estadísticas
- 🎨 **Animaciones Fluidas** - Transiciones y animaciones suaves con Framer Motion

---

## 🛠️ Stack Tecnológico

### Core
- **Framework**: [Next.js 16.0.10](https://nextjs.org/) - React framework con App Router
- **React**: 19.2.1 - Biblioteca de UI con las últimas características
- **TypeScript**: 5 - Type safety y mejor experiencia de desarrollo
- **Node.js**: 18+ - Runtime de JavaScript

### Estilos
- **Tailwind CSS**: 4 - Framework CSS utility-first
- **Framer Motion**: 12.29.2 - Animaciones y transiciones fluidas
- **clsx**: 2.1.1 - Utilidad para clases condicionales
- **tailwind-merge**: 3.4.0 - Merge inteligente de clases de Tailwind
- **@formkit/auto-animate**: 0.9.0 - Animaciones automáticas para listas

### Backend & Base de Datos
- **Supabase**: 2.88.0 - Backend as a Service (PostgreSQL, Auth, Realtime, Storage)
  - Autenticación de usuarios
  - Base de datos PostgreSQL
  - Realtime subscriptions
  - Row Level Security (RLS)

### State Management & Data Fetching
- **TanStack Query**: 5.90.16 - Gestión de estado del servidor y caché
- **Zustand**: 5.0.9 - State management ligero y reactivo

### UI Components & Icons
- **Lucide React**: 0.561.0 - Biblioteca de iconos moderna y extensiva
- **@heroicons/react**: 2.2.0 - Iconos oficiales de Tailwind
- **Sonner**: 2.0.7 - Notificaciones toast elegantes

### Forms & Validation
- **React Hook Form**: 7.71.1 - Manejo eficiente de formularios
- **Zod**: 4.3.6 - Validación de esquemas TypeScript-first

### Tables & Data Display
- **TanStack Table**: 8.21.3 - Tablas potentes y personalizables

### Utilities
- **jsPDF**: 4.0.0 - Generación de documentos PDF

### Dev Dependencies
- **ESLint**: 9 - Linter de código JavaScript/TypeScript
- **eslint-config-next**: 16.0.10 - Configuración de ESLint optimizada para Next.js
- **Tailwind CSS**: 4 - Framework CSS (con PostCSS 4)
- **@tailwindcss/postcss**: 4 - Plugin de PostCSS para Tailwind
- **TypeScript**: 5 - Compilador de TypeScript
- **Type Definitions**:
  - `@types/node` 20 - Tipos para Node.js
  - `@types/react` 19 - Tipos para React
  - `@types/react-dom` 19 - Tipos para React DOM

### 📦 Lista Completa de Dependencias

<details>
<summary><b>Ver todas las dependencias (17 production + 8 development)</b></summary>

#### Production Dependencies (17)

| Paquete | Versión | Categoría | Uso |
|---------|---------|-----------|-----|
| `next` | 16.0.10 | Framework | Framework principal React |
| `react` | 19.2.1 | Core | Biblioteca UI |
| `react-dom` | 19.2.1 | Core | Renderizado React |
| `@supabase/supabase-js` | 2.88.0 | Backend | Cliente de Supabase |
| `@tanstack/react-query` | 5.90.16 | State | Gestión estado servidor |
| `@tanstack/react-table` | 8.21.3 | UI | Tablas avanzadas |
| `zustand` | 5.0.9 | State | State management |
| `react-hook-form` | 7.71.1 | Forms | Manejo formularios |
| `zod` | 4.3.6 | Validation | Validación esquemas |
| `framer-motion` | 12.29.2 | Animation | Animaciones |
| `@formkit/auto-animate` | 0.9.0 | Animation | Animaciones automáticas |
| `lucide-react` | 0.561.0 | Icons | Biblioteca iconos |
| `@heroicons/react` | 2.2.0 | Icons | Iconos Heroicons |
| `sonner` | 2.0.7 | UI | Notificaciones toast |
| `tailwind-merge` | 3.4.0 | Styles | Merge clases Tailwind |
| `clsx` | 2.1.1 | Styles | Clases condicionales |
| `jspdf` | 4.0.0 | Utils | Generación PDFs |

#### Development Dependencies (8)

| Paquete | Versión | Uso |
|---------|---------|-----|
| `typescript` | 5 | Compilador TypeScript |
| `eslint` | 9 | Linter de código |
| `eslint-config-next` | 16.0.10 | Config ESLint para Next.js |
| `tailwindcss` | 4 | Framework CSS |
| `@tailwindcss/postcss` | 4 | PostCSS plugin |
| `@types/node` | 20 | Tipos Node.js |
| `@types/react` | 19 | Tipos React |
| `@types/react-dom` | 19 | Tipos React DOM |

**Total: 25 dependencias** (17 production + 8 development)

</details>

---

## 📋 Requisitos Previos

Antes de comenzar, asegúrate de tener instalado:

- **Node.js** 18 o superior ([Descargar](https://nodejs.org/))
- **npm**, **yarn**, **pnpm** o **bun** (gestor de paquetes)
- **Git** ([Descargar](https://git-scm.com/))
- **Cuenta de Supabase** con proyecto configurado ([Crear cuenta](https://supabase.com/))

---

## 🚀 Instalación y Configuración

### 1. Clonar el Repositorio

```bash
git clone <url-del-repositorio>
cd limpus
```

### 2. Instalar Dependencias

```bash
npm install
# o
yarn install
# o
pnpm install
# o
bun install
```

### 3. Configurar Variables de Entorno

Crea un archivo `.env.local` en la raíz del proyecto:

```env
NEXT_PUBLIC_SUPABASE_URL=tu_url_de_supabase
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu_clave_anonima_de_supabase
```

> **Nota**: Puedes obtener estas credenciales desde el dashboard de tu proyecto en Supabase > Settings > API

### 4. Configurar Base de Datos

#### Ejecutar Migraciones

Las migraciones SQL están en la carpeta `supabase/migrations/`. Ejecuta los siguientes archivos en orden en el SQL Editor de Supabase:

1. `001_tournament_editions_architecture.sql` - Arquitectura base
2. `enable_realtime.sql` - Habilitar actualizaciones en tiempo real

#### Habilitar Realtime (Importante) ⚡

Para que las actualizaciones en tiempo real funcionen, elige una guía:

- **Primera vez o problemas:** Lee `ACTIVAR_TIEMPO_REAL.md` (guía completa con debugging)
- **Configuración rápida:** Lee `CONFIGURAR_REALTIME.md` (pasos directos)

> 💡 **Tip**: Si el tiempo real no funciona, la guía completa tiene una sección de troubleshooting.

### 5. Iniciar el Servidor de Desarrollo

```bash
npm run dev
# o
yarn dev
# o
pnpm dev
# o
bun dev
```

La aplicación estará disponible en [http://localhost:3000](http://localhost:3000)

---

## 📁 Estructura del Proyecto

```
limpus/
├── public/                      # Archivos estáticos
│   ├── img/                    # Imágenes (logos, backgrounds)
│   ├── file.svg
│   ├── vercel.svg
│   └── window.svg
│
├── src/
│   ├── app/                    # App Router de Next.js
│   │   ├── api/               # API Routes
│   │   │   ├── admin/         # Endpoints de administración
│   │   │   └── public/        # Endpoints públicos
│   │   │
│   │   ├── dashboard/         # Panel de administración
│   │   │   ├── admin/         # Panel de super admin
│   │   │   ├── equipos/       # Gestión de equipos
│   │   │   ├── general/       # Vista general
│   │   │   ├── historial/     # Historial de torneos
│   │   │   ├── inscripciones/ # Gestión de inscripciones
│   │   │   ├── leader/        # Panel de líder de equipo
│   │   │   ├── torneos/       # Gestión de torneos
│   │   │   ├── usuarios/      # Gestión de usuarios
│   │   │   ├── viewers/       # Vista pública
│   │   │   └── layout.tsx     # Layout del dashboard
│   │   │
│   │   ├── login/             # Página de inicio de sesión
│   │   ├── registro/          # Página de registro
│   │   ├── globals.css        # Estilos globales
│   │   ├── layout.tsx         # Layout principal
│   │   ├── page.tsx           # Página de inicio (pública)
│   │   └── providers.tsx      # Providers de React
│   │
│   ├── components/             # Componentes reutilizables
│   │   ├── ActionCard.tsx     # Tarjeta de acción
│   │   ├── AdvancedStatCard.tsx # Tarjeta de estadísticas
│   │   ├── AlertModal.tsx     # Modal de alerta
│   │   ├── ConfirmModal.tsx   # Modal de confirmación
│   │   ├── RealtimeIndicator.tsx # Indicador de tiempo real
│   │   ├── Sidebar.tsx        # Barra lateral
│   │   └── Topbar.tsx         # Barra superior
│   │
│   ├── contexts/              # Contextos de React
│   │   └── ThemeContext.tsx   # Contexto de tema (dark/light)
│   │
│   ├── hooks/                 # Custom hooks
│   │   ├── useUser.ts         # Hook de usuario autenticado
│   │   └── useRealtimeSubscription.ts # Hook de tiempo real
│   │
│   ├── lib/                   # Utilidades y configuración
│   │   ├── queryClient.ts     # Configuración de TanStack Query
│   │   ├── supabaseAdmin.ts   # Cliente de Supabase (Admin)
│   │   ├── supabaseClient.ts  # Cliente de Supabase (Client)
│   │   └── utils.ts           # Funciones utilitarias
│   │
│   └── types/                 # Tipos de TypeScript
│       └── db.ts              # Tipos de base de datos
│
├── supabase/                   # Configuración de Supabase
│   └── migrations/            # Migraciones SQL
│       ├── 001_tournament_editions_architecture.sql
│       └── enable_realtime.sql
│
├── .env.local                 # Variables de entorno (no versionado)
├── .gitignore                 # Archivos ignorados por Git
├── ACTIVAR_TIEMPO_REAL.md    # 📖 Guía completa de Realtime
├── CONFIGURAR_REALTIME.md     # 📖 Guía rápida de Realtime
├── sistema_clasificacion_disciplinas.md # 📖 Sistema de puntos
├── eslint.config.mjs          # Configuración de ESLint
├── next.config.ts             # Configuración de Next.js
├── package.json               # Dependencias y scripts
├── postcss.config.mjs         # Configuración de PostCSS
├── tailwind.config.js         # Configuración de Tailwind
├── tsconfig.json              # Configuración de TypeScript
└── README.md                  # 📖 Este archivo
```

---

## 🎯 Scripts Disponibles

| Script | Descripción |
|--------|-------------|
| `npm run dev` | Inicia el servidor de desarrollo en `http://localhost:3000` |
| `npm run build` | Construye la aplicación optimizada para producción |
| `npm run start` | Inicia el servidor de producción (requiere `build` previo) |
| `npm run lint` | Ejecuta ESLint para verificar errores de código |
| `npm run lint:fix` | Ejecuta ESLint y corrige automáticamente los errores |

---

## 👥 Roles y Permisos

### 🔴 Administrador
- ✅ Gestión completa de torneos (crear, editar, eliminar)
- ✅ Gestión de equipos y jugadores
- ✅ Gestión de usuarios y asignación de roles
- ✅ Programación y reprogramación de partidos
- ✅ Publicación de resultados en tiempo real
- ✅ Generación de llaves de eliminación
- ✅ Visualización de estadísticas y reportes
- ✅ Exportación de PDFs

### 🟡 Líder de Equipo
- ✅ Ver información completa de su equipo
- ✅ Llenar y gestionar inscripciones de jugadores
- ✅ Ver calendario de partidos de su equipo
- ✅ Ver estadísticas del equipo (victorias, goles, etc.)
- ✅ Ver detalles de partidos (goles, tarjetas, etc.)
- ✅ Recibir actualizaciones en tiempo real

### 🔵 Viewer (Público)
- ✅ Ver partidos en vivo con marcadores actualizados
- ✅ Ver clasificaciones y tablas de posiciones
- ✅ Explorar deportes y equipos
- ✅ Ver historial de partidos
- ✅ Acceso sin necesidad de autenticación

### 🟠 Árbitro
- ✅ Ver solo los partidos asignados (árbitro o asistente) de la edición activa
- ✅ Listas separadas: en vivo, próximos y finalizados
- ✅ Actualización en tiempo real de marcadores y eventos

---

## 📖 Manual de usuario

Guía orientativa para quienes usan **Limpus** en el día a día (no requiere conocimientos técnicos). La pantalla inicial y los menús pueden variar ligeramente según la versión desplegada.

### Acceso al sistema

1. Abre la URL de la aplicación (por ejemplo `https://tu-dominio.com` o la que te indique la organización).
2. **Iniciar sesión**: menú o botón de acceso → introduce correo y contraseña. Opcionalmente marca **Recordarme** para guardar el correo en este equipo.
3. **Registro** (si está habilitado): permite crear una cuenta nueva; después de registrarte suele redirigir al inicio de sesión.
4. Tras el login, el sistema te lleva automáticamente al panel que corresponde a tu **rol** (árbitro, líder, administrador o vista pública).

### Navegación general (administrador)

- En **escritorio** tienes el menú lateral con: Torneos, Usuarios, Equipos, Inscripciones e Historial.
- En **móvil o pantalla pequeña**, usa el botón **Menú** (icono de tres rayas) arriba para abrir y cerrar el mismo menú.
- Puedes cambiar entre **tema claro y oscuro** si la aplicación lo ofrece en la barra superior o en la página de login.

---

### Manual del **Administrador**

#### Torneos (panel principal)

- Es el punto de entrada habitual tras iniciar sesión como administrador.
- Resume la **edición activa** del torneo: estadísticas, equipos recientes, resultados recientes y accesos rápidos.
- Desde aquí puedes ir a **programar partidos**, **resultados**, **tablas**, **brackets** o **documentos** según las tarjetas o enlaces disponibles.

#### Crear o gestionar una edición / torneo

- **Nuevo torneo** o edición: sigue el flujo del asistente para fechas, disciplinas y configuración.
- **Historial**: consulta ediciones anteriores; al entrar en una edición pasada, muchas listas se filtran por esa edición (por parámetro en la URL).

#### Usuarios

- Alta, edición y baja de usuarios del sistema.
- Asignación de **roles** (administrador, líder de equipo, árbitro, viewers, etc.) según lo que permita tu organización.
- Los usuarios que serán **líderes** o **árbitros** deben existir y tener el rol correcto para ver sus paneles.

#### Equipos

- Crear equipos, asignar **carreras** (facultades) y **líderes** vinculados a la edición actual.
- Editar un equipo permite ajustar nombre, carreras y líderes acotados al torneo vigente.

#### Inscripciones

- Crea **formularios de inscripción** por disciplina y género (mínimo/máximo de jugadores, fechas límite de edición).
- **Abrir / cerrar** un formulario controla si los líderes pueden seguir inscribiendo.
- **Ver** (icono de ojo): abre el listado de **equipos inscritos** en ese formulario y, al elegir un equipo, la tabla de **jugadores** (incluye enlace para ver la **foto de cédula** cuando exista y el almacenamiento lo permita).
- **Editar** / **Eliminar** formularios según permisos.

#### Programar partidos

- Asigna fecha, hora, cancha, equipos, torneo, género y, si aplica, **árbitro** y **asistente**.
- Los partidos aparecen en calendarios y vistas del líder y de la página pública según su estado.

#### Resultados (partidos del día)

- Para los partidos programados **hoy**, puedes iniciar el partido, cargar **goles** o puntos, **tarjetas** (amarillas/rojas) y otros eventos según la disciplina.
- Los **goles** y **tarjetas** se guardan en vivo en la base de datos para que líderes y público los vean sin esperar a finalizar el partido.
- **Segunda tarjeta amarilla** al mismo jugador: el sistema puede registrar automáticamente la **tarjeta roja** correspondiente.
- Al **finalizar** el partido se confirma el resultado y el estado pasa a terminado.

#### Tablas y clasificación

- Visualiza posiciones por torneo o disciplina según la configuración del sistema.

#### Brackets (eliminatorias)

- Gestión de llaves cuando el formato lo requiera.

#### Documentos

- Subida de PDF u otros documentos asociados al torneo (según configuración del bucket en Supabase).

---

### Manual del **Líder de equipo**

- Tras iniciar sesión accedes al **panel del líder** (sin el menú completo de administrador).
- Consulta **datos de tu equipo**, **partidos** (próximos, en curso y jugados) y **estadísticas** resumidas.
- **Inscripciones**: elige el formulario de la disciplina/género que corresponda a tu equipo.
  - Si no existe inscripción, créala; luego añade jugadores dentro del mínimo y máximo permitidos.
  - Completa datos del jugador, carrera, semestre, número, capitán y, si se pide, **foto de cédula** (subida a almacenamiento).
  - Guarda los cambios para que el administrador los vea en **Inscripciones → Ver**.
- **Detalle de un partido**: abre goles, tarjetas y demás eventos; la información se actualiza en **tiempo real** mientras el administrador carga el partido.

---

### Manual del **Árbitro**

- Tras iniciar sesión entras a **Partidos a arbitrar**.
- Ves los partidos en los que figuras como **árbitro** o **asistente** en la edición activa, agrupados por en vivo, próximos y finalizados.
- Puedes **cerrar sesión** desde la propia pantalla del árbitro.

---

### Manual del **Viewer** (página pública)

- Sin cuenta, en la **página principal** puedes ver deportes, **partidos en vivo**, próximos y recientes.
- Al elegir un deporte se filtra la información.
- La **clasificación** pública puede estar en una ruta dedicada (según despliegue), accesible sin login.
- Los datos se actualizan en tiempo real cuando el administrador publica cambios.

---

### Consejos y resolución rápida

| Situación | Qué hacer |
|-----------|-----------|
| No veo el menú de administrador en el móvil | Pulsa **Menú** (arriba a la izquierda) para abrir el lateral. |
| El administrador no ve equipos en “Inscripciones → Ver” | Comprueba que el formulario sea el correcto y que los líderes hayan **guardado** la inscripción; revisa permisos y datos en Supabase si persiste. |
| No abre la foto de la cédula | El archivo está en Storage; hace falta políticas que permitan **lectura** (o URLs firmadas) para tu rol. Consulta con quien administra Supabase. |
| El marcador o las tarjetas no se actualizan solos | Activa **Realtime** en Supabase para las tablas indicadas en la documentación del proyecto (`CONFIGURAR_REALTIME.md` / `ACTIVAR_TIEMPO_REAL.md`). |
| Olvidé la contraseña | Usa el enlace de recuperación si está configurado en el proyecto; si no existe, contacta al administrador de la plataforma. |

---

## 🗄️ Esquema de Base de Datos

### Tablas Principales

| Tabla | Descripción |
|-------|-------------|
| `tournament_editions` | Ediciones de torneos (Olimpiadas 2024, 2025, etc.) |
| `tournaments` | Torneos por disciplina dentro de una edición |
| `sports` | Catálogo de deportes (Fútbol, Básquet, Voley, etc.) |
| `teams` | Equipos participantes |
| `careers` | Carreras/Facultades |
| `players` | Jugadores registrados |
| `matches` | Partidos programados |
| `match_results` | Resultados de partidos (marcadores) |
| `match_events` | Eventos de partidos (goles, tarjetas, sets, etc.) |
| `draws` | Llaves de eliminación |
| `registration_forms` | Formularios de inscripción |
| `team_registrations` | Inscripciones de equipos a torneos |
| `team_leaders` | Líderes asignados a equipos |
| `profiles` | Perfiles de usuarios |
| `user_roles` | Roles asignados a usuarios |

### Relaciones Clave

```
tournament_editions (1) ─── (N) tournaments
tournaments (1) ─── (N) matches
tournaments (1) ─── (N) team_registrations
teams (1) ─── (N) players
teams (1) ─── (N) team_leaders
matches (1) ─── (1) match_results
matches (1) ─── (N) match_events
```

---

## ⚡ Actualizaciones en Tiempo Real

El proyecto incluye un sistema completo de actualizaciones en tiempo real usando **Supabase Realtime**.

### Características
- 🔄 Actualizaciones automáticas sin recargar la página
- ⚽ Marcadores de partidos en vivo
- 📊 Tablas de clasificación dinámicas
- 👥 Cambios en equipos y jugadores
- 📝 Inscripciones y registros

### Configuración

1. Las tablas habilitadas para tiempo real están en `supabase/migrations/enable_realtime.sql`
2. El hook principal está en `src/hooks/useRealtimeSubscription.ts`
3. Se invalidan automáticamente las queries de TanStack Query cuando hay cambios

### Uso en Componentes

```typescript
import { useRealtimeSubscription } from "@/hooks/useRealtimeSubscription";

function MyComponent() {
  // Activar subscripciones en tiempo real
  useRealtimeSubscription();
  
  // Tu componente recibirá actualizaciones automáticamente
}
```

---

## 🎨 Personalización

### Tema Oscuro/Claro

El proyecto incluye soporte completo para modo oscuro:

```typescript
import { useTheme } from "@/contexts/ThemeContext";

function MyComponent() {
  const { theme, toggleTheme } = useTheme();
  
  return (
    <button onClick={toggleTheme}>
      Tema actual: {theme}
    </button>
  );
}
```

### Colores de Tailwind

Los colores principales están configurados en `tailwind.config.js`. Puedes personalizarlos:

```javascript
module.exports = {
  theme: {
    extend: {
      colors: {
        primary: '#3b82f6', // Azul
        // Agrega tus colores personalizados
      }
    }
  }
}
```

---

## 📦 Build y Despliegue

### Build para Producción

```bash
npm run build
```

Esto genera una carpeta `.next` optimizada para producción.

### Iniciar en Producción

```bash
npm run start
```

---

## 🐛 Solución de Problemas Comunes

### El favicon no aparece
```bash
# Limpia la caché del navegador
Ctrl + Shift + R (Windows/Linux)
Cmd + Shift + R (Mac)

# Reinicia el servidor de desarrollo
npm run dev
```

### Errores de conexión a Supabase
- ✅ Verifica que las variables de entorno estén correctamente configuradas
- ✅ Asegúrate de que las credenciales de Supabase sean válidas
- ✅ Revisa las políticas de Row Level Security (RLS) en Supabase

### Errores de TypeScript
```bash
# Limpia la caché de TypeScript
rm -rf .next
npm run dev
```

### El tiempo real no funciona
- ✅ Verifica que ejecutaste `enable_realtime.sql` en Supabase
- ✅ Comprueba la consola del navegador para ver logs de conexión
- ✅ Asegúrate de que las tablas estén en la publicación `supabase_realtime`

### Problemas con las dependencias
```bash
# Elimina node_modules y reinstala
rm -rf node_modules
rm package-lock.json
npm install
```

---

## 📚 Documentación Adicional

### Guías de Configuración
- 📄 `ACTIVAR_TIEMPO_REAL.md` - Guía completa paso a paso para configurar Realtime (con debugging)
- 📄 `CONFIGURAR_REALTIME.md` - Guía rápida de configuración de Realtime
- 📄 `sistema_clasificacion_disciplinas.md` - Sistema de clasificación y puntos por deporte

### Migraciones SQL
- 📁 `supabase/migrations/` - Todas las migraciones SQL del proyecto
  - `001_tournament_editions_architecture.sql` - Estructura base de la base de datos
  - `enable_realtime.sql` - Script para habilitar actualizaciones en tiempo real

---

## 🤝 Contribuir

Para contribuir al proyecto:

1. **Fork** el repositorio
2. **Crea** una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. **Commit** tus cambios (`git commit -m 'Add: Amazing Feature'`)
4. **Push** a la rama (`git push origin feature/AmazingFeature`)
5. **Abre** un Pull Request

### Convenciones de Código

- ✅ Usa TypeScript para todos los archivos nuevos
- ✅ Sigue las reglas de ESLint (`npm run lint`)
- ✅ Usa componentes funcionales con hooks
- ✅ Documenta funciones complejas con comentarios
- ✅ Usa nombres descriptivos para variables y funciones
- ✅ Mantén los componentes pequeños y reutilizables

---

## 📄 Licencia

Este proyecto es **privado** y de uso interno para gestión de olimpiadas universitarias.

---

## 👨‍💻 Autores y Agradecimientos

Desarrollado para la gestión de **Olimpiadas Universitarias** con las mejores prácticas de desarrollo web moderno.

### Tecnologías Clave
- [Next.js](https://nextjs.org/) - El framework de React para producción
- [Supabase](https://supabase.com/) - Backend as a Service open source
- [TanStack Query](https://tanstack.com/query) - Gestión de estado del servidor
- [Tailwind CSS](https://tailwindcss.com/) - Framework CSS utility-first
- [Framer Motion](https://www.framer.com/motion/) - Animaciones para React

---

<div align="center">


</div>
