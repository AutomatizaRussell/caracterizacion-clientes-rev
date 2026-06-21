export const ROLES = ["Staff", "Senior", "Gerente", "Socio", "Admin"] as const;

export const PERMISSION_OPTIONS = [
  "Permitido",
  "No permitido",
  "Excepcional",
  "No aplica",
] as const;

export const SCOPE_OPTIONS = [
  "Asignación propia",
  "Línea jerárquica",
  "Toda la organización",
] as const;

export type PermissionRole = (typeof ROLES)[number];
export type PermissionValue = (typeof PERMISSION_OPTIONS)[number];
export type ScopeValue = (typeof SCOPE_OPTIONS)[number];

export type PermissionCell = {
  permission: PermissionValue;

  /**
   * Compatibilidad con versiones anteriores de la demo.
   * Antes el alcance era un único valor seleccionado.
   */
  scope?: ScopeValue | null;

  /**
   * Versión actual:
   * permite varios alcances simultáneos mediante checkboxes.
   */
  scopes?: ScopeValue[];
};

export type PermissionActionRow = {
  id: string;
  action: string;
  description: string;
  notes?: string;
  cells: Record<PermissionRole, PermissionCell>;
};

export type PermissionModule = {
  id: string;
  title: string;
  description: string;
  actions: PermissionActionRow[];
};

function cell(
  permission: PermissionValue,
  scope?: ScopeValue | null,
): PermissionCell {
  return {
    permission,
    scope: scope ?? null,
  };
}

const own = "Asignación propia";
const line = "Línea jerárquica";
const all = "Toda la organización";

export const DEFAULT_PERMISSION_MATRIX: PermissionModule[] = [
  {
    id: "clientes",
    title: "Clientes",
    description:
      "Permisos sobre creación, edición, estado y asignación jerárquica de clientes.",
    actions: [
      {
        id: "clientes.ver",
        action: "Ver clientes",
        description:
          "Consultar clientes dentro del alcance autorizado del rol. No implica ver auditoría administrativa completa.",
        cells: {
          Staff: cell("Permitido", own),
          Senior: cell("Permitido", line),
          Gerente: cell("Permitido", line),
          Socio: cell("Permitido", line),
          Admin: cell("Permitido", all),
        },
      },
      {
        id: "clientes.crear",
        action: "Crear cliente",
        description: "Registrar un nuevo cliente en la plataforma.",
        cells: {
          Staff: cell("No permitido"),
          Senior: cell("No permitido"),
          Gerente: cell("Excepcional", line),
          Socio: cell("Excepcional", line),
          Admin: cell("Permitido", all),
        },
      },
      {
        id: "clientes.editar_basicos",
        action: "Editar datos básicos del cliente",
        description:
          "Modificar información base del cliente, como razón social, NIT o datos generales.",
        cells: {
          Staff: cell("No permitido"),
          Senior: cell("No permitido"),
          Gerente: cell("Excepcional", line),
          Socio: cell("Excepcional", line),
          Admin: cell("Permitido", all),
        },
      },
      {
        id: "clientes.cambiar_estado",
        action: "Cambiar estado del cliente",
        description:
          "Activar o inactivar cliente. Un cliente inactivo bloquea nuevas solicitudes, pero conserva históricos.",
        cells: {
          Staff: cell("No permitido"),
          Senior: cell("No permitido"),
          Gerente: cell("Excepcional", line),
          Socio: cell("Excepcional", line),
          Admin: cell("Permitido", all),
        },
      },
      {
        id: "clientes.asignar_staff",
        action: "Asignar Staff al cliente",
        description: "Definir Staff responsables del cliente.",
        cells: {
          Staff: cell("No permitido"),
          Senior: cell("Permitido", line),
          Gerente: cell("Permitido", line),
          Socio: cell("Permitido", line),
          Admin: cell("Permitido", all),
        },
      },
      {
        id: "clientes.asignar_senior",
        action: "Asignar Senior al cliente",
        description: "Definir Senior responsable del cliente.",
        notes:
          "Debe conservar trazabilidad y considerar impacto sobre Staff ya asignados.",
        cells: {
          Staff: cell("No permitido"),
          Senior: cell("No permitido"),
          Gerente: cell("Permitido", line),
          Socio: cell("Permitido", line),
          Admin: cell("Permitido", all),
        },
      },
      {
        id: "clientes.asignar_gerente",
        action: "Asignar Gerente al cliente",
        description: "Definir Gerente responsable del cliente.",
        notes: "Un cliente no debe pertenecer a más de una rama de Socio.",
        cells: {
          Staff: cell("No permitido"),
          Senior: cell("No permitido"),
          Gerente: cell("No permitido"),
          Socio: cell("Permitido", line),
          Admin: cell("Permitido", all),
        },
      },
      {
        id: "clientes.asignar_socio",
        action: "Asignar Socio al cliente",
        description: "Definir Socio o rama responsable del cliente.",
        cells: {
          Staff: cell("No permitido"),
          Senior: cell("No permitido"),
          Gerente: cell("No permitido"),
          Socio: cell("No permitido"),
          Admin: cell("Permitido", all),
        },
      },
    ],
  },
  {
    id: "caracterizacion",
    title: "Caracterización",
    description:
      "Permisos del módulo de caracterización. No hace parte del flujo principal de solicitudes de información, pero se conserva en la matriz completa.",
    actions: [
      {
        id: "caracterizacion.ver",
        action: "Ver caracterización",
        description: "Consultar la caracterización del cliente.",
        cells: {
          Staff: cell("Permitido", own),
          Senior: cell("Permitido", line),
          Gerente: cell("Permitido", line),
          Socio: cell("Permitido", line),
          Admin: cell("Permitido", all),
        },
      },
      {
        id: "caracterizacion.crear",
        action: "Crear caracterización",
        description: "Inicializar formulario de caracterización.",
        notes: "Responsabilidad principal del Senior.",
        cells: {
          Staff: cell("No permitido"),
          Senior: cell("Permitido", line),
          Gerente: cell("Excepcional", line),
          Socio: cell("Excepcional", line),
          Admin: cell("Permitido", all),
        },
      },
      {
        id: "caracterizacion.editar",
        action: "Editar caracterización",
        description:
          "Diligenciar o modificar respuestas mientras la caracterización esté abierta.",
        notes: "Caracterización confirmada bloquea edición hasta reapertura.",
        cells: {
          Staff: cell("No permitido"),
          Senior: cell("Permitido", line),
          Gerente: cell("Excepcional", line),
          Socio: cell("Excepcional", line),
          Admin: cell("Permitido", all),
        },
      },
      {
        id: "caracterizacion.confirmar",
        action: "Confirmar caracterización",
        description: "Bloquear caracterización como confirmada.",
        notes: "Pendiente validar si Gerente debe confirmar lo diligenciado por Senior.",
        cells: {
          Staff: cell("No permitido"),
          Senior: cell("Permitido", line),
          Gerente: cell("Permitido", line),
          Socio: cell("Excepcional", line),
          Admin: cell("Permitido", all),
        },
      },
      {
        id: "caracterizacion.reabrir",
        action: "Reabrir caracterización confirmada",
        description: "Permitir edición posterior a confirmación.",
        notes: "Debe marcar cambios posteriores y exigir trazabilidad.",
        cells: {
          Staff: cell("No permitido"),
          Senior: cell("No permitido"),
          Gerente: cell("Permitido", line),
          Socio: cell("Excepcional", line),
          Admin: cell("Permitido", all),
        },
      },
      {
        id: "caracterizacion.ver_cambios",
        action: "Ver cambios posteriores a confirmación",
        description:
          "Consultar cambios posteriores a una caracterización ya confirmada.",
        cells: {
          Staff: cell("Permitido", own),
          Senior: cell("Permitido", line),
          Gerente: cell("Permitido", line),
          Socio: cell("Permitido", line),
          Admin: cell("Permitido", all),
        },
      },
      {
        id: "caracterizacion.exportar",
        action: "Exportar caracterización",
        description: "Exportar información de caracterización.",
        cells: {
          Staff: cell("No permitido"),
          Senior: cell("Permitido", line),
          Gerente: cell("Permitido", line),
          Socio: cell("Permitido", line),
          Admin: cell("Permitido", all),
        },
      },
    ],
  },
  {
    id: "solicitudes-informacion",
    title: "Solicitudes de información",
    description:
      "Permisos para crear, enviar, cancelar, reintentar y consultar solicitudes de información.",
    actions: [
      {
        id: "solicitudes.ver",
        action: "Ver solicitudes de información",
        description: "Consultar solicitudes de información según alcance autorizado.",
        cells: {
          Staff: cell("Permitido", own),
          Senior: cell("Permitido", line),
          Gerente: cell("Permitido", line),
          Socio: cell("Permitido", line),
          Admin: cell("Permitido", all),
        },
      },
      {
        id: "solicitudes.ver_estado",
        action: "Ver estado de la solicitud de información",
        description:
          "Ver estado principal de la solicitud: creada, generada, enviada, fallida, cancelada o completada.",
        notes:
          "No incluye auditoría técnica, respuesta del cliente, archivos recibidos ni revisión interna.",
        cells: {
          Staff: cell("Permitido", own),
          Senior: cell("Permitido", line),
          Gerente: cell("Permitido", line),
          Socio: cell("Permitido", line),
          Admin: cell("Permitido", all),
        },
      },
      {
        id: "solicitudes.crear",
        action: "Crear solicitud de información",
        description:
          "Crear una solicitud de información para un cliente. Incluye preparación y edición del borrador antes del envío.",
        cells: {
          Staff: cell("Permitido", own),
          Senior: cell("Excepcional", line),
          Gerente: cell("Excepcional", line),
          Socio: cell("Excepcional", line),
          Admin: cell("Permitido", all),
        },
      },
      {
        id: "solicitudes.enviar_cliente",
        action: "Enviar solicitud al cliente",
        description:
          "Enviar formalmente la solicitud al cliente. Puede incluir generación de documento, radicado, formulario y correo.",
        cells: {
          Staff: cell("Permitido", own),
          Senior: cell("Excepcional", line),
          Gerente: cell("Excepcional", line),
          Socio: cell("Excepcional", line),
          Admin: cell("Permitido", all),
        },
      },
      {
        id: "solicitudes.cancelar",
        action: "Cancelar solicitud",
        description:
          "Dejar sin efecto una solicitud conservando radicado, documentos, carpetas y trazabilidad.",
        notes:
          "Cancelar puede revocar/desactivar accesos asociados, pero no debe borrar históricos.",
        cells: {
          Staff: cell("No permitido"),
          Senior: cell("Permitido", line),
          Gerente: cell("Permitido", line),
          Socio: cell("Permitido", line),
          Admin: cell("Permitido", all),
        },
      },
      {
        id: "solicitudes.reintentar_fallo",
        action: "Reintentar envío fallido",
        description:
          "Reintentar un envío o automatización fallida relacionada con correo, PDF, OneDrive o n8n.",
        cells: {
          Staff: cell("No permitido"),
          Senior: cell("Permitido", line),
          Gerente: cell("Permitido", line),
          Socio: cell("Excepcional", line),
          Admin: cell("Permitido", all),
        },
      },
    ],
  },
  {
    id: "formulario-respuesta-cliente",
    title: "Formulario de respuesta del cliente",
    description:
      "Permisos sobre el acceso del cliente al formulario asociado a solicitudes de información.",
    actions: [
      {
        id: "formulario.ver_estado",
        action: "Ver estado del formulario de respuesta",
        description:
          "Ver si el acceso fue generado, reenviado, abierto, desactivado o si el cliente respondió.",
        cells: {
          Staff: cell("Permitido", own),
          Senior: cell("Permitido", line),
          Gerente: cell("Permitido", line),
          Socio: cell("Permitido", line),
          Admin: cell("Permitido", all),
        },
      },
      {
        id: "formulario.ver_respuestas",
        action: "Ver respuestas del cliente",
        description:
          "Consultar respuestas diligenciadas por el cliente dentro del alcance autorizado.",
        cells: {
          Staff: cell("Permitido", own),
          Senior: cell("Permitido", line),
          Gerente: cell("Permitido", line),
          Socio: cell("Permitido", line),
          Admin: cell("Permitido", all),
        },
      },
      {
        id: "formulario.generar_acceso",
        action: "Generar acceso al formulario",
        description:
          "Habilitar el acceso del cliente al formulario de respuesta asociado a una solicitud.",
        cells: {
          Staff: cell("Permitido", own),
          Senior: cell("Excepcional", line),
          Gerente: cell("Excepcional", line),
          Socio: cell("No permitido"),
          Admin: cell("Permitido", all),
        },
      },
      {
        id: "formulario.reenviar_acceso",
        action: "Reenviar acceso al formulario",
        description:
          "Reenviar al cliente el acceso al formulario de respuesta.",
        cells: {
          Staff: cell("Permitido", own),
          Senior: cell("Permitido", line),
          Gerente: cell("Excepcional", line),
          Socio: cell("No permitido"),
          Admin: cell("Permitido", all),
        },
      },
      {
        id: "formulario.desactivar_acceso",
        action: "Desactivar acceso al formulario",
        description:
          "Bloquear el acceso del cliente al formulario sin borrar solicitud, respuestas, documentos ni trazabilidad.",
        cells: {
          Staff: cell("No permitido"),
          Senior: cell("Permitido", line),
          Gerente: cell("Permitido", line),
          Socio: cell("Excepcional", line),
          Admin: cell("Permitido", all),
        },
      },
    ],
  },
  {
    id: "entregables-recibidos",
    title: "Entregables recibidos",
    description:
      "Permisos para ver y asociar archivos recibidos del cliente con los ítems solicitados.",
    actions: [
      {
        id: "entregables.ver",
        action: "Ver entregables y archivos recibidos",
        description:
          "Ver ítems enviados, archivos cargados y relación actual entre archivos e ítems solicitados.",
        cells: {
          Staff: cell("Permitido", own),
          Senior: cell("Permitido", line),
          Gerente: cell("Permitido", line),
          Socio: cell("Permitido", line),
          Admin: cell("Permitido", all),
        },
      },
      {
        id: "entregables.asociar_archivo_item",
        action: "Asociar archivo recibido a ítem solicitado",
        description:
          "Vincular manualmente un archivo cargado por el cliente con el ítem solicitado correspondiente.",
        notes:
          "Necesario cuando la relación no quede clara o no se haga automáticamente.",
        cells: {
          Staff: cell("Permitido", own),
          Senior: cell("Excepcional", line),
          Gerente: cell("No permitido"),
          Socio: cell("No permitido"),
          Admin: cell("Permitido", all),
        },
      },
      {
        id: "entregables.modificar_asociacion_archivo_item",
        action: "Modificar asociación de archivo recibido a ítem solicitado",
        description:
          "Cambiar una asociación existente entre archivo recibido e ítem solicitado.",
        notes:
          "No modifica el archivo ni el ítem; solo cambia la relación entre ambos.",
        cells: {
          Staff: cell("Permitido", own),
          Senior: cell("Permitido", line),
          Gerente: cell("Excepcional", line),
          Socio: cell("No permitido"),
          Admin: cell("Permitido", all),
        },
      },
    ],
  },
  {
    id: "revision-interna",
    title: "Revisión interna",
    description:
      "Permisos para aprobar o rechazar entregables recibidos durante la revisión por rol.",
    actions: [
      {
        id: "revision.ver_estado",
        action: "Ver estado de revisión",
        description:
          "Ver estado actual de revisión de los entregables dentro del alcance autorizado.",
        notes:
          "No incluye auditoría técnica completa ni logs administrativos.",
        cells: {
          Staff: cell("Permitido", own),
          Senior: cell("Permitido", line),
          Gerente: cell("Permitido", line),
          Socio: cell("Permitido", line),
          Admin: cell("Permitido", all),
        },
      },
      {
        id: "revision.aprobar_rechazar_entregables",
        action: "Aprobar/rechazar entregables recibidos",
        description:
          "Marcar cada entregable como aprobado o rechazado durante la revisión correspondiente.",
        notes:
          "Los ítems no avanzan ni se devuelven individualmente al momento de marcarlos; el resultado se consolida al finalizar revisión.",
        cells: {
          Staff: cell("Permitido", own),
          Senior: cell("Permitido", line),
          Gerente: cell("Excepcional", line),
          Socio: cell("No permitido"),
          Admin: cell("Permitido", all),
        },
      },
    ],
  },
  {
    id: "documentos-carpetas-cliente",
    title: "Documentos y carpetas del cliente",
    description:
      "Permisos sobre PDF generado, carpetas del cliente y reparación controlada de estructura.",
    actions: [
      {
        id: "documentos.ver_pdf_solicitud",
        action: "Ver PDF generado de la solicitud",
        description:
          "Abrir o descargar el PDF vigente generado para la solicitud de información.",
        notes: "El HTML permanece oculto al usuario.",
        cells: {
          Staff: cell("Permitido", own),
          Senior: cell("Permitido", line),
          Gerente: cell("Permitido", line),
          Socio: cell("Permitido", line),
          Admin: cell("Permitido", all),
        },
      },
      {
        id: "documentos.acceder_carpetas_cliente",
        action: "Acceder carpetas del cliente",
        description:
          "Abrir carpetas del cliente dentro del alcance autorizado. La estructura es general por año y cliente, no exclusiva del flujo de solicitudes.",
        cells: {
          Staff: cell("Permitido", own),
          Senior: cell("Permitido", line),
          Gerente: cell("Permitido", line),
          Socio: cell("Permitido", line),
          Admin: cell("Permitido", all),
        },
      },
      {
        id: "documentos.regenerar_pdf_solicitud",
        action: "Regenerar PDF de la solicitud",
        description:
          "Generar nuevamente el PDF de una solicitud de información cuando cambian datos o contenido.",
        cells: {
          Staff: cell("No permitido"),
          Senior: cell("Permitido", line),
          Gerente: cell("Permitido", line),
          Socio: cell("Excepcional", line),
          Admin: cell("Permitido", all),
        },
      },
      {
        id: "documentos.completar_estructura_carpetas_cliente",
        action: "Completar estructura de carpetas del cliente",
        description:
          "Crear únicamente carpetas faltantes dentro de la estructura estándar del año y cliente.",
        notes:
          "No mueve, borra ni reemplaza carpetas o archivos existentes. No modifica permisos de OneDrive.",
        cells: {
          Staff: cell("No permitido"),
          Senior: cell("No permitido"),
          Gerente: cell("Excepcional", line),
          Socio: cell("Excepcional", line),
          Admin: cell("Permitido", all),
        },
      },
    ],
  },
  {
    id: "radicados",
    title: "Radicados",
    description:
      "Permisos de consulta sobre radicados y consecutivos. La creación manual no se permite.",
    actions: [
      {
        id: "radicados.ver",
        action: "Ver radicados",
        description: "Consultar radicados asociados a solicitudes.",
        cells: {
          Staff: cell("Permitido", own),
          Senior: cell("Permitido", line),
          Gerente: cell("Permitido", line),
          Socio: cell("Permitido", line),
          Admin: cell("Permitido", all),
        },
      },
      {
        id: "radicados.ver_consecutivo",
        action: "Ver consecutivo por cliente/año",
        description:
          "Consultar el consecutivo interno utilizado para radicados por cliente y año.",
        notes:
          "Acción técnica/administrativa. No permite crear ni modificar radicados.",
        cells: {
          Staff: cell("No permitido"),
          Senior: cell("No permitido"),
          Gerente: cell("Excepcional", line),
          Socio: cell("Excepcional", line),
          Admin: cell("Permitido", all),
        },
      },
    ],
  },
  {
    id: "administracion",
    title: "Administración",
    description:
      "Permisos administrativos sobre usuarios, roles, asignaciones, matriz y auditoría.",
    actions: [
      {
        id: "admin.ver_usuarios",
        action: "Ver usuarios",
        description: "Consultar usuarios o empleados.",
        cells: {
          Staff: cell("No permitido"),
          Senior: cell("No permitido"),
          Gerente: cell("Excepcional", line),
          Socio: cell("Excepcional", line),
          Admin: cell("Permitido", all),
        },
      },
      {
        id: "admin.editar_usuario",
        action: "Editar usuario",
        description: "Actualizar datos básicos de usuario.",
        cells: {
          Staff: cell("No permitido"),
          Senior: cell("No permitido"),
          Gerente: cell("No permitido"),
          Socio: cell("No permitido"),
          Admin: cell("Permitido", all),
        },
      },
      {
        id: "admin.cambiar_rol_cargo",
        action: "Cambiar rol/cargo",
        description: "Modificar rol o cargo operativo.",
        cells: {
          Staff: cell("No permitido"),
          Senior: cell("No permitido"),
          Gerente: cell("No permitido"),
          Socio: cell("No permitido"),
          Admin: cell("Permitido", all),
        },
      },
      {
        id: "admin.asignar_responsable_jerarquico",
        action: "Asignar responsable jerárquico",
        description: "Definir línea Staff/Senior/Gerente/Socio.",
        cells: {
          Staff: cell("No permitido"),
          Senior: cell("No permitido"),
          Gerente: cell("Excepcional", line),
          Socio: cell("Permitido", line),
          Admin: cell("Permitido", all),
        },
      },
      {
        id: "admin.administrar_asignaciones",
        action: "Administrar asignaciones",
        description: "Administrar relación cliente-empleado/equipo.",
        cells: {
          Staff: cell("No permitido"),
          Senior: cell("Permitido", line),
          Gerente: cell("Permitido", line),
          Socio: cell("Permitido", line),
          Admin: cell("Permitido", all),
        },
      },
      {
        id: "admin.ver_matriz",
        action: "Ver matriz de permisos",
        description: "Consultar matriz de permisos.",
        cells: {
          Staff: cell("No permitido"),
          Senior: cell("No permitido"),
          Gerente: cell("Excepcional", line),
          Socio: cell("Excepcional", line),
          Admin: cell("Permitido", all),
        },
      },
      {
        id: "admin.editar_matriz",
        action: "Editar matriz de permisos",
        description: "Modificar matriz de permisos.",
        cells: {
          Staff: cell("No permitido"),
          Senior: cell("No permitido"),
          Gerente: cell("No permitido"),
          Socio: cell("Excepcional", line),
          Admin: cell("Permitido", all),
        },
      },
      {
        id: "admin.ver_auditoria",
        action: "Ver auditoría administrativa",
        description: "Ver cambios críticos y trazabilidad administrativa.",
        cells: {
          Staff: cell("No permitido"),
          Senior: cell("No permitido"),
          Gerente: cell("Excepcional", line),
          Socio: cell("Excepcional", line),
          Admin: cell("Permitido", all),
        },
      },
    ],
  },
  {
    id: "seguimiento",
    title: "Seguimiento",
    description:
      "Vista tipo seguimiento/Smartsheet. Inicialmente de consulta operativa.",
    actions: [
      {
        id: "seguimiento.ver",
        action: "Ver vista de seguimiento",
        description: "Ver vista de seguimiento según alcance autorizado.",
        cells: {
          Staff: cell("Permitido", own),
          Senior: cell("Permitido", line),
          Gerente: cell("Permitido", line),
          Socio: cell("Permitido", line),
          Admin: cell("Permitido", all),
        },
      },
    ],
  },
];
