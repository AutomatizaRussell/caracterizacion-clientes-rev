import { prisma } from "@/lib/prisma";

type CampoBase = {
  code: string;
  section: string;
  label: string;
  helpText: string;
  fieldType:
    | "TEXT"
    | "LONG_TEXT"
    | "INTEGER"
    | "DECIMAL"
    | "DATE"
    | "YES_NO_NA"
    | "SECTOR";
  orderIndex: number;
  isRequired?: boolean;
  unit?: string;
  exportColumnName: string;
  hasInlineDetail?: boolean;
  inlineDetailLabel?: string;
  inlineDetailRequiredWhenValue?: string;
  dependsOnFieldCode?: string;
  dependsOnValue?: string;
};

export const SECTORES = [
  "Salud",
  "Industria cosmética o química",
  "Transporte y Logística",
  "Servicios Empresariales",
  "Comercio y Distribución",
  "Industria y Manufactura",
  "Construcción e Infraestructura",
  "Inmobiliario",
  "Financiero y Crédito",
  "Tecnología y Digital",
  "Educación",
  "Agropecuario",
  "Turismo y Hospitalidad",
  "Servicios Públicos",
  "ESAL",
  "Inversiones",
] as const;

const CAMPOS_BASE: CampoBase[] = [
  {
    code: "nombre_cliente",
    section: "Datos básicos",
    label: "Nombre del cliente",
    helpText: "Nombre legal completo.",
    fieldType: "TEXT",
    orderIndex: 1,
    exportColumnName: "Nombre del cliente",
  },
  {
    code: "nit",
    section: "Datos básicos",
    label: "NIT",
    helpText: "Sin incluir dígito de verificación.",
    fieldType: "TEXT",
    orderIndex: 2,
    exportColumnName: "NIT",
  },
  {
    code: "sector_economico",
    section: "Datos básicos",
    label: "Sector económico",
    helpText: "En caso de tener dudas ver guía de sectores económicos.",
    fieldType: "SECTOR",
    orderIndex: 3,
    exportColumnName: "Sector económico",
  },
  {
    code: "responsable_diligencia",
    section: "Datos básicos",
    label: "Responsable que diligencia (Senior)",
    helpText: "Nombre de quien confirma la información.",
    fieldType: "TEXT",
    orderIndex: 4,
    exportColumnName: "Responsable que diligencia",
  },
  {
    code: "fecha_diligenciamiento",
    section: "Datos básicos",
    label: "Fecha de diligenciamiento",
    helpText: "Fecha en que se llena el formato.",
    fieldType: "DATE",
    orderIndex: 5,
    exportColumnName: "Fecha de diligenciamiento",
  },

  {
    code: "activos_totales_cierre_anterior",
    section: "Cifras financieras",
    label: "Activos totales al cierre anterior",
    helpText: "Registrar el valor en miles de pesos colombianos.",
    fieldType: "DECIMAL",
    orderIndex: 6,
    unit: "Miles de COP",
    exportColumnName: "Activos totales al cierre anterior",
  },
  {
    code: "pasivos_cierre_anterior",
    section: "Cifras financieras",
    label: "Pasivos al cierre anterior",
    helpText: "Registrar el valor en miles de pesos colombianos.",
    fieldType: "DECIMAL",
    orderIndex: 7,
    unit: "Miles de COP",
    exportColumnName: "Pasivos al cierre anterior",
  },
  {
    code: "patrimonio_cierre_anterior",
    section: "Cifras financieras",
    label: "Patrimonio al cierre anterior",
    helpText: "Registrar el valor en miles de pesos colombianos.",
    fieldType: "DECIMAL",
    orderIndex: 8,
    unit: "Miles de COP",
    exportColumnName: "Patrimonio al cierre anterior",
  },
  {
    code: "ingresos_operacionales",
    section: "Cifras financieras",
    label: "Ingresos operacionales",
    helpText: "Registrar el valor en miles de pesos colombianos.",
    fieldType: "DECIMAL",
    orderIndex: 9,
    unit: "Miles de COP",
    exportColumnName: "Ingresos operacionales",
  },
  {
    code: "ingresos_no_operacionales",
    section: "Cifras financieras",
    label: "Ingresos no operacionales",
    helpText: "Registrar el valor en miles de pesos colombianos.",
    fieldType: "DECIMAL",
    orderIndex: 10,
    unit: "Miles de COP",
    exportColumnName: "Ingresos no operacionales",
  },
  {
    code: "ingreso_fiscal",
    section: "Cifras financieras",
    label: "Ingreso fiscal",
    helpText: "Registrar el valor en miles de pesos colombianos.",
    fieldType: "DECIMAL",
    orderIndex: 11,
    unit: "Miles de COP",
    exportColumnName: "Ingreso fiscal",
  },
  {
    code: "costos_cierre_anterior",
    section: "Cifras financieras",
    label: "Costos al cierre anterior",
    helpText: "Registrar el valor en miles de pesos colombianos.",
    fieldType: "DECIMAL",
    orderIndex: 12,
    unit: "Miles de COP",
    exportColumnName: "Costos al cierre anterior",
  },
  {
    code: "gastos_cierre_anterior",
    section: "Cifras financieras",
    label: "Gastos al cierre anterior",
    helpText: "Registrar el valor en miles de pesos colombianos.",
    fieldType: "DECIMAL",
    orderIndex: 13,
    unit: "Miles de COP",
    exportColumnName: "Gastos al cierre anterior",
  },
  {
    code: "impuesto_renta_saldo_favor",
    section: "Cifras financieras",
    label: "Impuesto de renta / saldo a favor",
    helpText: "Registrar el valor en miles de pesos colombianos.",
    fieldType: "DECIMAL",
    orderIndex: 14,
    unit: "Miles de COP",
    exportColumnName: "Impuesto de renta / saldo a favor",
  },

  {
    code: "tiene_empleados",
    section: "Empleados y tercerización",
    label: "¿Tiene empleados?",
    helpText: "Responder Sí/No/No aplica.",
    fieldType: "YES_NO_NA",
    orderIndex: 15,
    hasInlineDetail: true,
    inlineDetailLabel: "Indique cantidad total si responde Sí.",
    inlineDetailRequiredWhenValue: "SI",
    exportColumnName: "¿Tiene empleados?",
  },
  {
    code: "cantidad_empleados_31_dic",
    section: "Empleados y tercerización",
    label: "Cantidad de empleados al 31 de diciembre",
    helpText: "Total al cierre del año anterior.",
    fieldType: "INTEGER",
    orderIndex: 16,
    unit: "Número",
    dependsOnFieldCode: "tiene_empleados",
    dependsOnValue: "SI",
    exportColumnName: "Cantidad de empleados al 31 de diciembre",
  },
  {
    code: "empleados_directos",
    section: "Empleados y tercerización",
    label: "Empleados directos",
    helpText: "Detalle: Número.",
    fieldType: "INTEGER",
    orderIndex: 17,
    unit: "Número",
    dependsOnFieldCode: "tiene_empleados",
    dependsOnValue: "SI",
    exportColumnName: "Empleados directos",
  },
  {
    code: "empleados_temporales_indirectos",
    section: "Empleados y tercerización",
    label: "Empleados temporales o indirectos",
    helpText: "Detalle: Número / empresa temporal.",
    fieldType: "LONG_TEXT",
    orderIndex: 18,
    dependsOnFieldCode: "tiene_empleados",
    dependsOnValue: "SI",
    exportColumnName: "Empleados temporales o indirectos",
  },
  {
    code: "tiene_servicios_tercerizados",
    section: "Empleados y tercerización",
    label: "¿Tiene servicios tercerizados?",
    helpText: "Responder Sí/No/No aplica.",
    fieldType: "YES_NO_NA",
    orderIndex: 19,
    exportColumnName: "¿Tiene servicios tercerizados?",
  },
  {
    code: "servicios_tercerizados",
    section: "Empleados y tercerización",
    label: "¿Cuáles servicios tiene tercerizados?",
    helpText: "Indique servicio: nómina, contabilidad, sistemas, RRHH, etc.",
    fieldType: "LONG_TEXT",
    orderIndex: 20,
    dependsOnFieldCode: "tiene_servicios_tercerizados",
    dependsOnValue: "SI",
    exportColumnName: "Servicios tercerizados",
  },

  {
    code: "es_matriz",
    section: "Grupo económico",
    label: "¿Es matriz?",
    helpText: "Responder Sí/No/No aplica.",
    fieldType: "YES_NO_NA",
    orderIndex: 21,
    hasInlineDetail: true,
    inlineDetailLabel: "Sociedades relacionadas si responde Sí.",
    inlineDetailRequiredWhenValue: "SI",
    exportColumnName: "¿Es matriz?",
  },
  {
    code: "tiene_vinculadas_nacionales",
    section: "Grupo económico",
    label: "¿Tiene vinculadas nacionales?",
    helpText: "Responder Sí/No/No aplica.",
    fieldType: "YES_NO_NA",
    orderIndex: 22,
    hasInlineDetail: true,
    inlineDetailLabel: "Nombre o cantidad si responde Sí.",
    inlineDetailRequiredWhenValue: "SI",
    exportColumnName: "¿Tiene vinculadas nacionales?",
  },
  {
    code: "tiene_vinculadas_exterior",
    section: "Grupo económico",
    label: "¿Tiene vinculadas en el exterior?",
    helpText: "Responder Sí/No/No aplica.",
    fieldType: "YES_NO_NA",
    orderIndex: 23,
    hasInlineDetail: true,
    inlineDetailLabel: "País / sociedad si responde Sí.",
    inlineDetailRequiredWhenValue: "SI",
    exportColumnName: "¿Tiene vinculadas en el exterior?",
  },
  {
    code: "consolida_estados_financieros",
    section: "Grupo económico",
    label: "¿Consolida estados financieros?",
    helpText: "Responder Sí/No/No aplica.",
    fieldType: "YES_NO_NA",
    orderIndex: 24,
    hasInlineDetail: true,
    inlineDetailLabel: "Nacional o exterior si responde Sí.",
    inlineDetailRequiredWhenValue: "SI",
    exportColumnName: "¿Consolida estados financieros?",
  },

  {
    code: "es_vigilada_inspeccionada_controlada",
    section: "Vigilancia y regulación",
    label: "¿Es vigilada, inspeccionada o controlada?",
    helpText: "Responder Sí/No/No aplica.",
    fieldType: "YES_NO_NA",
    orderIndex: 25,
    hasInlineDetail: true,
    inlineDetailLabel: "Entidad que supervisa si responde Sí.",
    inlineDetailRequiredWhenValue: "SI",
    exportColumnName: "¿Es vigilada, inspeccionada o controlada?",
  },
  {
    code: "entidad_supervision",
    section: "Vigilancia y regulación",
    label: "Entidad de supervisión",
    helpText: "Diligenciar si aplica. Supersociedades, Superfinanciera u otra.",
    fieldType: "TEXT",
    orderIndex: 26,
    dependsOnFieldCode: "es_vigilada_inspeccionada_controlada",
    dependsOnValue: "SI",
    exportColumnName: "Entidad de supervisión",
  },

  {
    code: "exporta_bienes_servicios",
    section: "Operaciones internacionales",
    label: "¿Exporta bienes o servicios?",
    helpText: "Responder Sí/No/No aplica.",
    fieldType: "YES_NO_NA",
    orderIndex: 27,
    hasInlineDetail: true,
    inlineDetailLabel: "Países o tipo de operación si responde Sí.",
    inlineDetailRequiredWhenValue: "SI",
    exportColumnName: "¿Exporta bienes o servicios?",
  },
  {
    code: "tiene_cuentas_compensacion",
    section: "Operaciones internacionales",
    label: "¿Tiene cuentas de compensación?",
    helpText: "Responder Sí/No/No aplica.",
    fieldType: "YES_NO_NA",
    orderIndex: 28,
    hasInlineDetail: true,
    inlineDetailLabel: "Banco / moneda si responde Sí.",
    inlineDetailRequiredWhenValue: "SI",
    exportColumnName: "¿Tiene cuentas de compensación?",
  },
  {
    code: "opera_regimenes_especiales",
    section: "Operaciones internacionales",
    label: "¿Opera bajo regímenes especiales?",
    helpText: "Zonas francas, temporales, UAP-ALTEX, tránsito, Plan Vallejo.",
    fieldType: "YES_NO_NA",
    orderIndex: 29,
    exportColumnName: "¿Opera bajo regímenes especiales?",
  },
  {
    code: "tipo_regimen_especial",
    section: "Operaciones internacionales",
    label: "Tipo de régimen especial",
    helpText:
      "Diligenciar si aplica. Zonas francas, temporales, UAP-ALTEX, tránsito, Plan Vallejo.",
    fieldType: "TEXT",
    orderIndex: 30,
    dependsOnFieldCode: "opera_regimenes_especiales",
    dependsOnValue: "SI",
    exportColumnName: "Tipo de régimen especial",
  },
  {
    code: "tiene_certificacion_oea",
    section: "Operaciones internacionales",
    label: "¿Tiene certificación OEA?",
    helpText: "Operador Económico Autorizado.",
    fieldType: "YES_NO_NA",
    orderIndex: 31,
    exportColumnName: "¿Tiene certificación OEA?",
  },
  {
    code: "tiene_certificacion_basc",
    section: "Operaciones internacionales",
    label: "¿Tiene certificación BASC?",
    helpText: "Business Alliance for Secure Commerce.",
    fieldType: "YES_NO_NA",
    orderIndex: 32,
    exportColumnName: "¿Tiene certificación BASC?",
  },

  {
    code: "tiene_junta_directiva",
    section: "Gobierno corporativo y legales",
    label: "¿Tiene junta directiva?",
    helpText: "Responder Sí/No/No aplica.",
    fieldType: "YES_NO_NA",
    orderIndex: 33,
    hasInlineDetail: true,
    inlineDetailLabel: "Periodicidad de reuniones si responde Sí.",
    inlineDetailRequiredWhenValue: "SI",
    exportColumnName: "¿Tiene junta directiva?",
  },
  {
    code: "tiene_marca_registrada",
    section: "Gobierno corporativo y legales",
    label: "¿Tiene marca registrada?",
    helpText: "Responder Sí/No/No aplica.",
    fieldType: "YES_NO_NA",
    orderIndex: 34,
    hasInlineDetail: true,
    inlineDetailLabel: "Número o nombre de la marca si responde Sí.",
    inlineDetailRequiredWhenValue: "SI",
    exportColumnName: "¿Tiene marca registrada?",
  },

  {
    code: "software_contable_erp",
    section: "Sistemas y seguros",
    label: "Software contable / ERP utilizado",
    helpText: "Ej.: SAP, Siigo, World Office, Siesa, otro.",
    fieldType: "TEXT",
    orderIndex: 35,
    exportColumnName: "Software contable / ERP utilizado",
  },
  {
    code: "otros_softwares_utilizados",
    section: "Sistemas y seguros",
    label: "Otros softwares utilizados",
    helpText: "Opcional. Nómina, inventarios, costos, CRM, etc.",
    fieldType: "LONG_TEXT",
    orderIndex: 36,
    isRequired: false,
    exportColumnName: "Otros softwares utilizados",
  },
  {
    code: "tiene_seguros_vigentes",
    section: "Sistemas y seguros",
    label: "¿Tiene seguros vigentes?",
    helpText: "Responder Sí/No/No aplica.",
    fieldType: "YES_NO_NA",
    orderIndex: 37,
    hasInlineDetail: true,
    inlineDetailLabel: "Tipos de seguros si responde Sí.",
    inlineDetailRequiredWhenValue: "SI",
    exportColumnName: "¿Tiene seguros vigentes?",
  },
  {
    code: "tipos_seguros",
    section: "Sistemas y seguros",
    label: "Tipos de seguros",
    helpText:
      "Diligenciar si aplica. Tecnología, inventarios, responsabilidad civil, vehículos, otros.",
    fieldType: "LONG_TEXT",
    orderIndex: 38,
    dependsOnFieldCode: "tiene_seguros_vigentes",
    dependsOnValue: "SI",
    exportColumnName: "Tipos de seguros",
  },
];

/**
 * Cache en memoria del proceso para evitar ejecutar los 38 upserts base en
 * cada carga de caracterización.
 *
 * Esto no sustituye migraciones ni seeds. Solo evita trabajo repetitivo en
 * runtime. En un despliegue nuevo o reinicio del proceso, se vuelve a validar.
 */
let ensureCamposBasePromise: Promise<void> | null = null;

export function getSectores() {
  return SECTORES;
}

export async function ensureCamposBase() {
  if (ensureCamposBasePromise) {
    return ensureCamposBasePromise;
  }

  ensureCamposBasePromise = ensureCamposBaseUncached().catch((error) => {
    /**
     * Si falla, se limpia la promesa para permitir reintento en la siguiente
     * solicitud. No se debe dejar el proceso bloqueado con una promesa fallida.
     */
    ensureCamposBasePromise = null;
    throw error;
  });

  return ensureCamposBasePromise;
}

async function ensureCamposBaseUncached() {
  const activeCodes = CAMPOS_BASE.map((campo) => campo.code);

  const upsertOperations = CAMPOS_BASE.map((campo) =>
    prisma.campoCaracterizacion.upsert({
      where: {
        code: campo.code,
      },
      update: {
        section: campo.section,
        label: campo.label,
        helpText: campo.helpText,
        fieldType: campo.fieldType,
        orderIndex: campo.orderIndex,
        isRequired: campo.isRequired ?? true,
        isActive: true,
        unit: campo.unit ?? null,
        exportColumnName: campo.exportColumnName,
        hasInlineDetail: campo.hasInlineDetail ?? false,
        inlineDetailLabel: campo.inlineDetailLabel ?? null,
        inlineDetailRequiredWhenValue:
          campo.inlineDetailRequiredWhenValue ?? null,
        dependsOnFieldCode: campo.dependsOnFieldCode ?? null,
        dependsOnValue: campo.dependsOnValue ?? null,
      },
      create: {
        code: campo.code,
        section: campo.section,
        label: campo.label,
        helpText: campo.helpText,
        fieldType: campo.fieldType,
        orderIndex: campo.orderIndex,
        isRequired: campo.isRequired ?? true,
        isActive: true,
        unit: campo.unit ?? null,
        exportColumnName: campo.exportColumnName,
        hasInlineDetail: campo.hasInlineDetail ?? false,
        inlineDetailLabel: campo.inlineDetailLabel ?? null,
        inlineDetailRequiredWhenValue:
          campo.inlineDetailRequiredWhenValue ?? null,
        dependsOnFieldCode: campo.dependsOnFieldCode ?? null,
        dependsOnValue: campo.dependsOnValue ?? null,
      },
    }),
  );

  await prisma.$transaction([
    ...upsertOperations,
    prisma.campoCaracterizacion.updateMany({
      where: {
        code: {
          notIn: activeCodes,
        },
      },
      data: {
        isActive: false,
      },
    }),
  ]);
}

export async function getOrCreateCaracterizacionCliente(params: {
  clienteId: string;
  empleadoId?: string;
}) {
  await ensureCamposBase();

  const empresa = await prisma.refEmpresa.findUnique({
    where: {
      id: params.clienteId,
    },
    select: {
      id: true,
      razonSocial: true,
      nit: true,
      estado: true,
    },
  });

  if (!empresa) {
    return null;
  }

  const campos = await prisma.campoCaracterizacion.findMany({
    where: {
      isActive: true,
    },
    orderBy: {
      orderIndex: "asc",
    },
    select: {
      id: true,
      code: true,
      section: true,
      label: true,
      helpText: true,
      fieldType: true,
      orderIndex: true,
      isRequired: true,
      unit: true,
      exportColumnName: true,
      hasInlineDetail: true,
      inlineDetailLabel: true,
      inlineDetailRequiredWhenValue: true,
      dependsOnFieldCode: true,
      dependsOnValue: true,
    },
  });

  const requiredCount = campos.reduce((count, campo) => {
    return campo.isRequired ? count + 1 : count;
  }, 0);

  const formulario = await prisma.formularioCliente.upsert({
    where: {
      empresaRefId: empresa.id,
    },
    update: {
      totalCount: requiredCount,
    },
    create: {
      empresaRefId: empresa.id,
      generalEmpresaId: null,
      status: "DRAFT",
      totalCount: requiredCount,
      answeredCount: 0,
      completionPercentage: 0,
      createdByEmpleadoId: params.empleadoId ?? null,
      updatedByEmpleadoId: params.empleadoId ?? null,
    },
  });

  if (campos.length > 0) {
    /**
     * Antes se hacía un upsert secuencial por cada campo.
     *
     * Eso escala mal:
     * - 38 campos = 38 queries
     * - 100 campos = 100 queries
     *
     * Con createMany + skipDuplicates:
     * - se intenta insertar el conjunto completo;
     * - la restricción única formularioId_campoId evita duplicados;
     * - los registros existentes se conservan.
     */
    await prisma.respuestaCaracterizacion.createMany({
      data: campos.map((campo) => ({
        formularioId: formulario.id,
        campoId: campo.id,
        status: "PENDING" as const,
        updatedByEmpleadoId: params.empleadoId ?? null,
      })),
      skipDuplicates: true,
    });
  }

  const formularioCompleto = await prisma.formularioCliente.findUnique({
    where: {
      id: formulario.id,
    },
    select: {
      id: true,
      empresaRefId: true,
      generalEmpresaId: true,
      status: true,
      answeredCount: true,
      totalCount: true,
      completionPercentage: true,
      createdByEmpleadoId: true,
      updatedByEmpleadoId: true,
      confirmedAt: true,
      hasPostConfirmationChanges: true,
      createdAt: true,
      updatedAt: true,
      respuestas: {
        where: {
          campo: {
            isActive: true,
          },
        },
        select: {
          id: true,
          formularioId: true,
          campoId: true,
          valueText: true,
          valueNumber: true,
          valueDate: true,
          valueJson: true,
          status: true,
          updatedByEmpleadoId: true,
          createdAt: true,
          updatedAt: true,
          campo: {
            select: {
              id: true,
              code: true,
              section: true,
              label: true,
              helpText: true,
              fieldType: true,
              orderIndex: true,
              isRequired: true,
              unit: true,
              exportColumnName: true,
              hasInlineDetail: true,
              inlineDetailLabel: true,
              inlineDetailRequiredWhenValue: true,
              dependsOnFieldCode: true,
              dependsOnValue: true,
            },
          },
        },
        orderBy: {
          campo: {
            orderIndex: "asc",
          },
        },
      },
    },
  });

  return {
    empresa,
    formulario: formularioCompleto,
    sectores: SECTORES,
  };
}

export async function getClientesConAvanceParaEmpleado(empleadoId: string) {
  return prisma.refEmpresa.findMany({
    where: {
      asignaciones: {
        some: {
          empleadoRefId: empleadoId,
          activo: true,
        },
      },
    },
    orderBy: {
      razonSocial: "asc",
    },
    select: {
      id: true,
      generalEmpresaId: true,
      razonSocial: true,
      nit: true,
      digitoVerificacion: true,
      estado: true,
      radicadoCode: true,
      formularios: {
        select: {
          id: true,
          status: true,
          answeredCount: true,
          totalCount: true,
          completionPercentage: true,
          confirmedAt: true,
          hasPostConfirmationChanges: true,
        },
        take: 1,
      },
    },
  });
}

export async function getClienteConAvanceParaEmpleado(params: {
  clienteId: string;
  empleadoId: string;
}) {
  return prisma.refEmpresa.findFirst({
    where: {
      id: params.clienteId,
      asignaciones: {
        some: {
          empleadoRefId: params.empleadoId,
          activo: true,
        },
      },
    },
    select: {
      id: true,
      generalEmpresaId: true,
      razonSocial: true,
      nit: true,
      digitoVerificacion: true,
      estado: true,
      radicadoCode: true,
      formularios: {
        select: {
          id: true,
          status: true,
          answeredCount: true,
          totalCount: true,
          completionPercentage: true,
          confirmedAt: true,
          hasPostConfirmationChanges: true,
        },
        take: 1,
      },
    },
  });
}
