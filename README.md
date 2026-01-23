# Limpus

Sistema de gestión de torneos y olimpiadas universitarias. Plataforma web completa para administrar equipos, partidos, resultados, clasificaciones y más.

## 🚀 Características

- **Gestión de Torneos**: Crear y administrar torneos deportivos
- **Gestión de Equipos**: Registrar equipos con sus carreras y líderes
- **Programación de Partidos**: Programar partidos con fecha, hora, cancha y árbitros
- **Publicación de Resultados**: Registrar resultados de partidos con goles, tarjetas y sets
- **Clasificaciones**: Tablas de posiciones automáticas por disciplina y género
- **Inscripciones**: Sistema de inscripción de jugadores por equipos
- **Múltiples Roles**: 
  - Administrador
  - Líder de Equipo
  - Árbitro
  - Viewer (Público)
- **Modo Oscuro**: Interfaz con soporte para tema claro y oscuro
- **Responsive**: Diseño adaptativo para móviles, tablets y escritorio

## 🛠️ Tecnologías

- **Framework**: Next.js 16.0.10
- **React**: 19.2.1
- **TypeScript**: 5
- **Estilos**: Tailwind CSS 4
- **Base de Datos**: Supabase
- **Estado**: TanStack Query, Zustand
- **Iconos**: Lucide React
- **PDF**: jsPDF

## 📋 Requisitos Previos

- Node.js 18+ 
- npm, yarn, pnpm o bun
- Cuenta de Supabase con proyecto configurado
- Variables de entorno configuradas (ver `.env.local`)

## 🔧 Instalación

1. Clona el repositorio:
```bash
git clone <url-del-repositorio>
cd limpus
```

2. Instala las dependencias:
```bash
npm install
# o
yarn install
# o
pnpm install
```

3. Configura las variables de entorno:
Crea un archivo `.env.local` en la raíz del proyecto con:
```env
NEXT_PUBLIC_SUPABASE_URL=tu_url_de_supabase
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu_clave_anonima_de_supabase
```

4. Ejecuta el servidor de desarrollo:
```bash
npm run dev
# o
yarn dev
# o
pnpm dev
```

5. Abre [http://localhost:3000](http://localhost:3000) en tu navegador.

## 📁 Estructura del Proyecto

```
limpus/
├── public/              # Archivos estáticos (imágenes, etc.)
│   └── img/            # Imágenes del proyecto
├── src/
│   ├── app/            # Páginas y rutas de Next.js
│   │   ├── dashboard/  # Panel de control
│   │   │   ├── torneos/    # Gestión de torneos
│   │   │   ├── equipos/    # Gestión de equipos
│   │   │   ├── usuarios/   # Gestión de usuarios
│   │   │   ├── inscripciones/ # Inscripciones
│   │   │   ├── leader/      # Panel de líder de equipo
│   │   │   └── viewers/     # Vista pública
│   │   ├── login/      # Página de inicio de sesión
│   │   └── registro/   # Página de registro
│   ├── components/     # Componentes reutilizables
│   ├── contexts/       # Contextos de React
│   ├── hooks/          # Custom hooks
│   └── lib/            # Utilidades y configuración
└── package.json
```

## 🎯 Scripts Disponibles

- `npm run dev` - Inicia el servidor de desarrollo
- `npm run build` - Construye la aplicación para producción
- `npm run start` - Inicia el servidor de producción
- `npm run lint` - Ejecuta el linter de ESLint

## 👥 Roles y Permisos

### Administrador
- Gestión completa de torneos, equipos y usuarios
- Programación de partidos
- Publicación de resultados
- Visualización de estadísticas y clasificaciones

### Líder de Equipo
- Ver información de su equipo
- Llenar inscripciones de jugadores
- Ver partidos de su equipo
- Ver estadísticas del equipo

### Árbitro
- Ver partidos asignados
- Acceso a información general

### Viewer (Público)
- Ver partidos en vivo
- Ver clasificaciones
- Explorar deportes y equipos

## 🗄️ Base de Datos

El proyecto utiliza Supabase como backend. Las tablas principales incluyen:

- `tournaments` - Torneos
- `teams` - Equipos
- `careers` - Carreras/Facultades
- `players` - Jugadores
- `matches` - Partidos
- `match_results` - Resultados de partidos
- `match_events` - Eventos de partidos (goles, tarjetas, etc.)
- `registration_forms` - Formularios de inscripción
- `team_registrations` - Inscripciones de equipos
- `team_leaders` - Líderes de equipos
- `profiles` - Perfiles de usuarios
- `user_roles` - Roles de usuarios

## 🎨 Personalización

### Tema Oscuro/Claro
El proyecto incluye soporte para modo oscuro que se puede alternar desde el panel de administración.

### Scrollbars
Los scrollbars están configurados con tema oscuro globalmente en `src/app/globals.css`.

### Tamaño de Fuente Base
El tamaño base de fuente está configurado en `src/app/globals.css` para una mejor proporción al 100% de zoom.

## 📝 Notas de Desarrollo

- El proyecto utiliza TypeScript para type safety
- TanStack Query se usa para el manejo de datos y caché
- Los componentes están organizados por funcionalidad
- Se utiliza Tailwind CSS para estilos con clases utilitarias

## 🐛 Solución de Problemas

### El favicon no aparece
- Limpia la caché del navegador (Ctrl + Shift + R)
- Reinicia el servidor de desarrollo
- Verifica que la imagen existe en `public/img/LImpus.png`

### Errores de conexión a Supabase
- Verifica que las variables de entorno estén correctamente configuradas
- Asegúrate de que las credenciales de Supabase sean válidas
- Revisa la configuración de políticas de seguridad en Supabase

## 📄 Licencia

Este proyecto es privado y de uso interno.

## 👨‍💻 Desarrollo

Para contribuir al proyecto, asegúrate de:
1. Seguir las convenciones de código establecidas
2. Ejecutar `npm run lint` antes de hacer commit
3. Probar los cambios en desarrollo antes de hacer merge

---

Desarrollado para la gestión de olimpiadas universitarias.
