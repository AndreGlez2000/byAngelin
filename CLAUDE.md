# Angelin Esthetician App — Instrucciones para Claude

## Notion: Documentación automática de cambios

Cada vez que hagas un cambio importante al sistema, **debes actualizar las páginas correspondientes en Notion** antes de dar la respuesta por terminada.

El hub del proyecto está en: **"Angelin Esthetician App"** (Notion workspace)

### Mapa de cambios → páginas a actualizar

| Tipo de cambio | Página Notion | Qué actualizar |
|---|---|---|
| Cambio al schema de Prisma (nuevo modelo, campo, relación) | **03 — Schema de Base de Datos** | Schema completo, diagrama de relaciones, nota de qué cambió |
| Nueva ruta API o página de UI | **00 — Contexto & Stack** | Tabla de rutas, estructura de archivos |
| Chunk completado | **01 — Roadmap** | Cambiar estado a ✅, mover descripción a "Chunks completados" |
| Inicio de nuevo chunk | **01 — Roadmap** + **02 — Chunk Activo** | Marcar chunk como 🔧, reemplazar contenido de 02 con el nuevo chunk |
| Avance dentro del chunk activo (fase completada) | **02 — Chunk Activo** | Marcar checkbox de la fase completada |
| Cambio al stack o dependencias | **00 — Contexto & Stack** | Tabla de stack, convenciones |
| Nueva decisión de diseño importante | **00 — Contexto & Stack** | Tabla de decisiones de diseño |
| Cambio al seed data | **03 — Schema de Base de Datos** | Sección "Seed data" |
| Nueva información de dominio (servicios, productos, protocolos) | **04 — Referencia de Dominio** | Tabla correspondiente |

### Qué cuenta como "cambio importante"

- Cualquier modificación a `prisma/schema.prisma`
- Agregar o eliminar rutas API (`app/api/...`)
- Agregar o eliminar páginas de UI (`app/(admin)/...`)
- Completar una fase completa del chunk activo
- Completar un chunk entero
- Cambiar dependencias (`package.json`)
- Nuevas decisiones de arquitectura o diseño

### Qué NO requiere actualización

- Fixes de bugs menores dentro de archivos existentes
- Cambios de estilos/UI sin cambio de funcionalidad
- Refactors internos sin cambio de interfaz pública

---

## Contexto del proyecto

Sistema de gestión privado para Angelin, esteticista independiente en Tijuana, México.
**No es plataforma pública.** Solo Angelin lo usa (admin única).

- **Repo local:** `C:\Users\andre\projects\angelin-app`
- **Stack:** Next.js 14 App Router · Prisma v7 + PrismaPg · NextAuth v4 · PostgreSQL · Tailwind CSS v3
- **DB sync:** Siempre usar `npx prisma db push` (NO `migrate dev`)
- **Singleton Prisma:** Importar desde `@/lib/db`
- **Auth en APIs:** Todas las rutas usan `getServerSession(authOptions)` — retornar 401 si no hay sesión
- **Middleware:** Excluye todas las rutas `/api/*` (se auto-protegen)
- **Diseño:** Pencil file en `C:\Users\andre\projects\angelinesthetician\views.pen`

## Chunk activo

**Chunk 5 — Inventario · Pagos · Dashboard**
Ver página **"02 — Chunk Activo"** en Notion para detalle completo de fases y decisiones.
