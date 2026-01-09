# Sistema de Clasificación por Disciplina

## Descripción

Sistema completo de clasificación de torneos multideporte con reglas configurables por disciplina.

## Estructura Creada

### 1. Tipos (`src/app/dashboard/torneos/types/standings.ts`)
- Define los tipos TypeScript para reglas, criterios de desempate y tablas de posiciones

### 2. Configuración de Reglas (`src/app/dashboard/torneos/config/disciplineRules.ts`)
- Reglas predefinidas para:
  - **Fútbol**: 3-1-0, desempate por diferencia de goles, goles a favor, Fair Play
  - **Básquet**: 2-1 (sin empates), desempate por diferencia de puntos
  - **Vóley**: Puntos por sets (3-0/3-1: 3pts, 3-2: 2pts, 2-3: 1pt), desempate por diferencia de sets
  - **Pádel**: 2-0, desempate por partidos ganados

### 3. Utilidad de Cálculo (`src/app/dashboard/torneos/utils/calculateStandings.ts`)
- Función `generateStandings()` que calcula tablas según reglas de disciplina
- Soporta todas las métricas: goles, puntos, sets, Fair Play

### 4. Hook (`src/app/dashboard/torneos/hooks/useStandings.ts`)
- `loadStandings()`: Carga partidos finalizados y calcula tabla de posiciones

### 5. Página de Tablas (`src/app/dashboard/torneos/tablas/page.tsx`)
- Interfaz para ver tablas de posiciones por disciplina
- Muestra reglas aplicadas y criterios de desempate

## Uso

1. **Acceder a Tablas de Posiciones**:
   - Desde la página principal de torneos, clic en "Tablas de Posiciones"
   - Seleccionar una disciplina del dropdown
   - Ver la tabla calculada automáticamente

2. **Agregar Nueva Disciplina**:
   - Editar `src/app/dashboard/torneos/config/disciplineRules.ts`
   - Agregar entrada en `DISCIPLINE_RULES`
   - Actualizar mapeo de IDs en `getDisciplineRules()`

## Notas Importantes

- **Vóley**: Actualmente usa `score_team_a` y `score_team_b` como sets. Para implementación completa, agregar campo `sets_team_a` y `sets_team_b` en `match_results` o guardar sets como eventos.
- **Fair Play**: Se calcula automáticamente desde tarjetas amarillas (1pt) y rojas (4pts) guardadas en `match_events`
- **Extensibilidad**: El sistema está diseñado para agregar nuevas disciplinas sin modificar la lógica central

## Próximos Pasos Recomendados

1. Agregar campo `sets_team_a` y `sets_team_b` en `match_results` para vóley
2. Crear tabla `discipline_rules` en BD para hacer reglas configurables desde admin
3. Agregar validación de sets en formulario de resultados para vóley
4. Implementar caché de tablas de posiciones para mejor rendimiento

