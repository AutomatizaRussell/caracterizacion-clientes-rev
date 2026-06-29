# Flujo de revisión de entregables

## Rutas

- `/revision`: bandeja de revisiones.
- `/revision/[solicitudId]/asociacion`: paso 1, asociación archivo-ítem.
- `/revision/[solicitudId]`: paso 2, revisión y cierre.

## Reglas actuales

- Todos los ítems requieren archivo por ahora.
- Un archivo pertenece a un solo ítem.
- Un ítem puede tener varios archivos.
- La asociación es obligatoria antes de cerrar la revisión.
- La IA inicialmente sugiere asociaciones; la confirmación/corrección humana queda auditada.
- El extractor/LLM real se enchufa después manteniendo el mismo contrato de sugerencias.

## Estados de asociación

- `UNMATCHED`
- `SUGGESTED_BY_AI`
- `CONFIRMED_BY_USER`
- `MANUALLY_MATCHED`
- `REJECTED_MATCH`
- `IGNORED`

## Estados de revisión por ítem

- `PENDING_REVIEW`
- `APPROVED`
- `REJECTED`

## Roles

- Staff: primera revisión.
- Senior: revisa lo aprobado por Staff.
- Admin: puede accionar auditado como Admin.
- Gerente/Socio: no participan en esta versión.

## Correos

El cierre crea un resumen auditable. El envío real por n8n/correo debe conectarse en un segundo paquete usando `SolicitudRevisionCierre.emailStatus = PENDING`.
