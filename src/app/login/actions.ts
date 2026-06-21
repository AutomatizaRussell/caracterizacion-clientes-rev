"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export async function loginAsEmpleado(formData: FormData) {
  const correoCorporativo = String(formData.get("correoCorporativo") ?? "")
    .trim()
    .toLowerCase();

  if (!correoCorporativo) {
    redirect("/login");
  }

  const { getEmpleadoByCorreo } = await import("@/server/queries");

  const empleado = await getEmpleadoByCorreo(correoCorporativo);

  if (!empleado) {
    redirect("/login");
  }

  const cookieStore = await cookies();

  cookieStore.set("empleado_id", empleado.id, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
  });

  redirect("/dashboard");
}

export async function logout() {
  const cookieStore = await cookies();

  cookieStore.delete("empleado_id");

  redirect("/login");
}