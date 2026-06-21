import type { RawRequestTemplate } from "./request-types";

export const rawRequestTypes = [
  {
    id: "aspectos-legales",
    name: "Solicitud de información - Aspectos legales",
    prefix: "RFA",
    templateFile: "aspectos-legales.docx",
    defaultCutoffDate: "2025-12-31",
    subject: "Solicitud Información Auditoria de Aspectos Legales",
    introParagraphs: [
      "De acuerdo con nuestro plan de trabajo, iniciaremos con la evaluación de control en lo relacionado con los aspectos legales de la compañía.",
      "Por lo anterior, a continuación, relacionamos la información a evaluar.",
      "Es importante mencionar que la información solicitada no necesariamente constituye la totalidad de la que sería requerida para efectos de desarrollar nuestro trabajo; por tal razón, de llegar a ser necesaria alguna información adicional, será solicitada.",
      "Si estima que algunos de los puntos se deben tratar en una reunión, estamos a su disposición para agendar un encuentro y tratar los temas.",
      "Cualquier aclaración y/o información adicional que usted requiera con gusto le será suministrada. Agradecemos de antemano su colaboración respecto de la preparación y suministro de la información solicitada, lo cual redundará en el beneficio de ambas partes.",
    ],
    closingParagraphs: [],
    categories: [
      {
        id: "documentos-legales",
        title: "I. Documentos Legales",
        items: [
          {
            id: "estatutos-vigentes",
            text: "Estatutos vigentes de la compañía.",
            selected: true,
          },
          {
            id: "libros-oficiales",
            text: "Libros oficiales al 31 de diciembre de 2024.",
            selected: true,
          },
          {
            id: "libro-accionistas",
            text: "Libro de registro de accionistas actualizado.",
            selected: true,
          },
          {
            id: "rub",
            text: "Registro de los beneficiarios finales (RUB) de acuerdo con la Resolución 000164 del 27 de diciembre de 2021, última actualización.",
            selected: true,
          },
          {
            id: "actas-asamblea-junta",
            text: "Actas de asamblea y junta directiva del año 2025.",
            selected: true,
          },
          {
            id: "actas-copasst",
            text: "Actas de las reuniones COPASST del 2024 y lo corrido de 2025, si aplica.",
            selected: false,
          },
          {
            id: "actas-comite-convivencia",
            text: "Actas de las reuniones Comité de Convivencia laboral del 2024 y lo corrido de 2025.",
            selected: false,
          },
        ],
      },
      {
        id: "documentos-control",
        title: "II. Documentos de Control",
        items: [
          {
            id: "camara-rut",
            text: "Cámara de comercio y RUT actualizados a 2025.",
            selected: true,
          },
          {
            id: "resolucion-facturacion",
            text: "Resolución de facturación y documento soporte. Si existen varias resoluciones, compartir cada una de ellas.",
            selected: true,
          },
          {
            id: "resolucion-contingencia",
            text: "Resolución de facturación por contingencia, si aplica.",
            selected: false,
          },
          {
            id: "documento-equivalente-factura",
            text: "Un documento equivalente y una factura por tipo de documento. Una factura de contado y una factura a crédito, las últimas generadas en 2024.",
            selected: true,
          },
          {
            id: "reporte-facturacion-dian",
            text: "Reporte de facturación electrónica de enero a marzo de 2025 generado en la página de la DIAN.",
            selected: true,
          },
          {
            id: "reporte-facturacion-software",
            text: "Reporte de facturación generado desde el software contable de enero a marzo del 2025.",
            selected: true,
          },
          {
            id: "sagrilaft",
            text: "Reportes de actividades sospechosas ROS, diseño y aprobación del sistema de SAGRILAFT, soportes de divulgación del SAGRILAFT, capacitación y debida diligencia.",
            selected: false,
          },
          {
            id: "contrato-temporales",
            text: "Contrato con empresas temporales, si aplica.",
            selected: false,
          },
          {
            id: "proteccion-datos",
            text: "Políticas de la compañía respecto a la protección de las bases de datos e información personal y soporte de actualización del Registro Nacional de Bases de Datos de 2024.",
            selected: true,
          },
          {
            id: "registro-sanitario",
            text: "Registro sanitario, si aplica.",
            selected: false,
          },
          {
            id: "presupuesto",
            text: "Presupuesto diseñado para el periodo 2025.",
            selected: true,
          },
          {
            id: "vehiculos",
            text: "Detalle de los vehículos que posee la compañía, matrícula, SOAT de los vehículos y seguros adicionales con los que cuente la compañía.",
            selected: false,
          },
        ],
      },
      {
        id: "documentos-laborales",
        title: "III. Documentos Laborales",
        items: [
          {
            id: "cuota-aprendices",
            text: "Reporte actualización cuota aprendices, incluyendo el listado de aprendices vinculados a la fecha. En caso de estar obligados, suministrar adicionalmente la resolución del segundo semestre de 2024 y el primero del 2025.",
            selected: false,
          },
          {
            id: "personal-extranjero",
            text: "En caso de tener contrato con personal extranjero, proporcionar reporte al RUTEC y SIRE. Listado de personal donde se indique nombre, tipo de documento, número de documento y nacionalidad.",
            selected: false,
          },
          {
            id: "seguridad-social",
            text: "Pagos de seguridad social de cada mes de lo corrido del 2025, detallado y resumido. En el soporte compartido se debe detallar la fecha de pago.",
            selected: true,
          },
          {
            id: "empleados-activos",
            text: "Listado de empleados activos, con detalle de salario, fecha de ingreso y cargo a 31 de diciembre de 2024.",
            selected: true,
          },
          {
            id: "nomina-electronica",
            text: "Documento soporte de nómina electrónica de cada mes del año 2024 y de lo transcurrido de 2025. Puede ser el soporte de transmisión o reporte de la DIAN.",
            selected: true,
          },
          {
            id: "sst",
            text: "Política de seguridad y salud en el trabajo, plan de trabajo anual en seguridad y salud en el trabajo - SST y soporte de capacitaciones.",
            selected: true,
          },
          {
            id: "ugpp",
            text: "Detalle de procesos abiertos con la UGPP y su estado, si aplica.",
            selected: false,
          },
          {
            id: "horas-extras",
            text: "Resolución de autorización de horas extras vigente. Si la compañía tiene reconocido gasto por horas extras, debe contar con la resolución.",
            selected: false,
          },
          {
            id: "reglamento-trabajo",
            text: "Reglamento interno de trabajo actualizado.",
            selected: true,
          },
        ],
      },
      {
        id: "documentos-tributarios",
        title: "IV. Documentos Tributarios",
        items: [
          {
            id: "cuentas-compensacion",
            text: "Detalle de las cuentas en compensación poseídas a 31 de marzo de 2025, si aplica.",
            selected: false,
          },
          {
            id: "estado-cuenta-dian",
            text: "Informe del estado de cuenta de la DIAN, pantallazo de la plataforma de la DIAN.",
            selected: true,
          },
          {
            id: "certificados-retencion",
            text: "Un ejemplo de certificado de retención emitido tanto para empleados como para externos correspondiente a certificados de retenciones 2024.",
            selected: true,
          },
          {
            id: "supersociedades",
            text: "Último reporte a SuperSociedades.",
            selected: true,
          },
          {
            id: "perdidas-fiscales",
            text: "Detalle de las pérdidas fiscales y compensaciones a la fecha.",
            selected: false,
          },
          {
            id: "ica",
            text: "Soporte de presentación y pago de declaraciones de industria y comercio anuales de 2024. Relación de los municipios donde la compañía presenta ICA detallando si es agente retenedor, si es agente autorretenedor, periodicidad y forma de presentación.",
            selected: true,
          },
          {
            id: "dividendos",
            text: "Cálculo de dividendos gravados y no gravados con sus respectivos anexos, distribuidos en 2024 y 2025 si aplica.",
            selected: false,
          },
          {
            id: "exceso-utilidades",
            text: "Detalle de exceso de utilidades gravadas, si aplica.",
            selected: false,
          },
        ],
      },
    ],
  },
  {
    id: "tesoreria",
    name: "Solicitud de información - Tesorería",
    prefix: "RFA",
    templateFile: "tesoreria.docx",
    defaultCutoffDate: "2025-05-31",
    subject: "Solicitud Tesorería",
    introParagraphs: [
      "De acuerdo con nuestro plan de trabajo para el año 2025, continuaremos con la evaluación del control interno, en lo correspondiente al seguimiento al proceso de Tesorería.",
      "Por lo anterior, a continuación, relacionamos la información a evaluar.",
      "Es importante mencionar que la información solicitada no necesariamente constituye la totalidad de la que sería requerida para efectos de desarrollar nuestro trabajo; por tal razón, de llegar a ser necesaria alguna información adicional, será solicitada.",
      "Cualquier aclaración y/o información adicional que usted requiera con gusto le será suministrada.",
      "Agradecemos de antemano su colaboración respecto de la preparación y suministro de la información solicitada, lo cual redundará en el beneficio de ambas partes.",
    ],
    closingParagraphs: [],
    categories: [
      {
        id: "control-manejo-recursos",
        title: "Control Manejo Recursos",
        items: [
          {
            id: "politicas-efectivo",
            text: "Políticas para el manejo y traslados del efectivo y equivalentes de efectivo.",
            selected: true,
          },
          {
            id: "procedimientos-tesoreria",
            text: "Política y procedimientos del área de tesorería.",
            selected: true,
          },
          {
            id: "caja-menor",
            text: "Política y procedimientos para el manejo de caja menor.",
            selected: true,
          },
          {
            id: "inscripcion-proveedores",
            text: "Política y procedimiento para la inscripción de proveedores.",
            selected: true,
          },
          {
            id: "personal-autorizado",
            text: "Personal autorizado para realizar los movimientos entre bancos y su perfil, incluyendo cargo que desempeña.",
            selected: true,
          },
        ],
      },
      {
        id: "reportes-soportes-movimientos",
        title: "Reportes y Soportes de Movimientos",
        items: [
          {
            id: "extractos-bancarios",
            text: "Extractos bancarios en PDF de enero a mayo de 2025 de cuentas bancarias, obligaciones financieras, tarjetas de crédito e inversiones.",
            selected: true,
          },
          {
            id: "cuadre-caja-menor",
            text: "Último cuadre de caja menor del mes de mayo.",
            selected: true,
          },
          {
            id: "soportes-caja-menor",
            text: "Soportes de compras realizadas a través de caja menor del mes de mayo.",
            selected: true,
          },

          {
            id: "consecutivos-egresos",
            text: "Consecutivos de egresos de enero a julio de 2025 indicando:",
            selected: true,
            children: [
              "N° documento",
              "Fecha",
              "Tercero - identificación",
              "Valor",
              "Medio pago",
              "Cuenta donde se realiza el pago",
            ],
          },


          {
            id: "conciliaciones",
            text: "Conciliaciones realizadas en el año de:",
            selected: true,
            children: [
              "Bancos",
              "Obligaciones financieras o tarjetas de crédito",
            ],
          },
          {
            id: "auxiliar-cxp",
            text: "Auxiliar que contenga el detalle de las cuentas por pagar a proveedores a 30 de mayo de 2025, incluyendo tercero, fecha de vencimiento y documento relacionado.",
            selected: true,
          },
          {
            id: "auxiliar-cxc",
            text: "Auxiliar que contenga el detalle de las cuentas por cobrar a clientes a 30 de mayo de 2025, incluyendo tercero, fecha de vencimiento y documento relacionado.",
            selected: true,
          },
          {
            id: "balance-general",
            text: "Balance general por cuenta y por tercero a 31 de mayo de 2025.",
            selected: true,
          },
          {
            id: "auxiliar-movimiento",
            text: "Auxiliar de movimiento de enero a mayo de 2025.",
            selected: true,
          },
        ],
      },
    ],
  },
  {
    id: "propiedad-planta-equipo",
    name: "Solicitud de información - Propiedad, planta y equipo",
    prefix: "RFA",
    templateFile: "propiedad-planta-equipo.docx",
    defaultCutoffDate: "2025-07-31",
    subject: "Solicitud de información Propiedad, planta y equipo",
    introParagraphs: [
      "De acuerdo con nuestro plan de trabajo para el año 2025, continuaremos con la evaluación de control interno en lo relacionado con el manejo de la Propiedad, planta y equipo de la empresa.",
      "Es importante mencionar que la información solicitada no necesariamente constituye la totalidad de la que sería requerida para efectos de desarrollar nuestro trabajo; por tal razón, de llegar a ser necesaria alguna información adicional, será solicitada.",
      "Cualquier aclaración y/o información adicional que usted requiera con gusto le será suministrada.",
      "Agradecemos de antemano su colaboración respecto de la preparación y suministro de la información solicitada, lo cual redundará en el beneficio de ambas partes.",
    ],
    closingParagraphs: [],
    categories: [
      {
        id: "informacion-ppe",
        title: "Información de la Propiedad, Planta y Equipo",
        items: [
          {
            id: "certificados-escrituras",
            text: "Certificados y escrituras de las propiedades e inmuebles.",
            selected: true,
          },
          {
            id: "escrituras-costo-adquisicion",
            text: "Escrituras o soporte del costo de adquisición de las edificaciones registradas en la cuenta contable 17.",
            selected: true,
          },
          {
            id: "impuestos-prediales",
            text: "Pagos de los impuestos prediales por el año 2024 y lo corrido del año 2025.",
            selected: true,
          },
          {
            id: "avaluo-ppe",
            text: "Informe del último avalúo realizado a la propiedad, planta y equipo y los fideicomisos registrados en la cuenta contable 16.",
            selected: true,
          },
          {
            id: "polizas-activos",
            text: "Pólizas todo riesgo asociadas a los activos.",
            selected: true,
          },
          {
            id: "compras-adiciones-mejoras",
            text: "Detalle de las compras, adiciones y mejoras a los activos realizados en lo corrido del año 2025.",
            selected: true,
          },
          {
            id: "reporte-modulo-activos",
            text: "Reporte del módulo de activos al 31 de julio de 2025, donde se detalle tipo de activo, fecha de adquisición, vida útil, costo de adquisición, depreciación del periodo y depreciación acumulada.",
            selected: true,
          },
        ],
      },
    ],
  },
  {
    id: "auditoria-financiera-precierre",
    name: "Solicitud de información - Auditoría financiera pre-cierre",
    prefix: "RFA",
    templateFile: "auditoria-financiera-precierre.docx",
    defaultCutoffDate: "2025-09-30",
    subject: "Requerimiento de Información, Auditoría financiera pre-cierre con corte a",
    introParagraphs: [
      "El propósito de una auditoría es incrementar el grado de confianza de los usuarios en los estados financieros. Esto se logra con la expresión de una opinión por el auditor sobre si los estados financieros están elaborados, y están presentados, razonablemente, respecto de todo lo importante, o dan un punto de vista verdadero y razonable, de acuerdo con el marco de referencia de información financiera aplicable.",
      "Nuestra auditoría es conducida de acuerdo con las Normas Internacionales de Auditoría NIA y los requisitos éticos relevantes, que posibilita al auditor a formarse esa opinión.",
      "Los estados financieros sujetos a auditoría son elaborados por la administración de la entidad con supervisión de los encargados del gobierno corporativo. Es importante anotar que la auditoría de los estados financieros no releva a la administración o a los encargados del gobierno corporativo de sus responsabilidades.",
      "Esta auditoría tiene como objetivo el examen de las cifras contables al corte indicado en el asunto, con el fin de evaluar la razonabilidad de las cifras y detectar de forma anticipada posibles errores en la información financiera.",
      "De acuerdo con la importancia de este análisis es indispensable que se suministre la información requerida, que a continuación se detalla:",
    ],
    closingParagraphs: [
      "Por último, agradecemos incluir la información que haya quedado pendiente por solicitar en el presente documento, y que sea pertinente para la correcta depuración de la provisión de renta.",
      "Por favor para aquella información que no aplique a la compañía, nos lo hacen saber. El éxito de nuestra auditoría dependerá de la información suministrada y la calidad de ella, por lo tanto, agradecemos nos informen si tienen alguna inquietud con lo solicitado.",
      "A fin de evaluar el inicio de la auditoría, es importante que nos vayan enviando la información, la cual será analizada por el/la encargad@ asignado a la compañía, con copia al equipo de trabajo.",
      "Quedamos atentos a cualquier inquietud o sugerencia.",
    ],
    categories: [
      {
        id: "informacion-general",
        title: "Información General",
        items: [
          {
            id: "politicas-niif",
            text: "Políticas contables NIIF actualizadas. En caso de que hayan cambiado con respecto a las entregadas a la revisoría en el 2024.",
            selected: true,
          },
          {
            id: "balance-prueba",
            text: "Balance de prueba en Excel por cuenta y por tercero mes a mes, de enero a septiembre de 2025.",
            selected: true,
          },
          {
            id: "rut",
            text: "RUT actualizado.",
            selected: true,
          },
          {
            id: "camara-comercio",
            text: "Certificado de Cámara de comercio actualizada.",
            selected: true,
          },
          {
            id: "reformas-estatutarias",
            text: "Reformas estatutarias realizadas, en caso de haberlas.",
            selected: false,
          },
          {
            id: "actas",
            text: "Actas de Junta Directiva y de Asamblea emitidas en el año 2025.",
            selected: true,
          },
          {
            id: "datos-entidades-financieras",
            text: "Datos de las entidades financieras, donde se detalle nombre de la entidad, persona de contacto, teléfono y correo electrónico. Es importante que la información esté actualizada para evitar enviar cartas de confirmación a asesores que ya no están relacionados con la entidad bancaria.",
            selected: true,
          },
          {
            id: "estado-dian",
            text: "Estado de cuenta emitido por la DIAN.",
            selected: true,
          },
          {
            id: "correspondencia-control",
            text: "Correspondencia enviada y recibida de entidades de control y vigilancia, DIAN, Superintendencia de Sociedades, Secretaría de Hacienda, entre otras, de enero a septiembre de 2025.",
            selected: false,
          },
          {
            id: "relacion-abogados",
            text: "Relación de los abogados actuales, con datos de contacto tales como persona de contacto, correo electrónico, dirección, teléfono y fax.",
            selected: false,
          },
          {
            id: "procesos-legales",
            text: "Detalle de los procesos legales o reclamaciones a favor o en contra de la compañía y los últimos informes recibidos de los abogados que manejan dichos procesos, así como la relación de los datos de contacto de todos los abogados.",
            selected: false,
          },
          {
            id: "informe-abogados",
            text: "Último informe de los abogados sobre el estado de los procesos jurídicos de la compañía, en contra y a favor.",
            selected: false,
          },
          {
            id: "contenedor-dian",
            text: "Contenedor de la DIAN de enero a septiembre de 2025.",
            selected: true,
          },
        ],
      },
      {
        id: "efectivo-equivalentes",
        title: "Efectivo y Equivalentes de Efectivo",
        items: [
          {
            id: "conciliaciones-bancarias",
            text: "Conciliaciones bancarias al 30 de septiembre de 2025.",
            selected: true,
          },
          {
            id: "partidas-conciliatorias",
            text: "Detalle de las partidas conciliatorias al 30 de septiembre en formato Excel.",
            selected: true,
          },
          {
            id: "extractos",
            text: "Extractos bancarios y de los rendimientos para las inversiones al 30 de septiembre de 2025.",
            selected: true,
          },
        ],
      },
      {
        id: "cuentas-cobrar",
        title: "Cuentas Comerciales por Cobrar",
        items: [
          {
            id: "cartera-edades",
            text: "Detalle de la cartera por edades en rangos 0-30, 31-60, 61-90 y 90+.",
            selected: true,
          },
          {
            id: "seguimiento-cartera",
            text: "Indicar el seguimiento realizado a la cartera con vencimiento mayor a 360 días, en formato Excel, incluyendo tercero, documento, fecha de documento, vencimiento, valor en moneda origen y valor en pesos.",
            selected: true,
          },
          {
            id: "castigo-deterioro-cartera",
            text: "Si durante el año se realizó castigo o deterioro de cartera, adjuntar informe del abogado en PDF y mediciones tenidas en cuenta para el reconocimiento del deterioro en Excel al 30 de septiembre de 2025.",
            selected: false,
          },
          {
            id: "cartera-castigada",
            text: "Detalle de la cartera castigada durante el periodo al 30 de septiembre de 2025 y soportes de aprobación.",
            selected: false,
          },
        ],
      },
      {
        id: "otras-cuentas-cobrar",
        title: "Otras Cuentas por Cobrar",
        items: [
          {
            id: "anticipos-1330",
            text: "Reporte de los anticipos 1330 registrados al 30 de septiembre de 2025.",
            selected: true,
          },
          {
            id: "edades-anticipos",
            text: "Informe de edades de los anticipos al 30 de septiembre, 30, 60, 90, 180 y 360 días, por tercero.",
            selected: true,
          },
          {
            id: "ingresos-cobrar-1345",
            text: "Detalle de los ingresos por cobrar registrados en la cuenta 1345 al 30 de septiembre de 2025.",
            selected: true,
          },
        ],
      },
      {
        id: "ppe",
        title: "Propiedad, Planta y Equipo",
        items: [
          {
            id: "conciliacion-kardex",
            text: "Conciliación del kardex de activos fijos con contabilidad al 30 de septiembre de 2025, en formato Excel.",
            selected: true,
          },
          {
            id: "compras-retiros",
            text: "Reporte con las compras y retiros realizados durante el año, en formato Excel. Este detalle debe cruzar con el movimiento de activos fijos: saldo inicial a 1 de enero de 2025 + altas - bajas = saldo a 30 de septiembre de 2025.",
            selected: true,
          },
          {
            id: "facturas-compra-venta",
            text: "Facturas de compra y venta de activos fijos.",
            selected: true,
          },
          {
            id: "depreciacion-periodo",
            text: "Reporte de la depreciación generada durante el año por activo de enero a septiembre de 2025, en formato Excel.",
            selected: true,
          },
          {
            id: "costo-fecha-activacion",
            text: "Reporte con el costo del activo, la fecha de compra y fecha de activación, en formato Excel.",
            selected: true,
          },
          {
            id: "depreciacion-acumulada",
            text: "Reporte con la depreciación acumulada por activo, en formato Excel.",
            selected: true,
          },
          {
            id: "avaluos",
            text: "Informe técnico de avalúos 2025, si se realizaron.",
            selected: false,
          },
          {
            id: "registro-avaluo",
            text: "Reporte del registro en el sistema del avalúo por activo, en formato Excel.",
            selected: false,
          },
          {
            id: "activos-construccion",
            text: "Informe detallado de activos en construcción.",
            selected: false,
          },
        ],
      },
      {
        id: "pasivos-financieros",
        title: "Pasivos Financieros",
        items: [
          {
            id: "conciliacion-tarjetas",
            text: "Conciliación de tarjetas de crédito versus contabilidad al 30 de septiembre de 2025.",
            selected: true,
          },
          {
            id: "extracto-deuda",
            text: "Extracto con el saldo de la deuda a la fecha de corte auditado, incluidas las tarjetas de crédito.",
            selected: true,
          },
        ],
      },
      {
        id: "cuentas-pagar",
        title: "Cuentas Comerciales por Pagar",
        items: [
          {
            id: "cuentas-pagar-edades",
            text: "Detalle de cuentas por pagar por edades en rangos 0-90, 91-180, 181-360 y 361+, indicando el motivo de no pago de las obligaciones con vencimiento mayor a 360 días. Incluir tercero, documento, fecha de documento, vencimiento, valor en moneda origen y valor en pesos.",
            selected: true,
          },
          {
            id: "deudas-accionistas",
            text: "Detalles de deudas con accionistas al corte auditado, en formato Excel.",
            selected: false,
          },
          {
            id: "anticipos-avances-2805",
            text: "Detalles de las cuentas por pagar registradas en la cuenta 2805 anticipos y avances al corte auditado, en formato Excel.",
            selected: true,
          },
          {
            id: "ingresos-terceros-2815",
            text: "Detalles de las cuentas por pagar registradas en la cuenta 2815 ingresos recibidos para terceros contratos de mandato al corte auditado, en formato Excel.",
            selected: true,
          },
        ],
      },
      {
        id: "nomina",
        title: "Nómina",
        items: [
          {
            id: "empleados-activos-retirados",
            text: "Reporte de empleados activos y retirados al corte auditado, con identificación, nombre del empleado, salario, tipo de contrato, fecha de inicio, fecha de retiro si aplica y cargo.",
            selected: true,
          },
          {
            id: "planillas-seguridad-social",
            text: "Planillas de pago detalladas por empleado de la seguridad social, de enero a septiembre de 2025, en formato Excel.",
            selected: true,
          },
          {
            id: "prestaciones-sociales",
            text: "Cálculo por empleado de las prestaciones sociales, en formato Excel.",
            selected: true,
          },
          {
            id: "libro-vacaciones",
            text: "Libro de vacaciones por empleado al corte auditado, en formato Excel.",
            selected: true,
          },
          {
            id: "salario-promedio",
            text: "Informe por empleado al 30 de septiembre de 2025 de salario promedio, incluyendo todos los pagos que hacen base de salario.",
            selected: true,
          },
          {
            id: "pagos-extralegales",
            text: "Políticas de reconocimiento de pagos extralegales y reporte por empleado del valor reconocido, en formato Excel.",
            selected: false,
          },
          {
            id: "informe-sena",
            text: "Informe al SENA, actualización semestral del número de empleados, en formato PDF.",
            selected: false,
          },
        ],
      },
      {
        id: "patrimonio",
        title: "Patrimonio",
        items: [
          {
            id: "movimiento-patrimonio",
            text: "Informe detallado de movimiento de la cuenta de patrimonio entre enero y septiembre de 2025.",
            selected: true,
          },
          {
            id: "capitalizacion",
            text: "Si hubo capitalización, adjuntar el soporte origen de dicha transacción.",
            selected: false,
          },
          {
            id: "distribucion-utilidades",
            text: "Detalle de distribución de utilidades realizada.",
            selected: false,
          },
        ],
      },
      {
        id: "ingresos",
        title: "Ingresos",
        items: [
          {
            id: "conciliacion-ingresos",
            text: "Conciliación de ingresos con el módulo de facturación acumulado a septiembre de 2025 versus el contenedor de la DIAN.",
            selected: true,
          },
          {
            id: "devoluciones",
            text: "Reporte de las devoluciones acumuladas de enero a septiembre de 2025, por tercero, concepto y valor.",
            selected: true,
          },
          {
            id: "notas-credito",
            text: "Informe de notas crédito emitidas en el año 2025.",
            selected: true,
          },
          {
            id: "informe-facturacion",
            text: "Informe de facturación en Excel que contenga número de factura, fecha de factura, cliente, referencia, código y descripción vendida, cantidad por referencia, precio unitario, IVA y total de venta.",
            selected: true,
          },
          {
            id: "contratos-arrendamiento",
            text: "Detalle de los contratos de arrendamiento donde se logre detallar tercero, canon de arrendamiento y porcentaje de aumento anual.",
            selected: false,
          },
          {
            id: "certificado-fideicomiso",
            text: "Certificado de los ingresos reconocidos por el fideicomiso con el tercero Alianza Fiduciaria.",
            selected: false,
          },
        ],
      },
      {
        id: "gastos",
        title: "Gastos",
        items: [
          {
            id: "auxiliar-cuenta-5",
            text: "Auxiliar detallado por documento de la cuenta 5 acumulado de enero a septiembre de 2025, en formato Excel.",
            selected: true,
          },
          {
            id: "conciliacion-compras",
            text: "Conciliación de compras del año 2025 versus el contenedor de la DIAN.",
            selected: true,
          },
        ],
      },
      {
        id: "asientos-diarios",
        title: "Asientos Diarios",
        items: [
          {
            id: "journal-entries",
            text: "Archivo en Excel de los registros contables Journal Entries correspondientes al periodo comprendido entre el 1 de enero y el 30 de septiembre de 2025, incluyendo el mayor número posible de campos: código, nombre, descripción, fecha_contab, fecha afectación, journal, usuario_crea, usuario_contab, valor, naturaleza y forma de ingreso.",
            selected: true,
          },
        ],
      },
      {
        id: "otros-conceptos",
        title: "Otros Conceptos",
        items: [
          {
            id: "provision-renta",
            text: "Provisión del impuesto de renta, en formato Excel. Ver solicitud de información adicional para este punto.",
            selected: true,
          },
          {
            id: "impuesto-diferido",
            text: "Cálculo del impuesto diferido al corte auditado, si aplica, en formato Excel.",
            selected: false,
          },
          {
            id: "provision-ica",
            text: "Provisión del impuesto de Industria y Comercio, en formato Excel.",
            selected: true,
          },
        ],
      },
      {
        id: "provision-renta",
        title: "Solicitud de Información para la Provisión de la Renta",
        items: [
          {
            id: "renta-2024",
            text: "Declaración de renta presentada y recibo de pago correspondiente al año gravable 2024.",
            selected: true,
          },
          {
            id: "diferencia-cambio",
            text: "Anexo donde se verifica la diferencia en cambio efectivamente realizada durante el 2025, evidenciando número de factura, fecha de emisión y fecha de realización del ingreso.",
            selected: true,
          },
          {
            id: "activos-fijos-fiscal-niif",
            text: "Anexo de activos fijos fiscal y NIIF, con saldo inicial, depreciación del año, compras y ventas. Este anexo debe justificar el ajuste por depreciación fiscal a tomar en renta y comparar lo contable y lo fiscal. Indispensable suministrar esta información.",
            selected: true,
          },
          {
            id: "leasing",
            text: "Si la compañía maneja leasing, suministrar tabla de amortización.",
            selected: false,
          },
          {
            id: "seguridad-social-exogena",
            text: "Reporte en Excel de los pagos consolidados de enero a septiembre de seguridad social extraído de la plataforma de pago, evidenciando aporte del empleado y aporte del empleador.",
            selected: true,
          },
          {
            id: "donaciones",
            text: "Certificado de donaciones que se vayan a tener en cuenta como descuento en la declaración.",
            selected: false,
          },
          {
            id: "prestamos-vinculados",
            text: "Anexo de préstamos de vinculados económicos en lo que va del año.",
            selected: false,
          },
          {
            id: "pagos-efectivo",
            text: "Relación de pagos realizados en efectivo para determinar el límite de deducción de costos y gastos por bancarización aplicable para 2025 y relación de pagos no soportados con facturación electrónica. Indispensable suministrar esta información.",
            selected: true,
          },
          {
            id: "descuentos-tributarios",
            text: "Detalle de los descuentos tributarios a aplicar y su respectivo soporte.",
            selected: false,
          },
          {
            id: "interes-presuntivo",
            text: "Movimiento mensual de las cuentas por cobrar a socios o accionistas y cálculo del interés presuntivo.",
            selected: false,
          },
          {
            id: "provision-cartera-fiscal",
            text: "Cálculo provisión cartera fiscal y envío de cartera por edades desde el módulo de cartera.",
            selected: true,
          },
          {
            id: "ica-pagado",
            text: "Anexo con el detalle y recibos de industria y comercio efectivamente pagados durante el 2025 que no se hayan tomado en la declaración de renta del año gravable anterior.",
            selected: true,
          },
          {
            id: "compras-exterior",
            text: "Relación de compras realizadas en el exterior a las que no se les haya practicado retención en la fuente. Informar si no hacen compras en el exterior.",
            selected: false,
          },
          {
            id: "compra-activos-productivos",
            text: "Relación de compra de activos fijos directamente relacionados con la producción o prestación del servicio, activos reales productivos.",
            selected: false,
          },
          {
            id: "venta-activos",
            text: "Relación de venta de activos fijos donde se evidencie fecha de adquisición, costo de adquisición, depreciación acumulada, fecha de venta y valor de venta. Adjuntar facturas de venta.",
            selected: false,
          },
          {
            id: "empleados-discapacidad",
            text: "Verificación y listado de empleados contratados que tengan un grado de discapacidad superior al 25% comprobada.",
            selected: false,
          },
          {
            id: "empleados-menores-28",
            text: "Verificación y listado de empleados contratados menores de 28 años que sea su primer empleo y cumplan los requisitos legales para reconocer el beneficio.",
            selected: false,
          },
          {
            id: "escudos-fiscales",
            text: "Relaciones de escudos fiscales, en caso de tener o haber tenido pérdidas fiscales en otros periodos.",
            selected: false,
          },
          {
            id: "conciliacion-impuestos",
            text: "Anexo de conciliación de impuestos IVA, retención, ICA y autorretención ICA.",
            selected: true,
          },
          {
            id: "gastos-no-deducibles",
            text: "Anexo de análisis y depuración de gastos no deducibles al 30 de septiembre de 2025.",
            selected: true,
          },
          {
            id: "contratos-colaboracion",
            text: "Copia de contratos de colaboración, mandato, cuentas en participación, consorcios, entre otros.",
            selected: false,
          },
          {
            id: "beneficios-fiscales",
            text: "Certificados de beneficios fiscales aplicados, Ley 1715, inversiones en ciencia y tecnología, exenciones, entre otros.",
            selected: false,
          },
          {
            id: "deducciones-especiales",
            text: "Documentación de deducciones especiales, como vehículos híbridos.",
            selected: false,
          },
          {
            id: "acciones",
            text: "Certificado de las acciones poseídas a 31 de septiembre de 2025, donde indique número de acciones, porcentaje de participación, costo histórico, valor razonable o método patrimonial.",
            selected: false,
          },
          {
            id: "conciliacion-ingresos-dian",
            text: "Conciliación de los ingresos reportados a la DIAN mediante facturación electrónica versus ingresos fiscales y NIIF, incluyendo el reporte original.",
            selected: true,
          },
          {
            id: "papel-trabajo-provision",
            text: "Enviar papel de trabajo de provisión de renta de la compañía.",
            selected: true,
          },
        ],
      },
    ],
  },
  {
    id: "auditoria-financiera-cierre",
    name: "Solicitud de información - Auditoría financiera cierre",
    prefix: "RFA",
    templateFile: "auditoria-financiera-cierre.docx",
    defaultCutoffDate: "2025-12-31",
    subject: "Requerimiento de Información, Auditoría financiera Cierre con corte a",
    introParagraphs: [
      "El propósito de una auditoría es incrementar el grado de confianza de los usuarios en los estados financieros. Esto se logra con la expresión de una opinión por el auditor sobre si los estados financieros están elaborados, y están presentados, razonablemente, respecto de todo lo importante, o dan un punto de vista verdadero y razonable, de acuerdo con el marco de referencia de información financiera aplicable.",
      "Nuestra auditoría es conducida de acuerdo con las Normas internacionales de Auditoría NIA y los requisitos éticos relevantes, que posibilita al auditor a formarse esa opinión.",
      "Los estados financieros sujetos a auditoría son elaborados por la administración de la entidad con supervisión de los encargados del gobierno corporativo. Es importante anotar que la auditoría de los estados financieros no releva a la administración o a los encargados del gobierno corporativo de sus responsabilidades.",
      "Esta auditoría tiene como objetivo el examen de las cifras contables al corte indicado en el asunto, con el fin de evaluar la razonabilidad de las cifras y detectar de forma anticipada posibles errores en la información financiera, antes de emitir la opinión sobre los EEFF.",
      "De acuerdo con la importancia de este análisis es indispensable que se suministre la información requerida, que a continuación se detalla:",
    ],
    closingParagraphs: [
      "Por último, agradecemos incluir la información que haya quedado pendiente por solicitar en el presente documento, y que sea pertinente para la correcta depuración de la provisión de renta.",
      "Por favor para aquella información que no aplique a la compañía, nos lo hacen saber. El éxito de nuestra auditoría dependerá de la información suministrada y la calidad de ella, por lo tanto, agradecemos nos informen si tienen alguna inquietud con lo solicitado.",
      "A fin de evaluar el inicio de la auditoría, es importante que nos vayan enviando la información, la cual será canalizada por el senior asignado a la compañía, con copia al equipo de trabajo.",
      "Quedamos atentos a cualquier inquietud o sugerencia.",
    ],
    categories: [
      {
        id: "informacion-general",
        title: "Información General",
        items: [
          {
            id: "politicas-niif",
            text: "Políticas contables NIIF actualizadas. En caso de que hayan cambiado con respecto a las entregadas a la revisoría en el 2024.",
            selected: true,
          },
          {
            id: "balance-comprobacion",
            text: "Balance de comprobación en Excel por cuenta y por terceros mes a mes, de enero a diciembre de 2025.",
            selected: true,
          },
          {
            id: "rut",
            text: "RUT actualizado.",
            selected: true,
          },
          {
            id: "camara-comercio",
            text: "Certificado de Cámara de comercio actualizada.",
            selected: true,
          },
          {
            id: "reformas-estatutarias",
            text: "Reformas estatutarias realizadas, en caso de haberlas.",
            selected: false,
          },
          {
            id: "actas",
            text: "Actas de Junta Directiva y de Asamblea emitidas después del 30 de septiembre de 2025.",
            selected: true,
          },
          {
            id: "datos-entidades-financieras",
            text: "Datos de las entidades financieras, donde se detalle nombre de la entidad, persona de contacto, teléfono y correo electrónico, en caso de que hayan cambiado con respecto a la información compartida en pre-cierre.",
            selected: false,
          },
          {
            id: "estado-dian",
            text: "Estado de cuenta emitido por la DIAN.",
            selected: true,
          },
          {
            id: "correspondencia-control",
            text: "Correspondencia enviada y recibida de entidades de control y vigilancia, DIAN, Superintendencia de Sociedades, Secretaría de Hacienda, entre otras, de enero a diciembre de 2025.",
            selected: false,
          },
          {
            id: "relacion-abogados",
            text: "Relación de los abogados actuales, con datos de contacto tales como persona de contacto, correo electrónico, dirección, teléfono y fax.",
            selected: false,
          },
          {
            id: "procesos-legales",
            text: "Detalle de los procesos legales o reclamaciones a favor o en contra de la compañía y los últimos informes recibidos de los abogados que manejan dichos procesos, así como la relación de los datos de contacto de todos los abogados.",
            selected: false,
          },
          {
            id: "informe-abogados",
            text: "Informe de los abogados, en el cual certifiquen el estado de los procesos jurídicos de la compañía, en contra y a favor, o si no tienen ningún proceso. Este punto es muy importante ya que esta confirmación hace parte fundamental del proceso de cierre.",
            selected: true,
          },
          {
            id: "contenedor-dian",
            text: "Contenedor de la DIAN de octubre a diciembre de 2025.",
            selected: true,
          },
        ],
      },
      {
        id: "efectivo-equivalentes",
        title: "Efectivo y Equivalentes de Efectivo",
        items: [
          {
            id: "conciliaciones-extractos",
            text: "Conciliaciones bancarias al 31 de diciembre de 2025 y extractos. Detalle de las partidas conciliatorias en Excel.",
            selected: true,
          },
          {
            id: "extractos-rendimientos",
            text: "Extractos bancarios y de los rendimientos para las inversiones al 31 de diciembre de 2025.",
            selected: true,
          },
          {
            id: "titulos-inversiones",
            text: "Títulos de las inversiones que posee la compañía al 31 de diciembre de 2025.",
            selected: false,
          },
        ],
      },
      {
        id: "inversiones",
        title: "Inversiones",
        items: [
          {
            id: "conciliacion-inversiones",
            text: "Conciliación de inversiones al 31 de diciembre de 2025.",
            selected: true,
          },
          {
            id: "certificados-fideicomisos",
            text: "Certificados de las inversiones en fideicomisos.",
            selected: true,
          },
          {
            id: "otras-inversiones",
            text: "Detalles de otras inversiones registradas en la cuenta.",
            selected: false,
          },
          {
            id: "extractos-originales",
            text: "Extractos originales que soportan los saldos de las inversiones.",
            selected: true,
          },
        ],
      },
      {
        id: "cuentas-cobrar",
        title: "Cuentas Comerciales por Cobrar",
        items: [
          {
            id: "cuenta-cobrar-edades",
            text: "Detalle de la cuenta por cobrar por edades de rango 0-30, 31-60, 61-90 y 90+, al 31 de diciembre de 2025.",
            selected: true,
          },
          {
            id: "anticipos-1330",
            text: "Reporte de los anticipos 1330 registrados al 31 de diciembre de 2025.",
            selected: true,
          },
          {
            id: "ingresos-cobrar-1345",
            text: "Detalle de los ingresos por cobrar registrados en la cuenta 1345 al 31 de diciembre de 2025.",
            selected: true,
          },
        ],
      },
      {
        id: "ppe",
        title: "Propiedad, Planta y Equipo",
        items: [
          {
            id: "conciliacion-modulo",
            text: "Conciliación del módulo de activos fijos con contabilidad al 31 de diciembre de 2025, en formato Excel.",
            selected: true,
          },
          {
            id: "compras-retiros",
            text: "Reporte con las compras y retiros realizados durante el año, en formato Excel. Este detalle debe cruzar con el movimiento de activos fijos.",
            selected: true,
          },
          {
            id: "facturas-activos",
            text: "Facturas de compra y venta de activos fijos.",
            selected: true,
          },
          {
            id: "depreciacion",
            text: "Reporte de la depreciación generada durante el año por activo de enero a diciembre de 2025, en formato Excel.",
            selected: true,
          },
          {
            id: "costo-fecha",
            text: "Reporte con el costo del activo, la fecha de compra y fecha de activación, en formato Excel.",
            selected: true,
          },
          {
            id: "depreciacion-acumulada",
            text: "Reporte con la depreciación acumulada por activo, en formato Excel.",
            selected: true,
          },
          {
            id: "avaluos",
            text: "Informe técnico de avalúos 2025, si se realizaron.",
            selected: false,
          },
          {
            id: "registro-avaluo",
            text: "Reporte del registro en el sistema del avalúo por activo, en formato Excel.",
            selected: false,
          },
          {
            id: "contable-fiscal",
            text: "Esta información debe suministrarse contable y fiscal, en caso de ser diferente su reconocimiento.",
            selected: false,
          },
        ],
      },
      {
        id: "pasivos-financieros",
        title: "Pasivos Financieros",
        items: [
          {
            id: "extracto-tarjetas",
            text: "Extracto de las tarjetas de crédito a la fecha de corte auditado.",
            selected: true,
          },
          {
            id: "conciliacion-tarjetas",
            text: "Conciliación de las tarjetas de crédito versus contabilidad al 31 de diciembre de 2025.",
            selected: true,
          },
        ],
      },
      {
        id: "cuentas-pagar",
        title: "Cuentas Comerciales por Pagar",
        items: [
          {
            id: "detalle-cxp-edades",
            text: "Detalle de cuentas por pagar por edades en rangos 0-90, 91-180, 181-360 y 361+, incluyendo tercero, documento, fecha de documento, vencimiento, valor en moneda origen y valor en pesos.",
            selected: true,
          },
          {
            id: "anticipos-avances-2805",
            text: "Detalles de las cuentas por pagar registradas en la cuenta 2805 anticipos y avances al corte auditado, en formato Excel.",
            selected: true,
          },
          {
            id: "ingresos-terceros-2815",
            text: "Detalles de las cuentas por pagar registradas en la cuenta 2815 ingresos recibidos para terceros contratos de mandato al corte auditado, en formato Excel.",
            selected: true,
          },
        ],
      },
      {
        id: "nomina",
        title: "Nómina",
        items: [
          {
            id: "empleados-activos-retirados",
            text: "Reporte de empleados activos y retirados al corte auditado, con identificación, nombre empleado, salario, tipo de contrato, fecha de inicio, fecha de retiro si aplica y cargo.",
            selected: true,
          },
          {
            id: "planillas-seguridad-social",
            text: "Planillas de pago detalladas por empleado de la seguridad social, de octubre a diciembre de 2025, en formato Excel.",
            selected: true,
          },
          {
            id: "prestaciones-sociales",
            text: "Cálculo por empleado de las prestaciones sociales, en formato Excel.",
            selected: true,
          },
          {
            id: "vacaciones",
            text: "Libro de vacaciones por empleado al corte auditado, en formato Excel.",
            selected: true,
          },
          {
            id: "salario-promedio",
            text: "Informe por empleado al 31 de diciembre de salario promedio, incluyendo todos los pagos que hacen base de salario.",
            selected: true,
          },
          {
            id: "pagos-extralegales",
            text: "Políticas de reconocimiento de pagos extralegales y reporte por empleado del valor reconocido, en formato Excel.",
            selected: false,
          },
        ],
      },
      {
        id: "patrimonio",
        title: "Patrimonio",
        items: [
          {
            id: "movimiento-patrimonio",
            text: "Informe detallado de movimiento de la cuenta de patrimonio entre enero y diciembre de 2025.",
            selected: true,
          },
        ],
      },
      {
        id: "gastos",
        title: "Gastos",
        items: [
          {
            id: "auxiliar-cuenta-5",
            text: "Auxiliar detallado por documento de la cuenta 5 acumulado de octubre a diciembre, en formato Excel.",
            selected: true,
          },
        ],
      },
      {
        id: "ingresos",
        title: "Ingresos",
        items: [
          {
            id: "conciliacion-facturacion",
            text: "Conciliación de ingresos con el módulo de facturación acumulado de enero a diciembre de 2025, en formato Excel.",
            selected: true,
          },
          {
            id: "devoluciones",
            text: "Reporte de las devoluciones acumuladas de enero a diciembre por tercero, concepto y valor, en formato Excel.",
            selected: true,
          },
          {
            id: "informe-facturacion",
            text: "Informe de facturación en Excel que contenga número de factura, fecha de factura, cliente, referencia, código y descripción vendida, cantidad por referencia, precio unitario, IVA y total de venta.",
            selected: true,
          },
          {
            id: "conciliacion-dian",
            text: "Conciliación de ingresos con el módulo de facturación acumulado año 2025 versus el contenedor de la DIAN.",
            selected: true,
          },
          {
            id: "contratos-arrendamiento",
            text: "Detalle de contratos de arrendamiento donde se logre detallar tercero, canon de arrendamiento y porcentaje de aumento anual.",
            selected: false,
          },
          {
            id: "certificado-fideicomiso",
            text: "Certificado de los ingresos reconocidos por el fideicomiso con el tercero Alianza Fiduciaria.",
            selected: false,
          },
        ],
      },
      {
        id: "asientos-diarios",
        title: "Asientos Diarios",
        items: [
          {
            id: "journal-entries",
            text: "Archivo en Excel de los registros contables Journal Entries correspondientes al período comprendido entre el 1 de enero y el 31 de diciembre de 2025, incluyendo el mayor número posible de campos: código, nombre, descripción, fecha_contab, fecha afectación, journal, usuario_crea, usuario_contab, valor, naturaleza y forma de ingreso.",
            selected: true,
          },
        ],
      },
      {
        id: "otros-conceptos",
        title: "Otros Conceptos",
        items: [
          {
            id: "impuesto-diferido",
            text: "Cálculo del impuesto diferido al corte auditado, en formato Excel.",
            selected: true,
          },
          {
            id: "provision-ica",
            text: "Provisión del impuesto de Industria y Comercio, en formato Excel.",
            selected: true,
          },
          {
            id: "provision-renta",
            text: "Provisión del impuesto de renta, en formato Excel.",
            selected: true,
          },
        ],
      },
      {
        id: "provision-renta",
        title: "Solicitud de Información para la Provisión de la Renta",
        items: [
          {
            id: "renta-2024",
            text: "Declaración de renta presentada y recibo de pago correspondiente al año gravable 2024.",
            selected: true,
          },
          {
            id: "papel-trabajo-provision",
            text: "Enviar papel de trabajo de provisión de renta de la compañía.",
            selected: true,
          },
          {
            id: "balance-anual",
            text: "Balance de enero a diciembre de 2025, no mes a mes, que contenga todo el movimiento del 2025, por terceros NIIF y fiscal.",
            selected: true,
          },
          {
            id: "diferencia-cambio",
            text: "Anexo donde se verifica la diferencia en cambio efectivamente realizada durante el 2025, evidenciando número de factura, fecha de emisión y fecha de realización del ingreso.",
            selected: true,
          },
          {
            id: "activos-fijos-fiscal-niif",
            text: "Anexo de activos fijos fiscal y NIIF, con saldo inicial, depreciación del año, compras y ventas. Debe justificar el ajuste por depreciación fiscal que se va a tomar en renta y comparar lo contable y lo fiscal. Indispensable suministrar esta información.",
            selected: true,
          },
          {
            id: "leasing",
            text: "Si la compañía maneja leasing, suministrar tabla de amortización.",
            selected: false,
          },
          {
            id: "activos-diferidos",
            text: "Relación de anexos de activos diferidos que se posean, indicando concepto y tiempo de amortización.",
            selected: false,
          },
          {
            id: "seguridad-social-exogena",
            text: "Reporte en Excel de los pagos consolidados de enero a diciembre de seguridad social extraído de la plataforma de pago, evidenciando aporte del empleado y aporte del empleador.",
            selected: true,
          },
          {
            id: "donaciones",
            text: "Certificado de donaciones que se vayan a tener en cuenta como descuento en la declaración.",
            selected: false,
          },
          {
            id: "prestamos-vinculados",
            text: "Anexo de préstamos de vinculados económicos en lo que va del año.",
            selected: false,
          },
          {
            id: "pagos-efectivo",
            text: "Relación de pagos realizados en efectivo para determinar el límite de deducción de costos y gastos por bancarización aplicable para 2025 y relación de pagos no soportados con facturación electrónica. Indispensable suministrar esta información.",
            selected: true,
          },
          {
            id: "descuentos-tributarios",
            text: "Detalle de los descuentos tributarios a aplicar y su respectivo soporte.",
            selected: false,
          },
          {
            id: "interes-presuntivo",
            text: "Movimiento mensual de las cuentas por cobrar a socios o accionistas y cálculo del interés presuntivo.",
            selected: false,
          },
          {
            id: "provision-cartera-fiscal",
            text: "Cálculo provisión cartera fiscal y envío de cartera por edades desde el módulo de cartera.",
            selected: true,
          },
          {
            id: "certificaciones-retencion",
            text: "Certificaciones de retención en la fuente de renta. Todas las retenciones que se van a tomar deben estar soportadas con certificado.",
            selected: true,
          },
          {
            id: "ica-pagado",
            text: "Anexo con el detalle y recibos de industria y comercio efectivamente pagados durante el 2025.",
            selected: true,
          },
          {
            id: "compras-exterior",
            text: "Relación de compras realizadas en el exterior a las que no se les haya practicado retención en la fuente. Informar si no hacen compras en el exterior.",
            selected: false,
          },
          {
            id: "activos-productivos",
            text: "Relación de compra de activos fijos directamente relacionados con la producción o prestación del servicio.",
            selected: false,
          },
          {
            id: "venta-activos",
            text: "Relación de venta de activos fijos donde se evidencie fecha de adquisición, costo de adquisición, depreciación acumulada, fecha de venta y valor de venta. Adjuntar facturas de venta.",
            selected: false,
          },
          {
            id: "empleados-discapacidad",
            text: "Verificación y listado de empleados contratados que tengan un grado de discapacidad superior al 25% comprobada.",
            selected: false,
          },
          {
            id: "empleados-menores-28",
            text: "Verificación y listado de empleados contratados menores de 28 años que sea su primer empleo y cumplan los requisitos legales para reconocer el beneficio.",
            selected: false,
          },
          {
            id: "escudos-fiscales",
            text: "Relaciones de escudos fiscales, en caso de tener o haber tenido pérdidas fiscales en otros periodos.",
            selected: false,
          },
          {
            id: "conciliacion-impuestos",
            text: "Anexo de conciliación de impuestos IVA, retención, ICA y autorretención ICA.",
            selected: true,
          },
          {
            id: "gastos-no-deducibles",
            text: "Anexo de análisis y depuración de gastos no deducibles al 31 de diciembre de 2025.",
            selected: true,
          },
          {
            id: "contratos-colaboracion",
            text: "Copia de contratos de colaboración, mandato, cuentas en participación, consorcios, entre otros.",
            selected: false,
          },
          {
            id: "beneficios-fiscales",
            text: "Certificados de beneficios fiscales aplicados, Ley 1715, inversiones en ciencia y tecnología, exenciones, entre otros.",
            selected: false,
          },
          {
            id: "deducciones-especiales",
            text: "Documentación de deducciones especiales, como vehículos híbridos.",
            selected: false,
          },
          {
            id: "acciones",
            text: "Certificado de las acciones poseídas a 31 de diciembre de 2025, donde indique número de acciones y porcentaje de participación, costo histórico, valor razonable o método patrimonial.",
            selected: false,
          },
          {
            id: "tasa-minima-tributacion",
            text: "En caso de que aplique el ajuste al impuesto por cálculo de la tasa mínima de tributación, anexo de depuración del ingreso depurado y utilidad depurada.",
            selected: false,
          },
          {
            id: "conciliacion-ingresos-dian",
            text: "Conciliación de los ingresos reportados a la DIAN mediante facturación electrónica versus ingresos fiscales y NIIF, incluyendo el reporte original.",
            selected: true,
          },
        ],
      },
    ],
  },
] satisfies RawRequestTemplate[];