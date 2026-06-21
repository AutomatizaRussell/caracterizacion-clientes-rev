import type {
  PermissionCell,
  PermissionModule,
  PermissionValue,
  ScopeValue,
} from "@/features/permisos/permission-matrix.data";

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

export const DECISION_PERMISSION_MATRIX: PermissionModule[] = [
  {
    id: "clientes",
    title: "Clientes",
    description:
      "Acciones pendientes de definición sobre creación, edición, estado y asignación de clientes.",
    actions: [
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
    id: "solicitudes-informacion",
    title: "Solicitudes de información",
    description:
      "Acciones principales del flujo de creación, envío, cancelación y reintento.",
    actions: [
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
      "Acciones sobre el acceso del cliente al formulario asociado a la solicitud.",
    actions: [
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
        description: "Reenviar al cliente el acceso al formulario de respuesta.",
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
      "Acciones para asociar archivos recibidos con los ítems solicitados.",
    actions: [
      {
        id: "entregables.asociar_archivo_item",
        action: "Asociar archivo recibido a ítem solicitado",
        description:
          "Vincular manualmente un archivo cargado por el cliente con el ítem solicitado correspondiente.",
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
      "Acción principal para aprobar o rechazar entregables recibidos durante la revisión.",
    actions: [
      {
        id: "revision.aprobar_rechazar_entregables",
        action: "Aprobar/rechazar entregables recibidos",
        description:
          "Marcar cada entregable como aprobado o rechazado durante la revisión correspondiente.",
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
      "Acciones sobre PDF generado y estructura de carpetas del cliente.",
    actions: [
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
];

export const DECISION_MATRIX_RULES = [
  "Las acciones de consulta y estado no se diligencian en esta matriz; se asumen según el alcance del rol.",
  "Finalizar revisión está disponible para los roles que pueden aprobar/rechazar entregables recibidos.",
  "Las observaciones de revisión son obligatorias al rechazar y opcionales al aprobar, según la configuración final del flujo.",
  "Las reglas de alertas y correos se definirán posteriormente.",
];

export const DECISION_ACTION_DETAILS = [
  {
    action: "Asociar archivo recibido a ítem solicitado",
    detail:
      "Permite al Staff vincular manualmente un archivo cargado por el cliente con el ítem solicitado correspondiente, cuando la relación no quede clara o no se haga automáticamente.",
    example:
      "El cliente marca el check “Extractos bancarios” y carga varios archivos. El Staff identifica cuál archivo corresponde a ese ítem y lo asocia para poder revisarlo correctamente.",
  },
  {
    action: "Modificar asociación de archivo recibido a ítem solicitado",
    detail:
      "Permite cambiar una asociación existente entre un archivo recibido y un ítem solicitado, cuando el archivo fue vinculado al ítem equivocado o debe reasignarse.",
    example:
      "Un archivo fue asociado inicialmente al ítem “Extractos bancarios”, pero realmente corresponde al ítem “Conciliaciones bancarias”.",
  },
  {
    action: "Aprobar/rechazar entregables recibidos",
    detail:
      "Permite marcar cada entregable recibido como aprobado o rechazado durante la revisión correspondiente. Los ítems no avanzan ni se devuelven individualmente al momento de marcarlos.",
    example:
      "El Staff marca dos ítems como aprobados y uno como rechazado. Al finalizar revisión, el sistema consolida el resultado.",
  },
  {
    action: "Completar estructura de carpetas del cliente",
    detail:
      "Permite crear únicamente carpetas faltantes dentro de la estructura estándar definida para el cliente y el año correspondiente.",
    example:
      "Si falta una carpeta esperada dentro de la estructura anual del cliente, el sistema crea solo esa carpeta faltante.",
  },
];
