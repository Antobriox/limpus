# 🔥 Configuración de Tiempo Real en Supabase

## ⚡ Ya está implementado en el código

El código ya está listo para funcionar en tiempo real. Solo necesitas **habilitar Realtime en Supabase**.

## 📋 Pasos para habilitar Realtime en Supabase

### 1. Ir al Dashboard de Supabase
- Abre tu proyecto en https://supabase.com/dashboard
- Ve a la sección **Database** > **Replication**

### 2. Habilitar Realtime en las tablas

Activa Realtime para estas tablas (clic en el toggle):

✅ **matches** - Para ver partidos en tiempo real
✅ **match_results** - Para ver goles/resultados en tiempo real  
✅ **teams** - Para ver equipos actualizados
✅ **tournaments** - Para ver cambios en torneos
✅ **team_registrations** - Para ver inscripciones
✅ **registration_forms** - Para ver formularios
✅ **draws** - Para ver brackets/sorteos
✅ **profiles** - Para ver usuarios
✅ **user_roles** - Para ver roles de usuarios

### 3. Verificar que funcione

Abre tu aplicación en **dos navegadores** diferentes:

1. En uno como **Admin**: Crea un partido
2. En otro como **Viewer/Líder**: Verás el partido aparecer automáticamente **SIN RECARGAR** 🎉

## 🎯 ¿Qué actualizaciones verás en tiempo real?

### Para Viewers (Página pública):
- ✅ Partidos nuevos aparecen automáticamente
- ✅ Resultados/goles se actualizan en vivo
- ✅ Cambios de estado (en vivo, finalizado)
- ✅ Partidos próximos y pasados

### Para Líderes de Equipo:
- ✅ Partidos de su equipo
- ✅ Resultados en tiempo real
- ✅ Estadísticas actualizadas
- ✅ Inscripciones disponibles

### Para Administradores:
- ✅ Todos los partidos
- ✅ Equipos y torneos
- ✅ Inscripciones
- ✅ Usuarios y roles

## 🔧 Alternativa: Habilitar por SQL

Si prefieres SQL, ejecuta esto en el **SQL Editor**:

```sql
-- Habilitar Realtime para todas las tablas importantes
ALTER PUBLICATION supabase_realtime ADD TABLE matches;
ALTER PUBLICATION supabase_realtime ADD TABLE match_results;
ALTER PUBLICATION supabase_realtime ADD TABLE teams;
ALTER PUBLICATION supabase_realtime ADD TABLE tournaments;
ALTER PUBLICATION supabase_realtime ADD TABLE team_registrations;
ALTER PUBLICATION supabase_realtime ADD TABLE registration_forms;
ALTER PUBLICATION supabase_realtime ADD TABLE draws;
ALTER PUBLICATION supabase_realtime ADD TABLE profiles;
ALTER PUBLICATION supabase_realtime ADD TABLE user_roles;
```

## ✅ ¡Listo!

Una vez habilitado en Supabase, **todos los cambios se verán en tiempo real** en toda la aplicación. No necesitas hacer nada más en el código.

## 🐛 Si no funciona

1. Verifica que Realtime esté habilitado en todas las tablas
2. Revisa la consola del navegador (F12) para ver si hay errores
3. Asegúrate de tener las Row Level Security (RLS) policies configuradas correctamente
4. Recarga la aplicación después de habilitar Realtime

---

**Nota**: El código ya está optimizado para usar React Query con invalidación automática cuando detecta cambios. ¡Solo activa Realtime en Supabase y funcionará! 🚀
