# 🔥 ACTIVAR TIEMPO REAL - PASO A PASO

## ⚠️ IMPORTANTE: Debes hacer esto AHORA

El tiempo real NO funcionará hasta que ejecutes el script SQL en Supabase.

## 📋 PASOS PARA ACTIVAR:

### 1️⃣ Abre Supabase
- Ve a: https://supabase.com/dashboard
- Selecciona tu proyecto

### 2️⃣ Abre el SQL Editor
- En el menú lateral, busca **SQL Editor**
- Click en **New Query**

### 3️⃣ Copia y pega este script:

Abre el archivo `supabase/migrations/enable_realtime.sql` y copia TODO el contenido.

O copia esto directamente:

```sql
-- HABILITAR REALTIME
ALTER PUBLICATION supabase_realtime ADD TABLE matches;
ALTER PUBLICATION supabase_realtime ADD TABLE match_results;
ALTER PUBLICATION supabase_realtime ADD TABLE teams;
ALTER PUBLICATION supabase_realtime ADD TABLE tournaments;
ALTER PUBLICATION supabase_realtime ADD TABLE tournament_editions;
ALTER PUBLICATION supabase_realtime ADD TABLE team_registrations;
ALTER PUBLICATION supabase_realtime ADD TABLE registration_forms;
ALTER PUBLICATION supabase_realtime ADD TABLE draws;
ALTER PUBLICATION supabase_realtime ADD TABLE profiles;
ALTER PUBLICATION supabase_realtime ADD TABLE user_roles;
ALTER PUBLICATION supabase_realtime ADD TABLE team_leaders;
ALTER PUBLICATION supabase_realtime ADD TABLE sports;
```

### 4️⃣ Ejecuta el script
- Click en el botón **Run** (o presiona Ctrl+Enter)
- Deberías ver: `Success. No rows returned`

### 5️⃣ Verifica que funcione

Abre la consola del navegador (F12) y deberías ver:
```
🔥 Realtime subscriptions ACTIVADAS
```

Cuando agregues un gol, verás:
```
🎯 Cambio en RESULTADOS (goles/tarjetas): {...}
```

## ✅ PRUEBA:

1. Abre **2 navegadores** (o 2 ventanas incógnito)
2. En uno: **Admin** → Agrega un gol
3. En otro: **Viewer/Líder** → El gol aparece AUTOMÁTICAMENTE (sin recargar)

## 🐛 Si NO funciona:

### Verifica en la consola (F12):
- ✅ ¿Ves `🔥 Realtime subscriptions ACTIVADAS`?
- ✅ ¿Ves `🎯 Cambio en RESULTADOS` cuando agregas un gol?

### Si NO ves los mensajes:
1. Recarga la página
2. Verifica que ejecutaste el SQL en Supabase
3. Verifica las Row Level Security policies

### Si ves los mensajes pero NO se actualiza:
- Abre un issue en GitHub con los logs de la consola

## 📊 ¿Qué se actualizará en tiempo real?

### ⚽ Partidos:
- Crear partido → Aparece en todas las vistas
- Cambiar estado → Se actualiza en vivo
- Cambiar fecha/hora → Se refleja inmediatamente

### 🎯 Resultados:
- Agregar gol → **Aparece al instante**
- Agregar tarjeta → **Se muestra en vivo**
- Cambiar sets (voley) → **Actualización inmediata**

### 👥 Equipos:
- Crear equipo → Se ve en clasificación
- Actualizar → Cambios reflejados

### 📝 Inscripciones:
- Líder se inscribe → Admin lo ve al instante
- Admin crea formulario → Líder lo ve inmediatamente

### 🏆 Clasificación:
- Gol → Tabla se actualiza sola
- Partido finalizado → Posiciones se recalculan

---

## 💡 TIP:
Deja abierta la consola (F12) mientras pruebas para ver los logs en tiempo real y verificar que todo funcione.

---

**¿Listo? Ejecuta el SQL y disfruta del tiempo real! 🚀**
