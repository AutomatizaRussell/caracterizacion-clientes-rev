import type { getClientesConAvanceParaEmpleado } from "@/server/caracterizacion";

export type ClienteConAvance = Awaited<
  ReturnType<typeof getClientesConAvanceParaEmpleado>
>[number];

export function getFormularioPrincipal(cliente: ClienteConAvance) {
  return cliente.formularios[0] ?? null;
}

export function getPorcentajeCaracterizacion(cliente: ClienteConAvance) {
  const formulario = getFormularioPrincipal(cliente);

  if (!formulario) {
    return 0;
  }

  return Number(formulario.completionPercentage);
}

export function getEstadoCaracterizacionVisual(cliente: ClienteConAvance) {
  const formulario = getFormularioPrincipal(cliente);

  if (!formulario) {
    return {
      label: "Sin iniciar",
      className: "bg-slate-100 text-slate-600 ring-slate-200",
      progressClassName: "bg-slate-300",
      description: "El formulario aún no ha sido abierto.",
      priority: 1,
    };
  }

  if (formulario.status === "CONFIRMED") {
    if (formulario.hasPostConfirmationChanges) {
      return {
        label: "Confirmado con cambios",
        className: "bg-[#981d97]/10 text-[#981d97] ring-[#981d97]/20",
        progressClassName: "bg-[#981d97]",
        description: "El formulario fue confirmado, pero tiene cambios posteriores.",
        priority: 3,
      };
    }

    return {
      label: "Confirmado",
      className: "bg-[#001871]/10 text-[#001871] ring-[#001871]/20",
      progressClassName: "bg-[#001871]",
      description: "El formulario fue confirmado.",
      priority: 5,
    };
  }

  if (formulario.status === "COMPLETE") {
    return {
      label: "Completo",
      className: "bg-[#00bfb3]/10 text-[#008b83] ring-[#00bfb3]/20",
      progressClassName: "bg-[#00bfb3]",
      description: "Todas las preguntas obligatorias están diligenciadas.",
      priority: 4,
    };
  }

  return {
    label: "En proceso",
    className: "bg-[#ed8b00]/10 text-[#b46600] ring-[#ed8b00]/20",
    progressClassName: "bg-[#ed8b00]",
    description: "El formulario fue iniciado, pero aún tiene pendientes.",
    priority: 2,
  };
}

export function getResumenCaracterizacion(cliente: ClienteConAvance) {
  const formulario = getFormularioPrincipal(cliente);

  if (!formulario) {
    return {
      answeredCount: 0,
      totalCount: 38,
      status: "SIN_INICIAR",
      hasPostConfirmationChanges: false,
    };
  }

  return {
    answeredCount: formulario.answeredCount,
    totalCount: formulario.totalCount,
    status: formulario.status,
    hasPostConfirmationChanges: formulario.hasPostConfirmationChanges,
  };
}

export function getClientesSinIniciar(clientes: ClienteConAvance[]) {
  return clientes.filter((cliente) => !getFormularioPrincipal(cliente));
}

export function getClientesEnProceso(clientes: ClienteConAvance[]) {
  return clientes.filter((cliente) => {
    const formulario = getFormularioPrincipal(cliente);

    return formulario?.status === "DRAFT";
  });
}

export function getClientesCompletos(clientes: ClienteConAvance[]) {
  return clientes.filter((cliente) => {
    const formulario = getFormularioPrincipal(cliente);

    return formulario?.status === "COMPLETE";
  });
}

export function getClientesConfirmados(clientes: ClienteConAvance[]) {
  return clientes.filter((cliente) => {
    const formulario = getFormularioPrincipal(cliente);

    return formulario?.status === "CONFIRMED";
  });
}

export function getClientesQueRequierenAtencion(clientes: ClienteConAvance[]) {
  return [...clientes]
    .filter((cliente) => {
      const formulario = getFormularioPrincipal(cliente);

      if (!formulario) {
        return true;
      }

      return formulario.status === "DRAFT" || formulario.hasPostConfirmationChanges;
    })
    .sort((a, b) => {
      const estadoA = getEstadoCaracterizacionVisual(a);
      const estadoB = getEstadoCaracterizacionVisual(b);

      return estadoA.priority - estadoB.priority;
    })
    .slice(0, 5);
}

export function formatEstadoCliente(value: string | null | undefined) {
  if (!value) {
    return "Sin estado";
  }

  const normalized = value.trim().toLowerCase();

  if (!normalized) {
    return "Sin estado";
  }

  return normalized.charAt(0).toUpperCase() + normalized.slice(1);
}