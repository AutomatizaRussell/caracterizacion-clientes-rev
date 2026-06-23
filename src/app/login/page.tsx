import { getEmpleadosParaLogin } from "@/server/queries";
import { loginAsEmpleado } from "./actions";

export const dynamic = "force-dynamic";

export default async function LoginPage() {
  const empleados = await getEmpleadosParaLogin();

  return (
    <main className="min-h-screen bg-white px-4 py-10">
      <form
        action={loginAsEmpleado}
        className="rb-card mx-auto w-full max-w-[850px]"
        suppressHydrationWarning
      >
        <div className="bg-white px-8 py-8">
          <div className="mx-auto max-w-xl">
            <img
              src="/rb-logo.png"
              alt="Russell Bedford"
              className="h-auto w-full"
            />
          </div>
        </div>

        <div className="h-2 w-full bg-gradient-to-r from-[#001871] via-[#981d97] to-[#00bfb3]" />

        <div className="px-6 py-10 sm:px-12">
          <div className="mb-10 text-center">
            <h1 className="rb-title-gradient text-3xl font-extrabold uppercase">
              Plataforma Impulsa
            </h1>

          </div>

          <section className="mb-10">
            <div className="rb-section-title mb-8">
              Acceso al sistema
            </div>

            <div className="mx-auto max-w-xl text-center">
              <div className="space-y-6">
                <div>
                  <label htmlFor="correoCorporativo" className="rb-label">
                    Correo corporativo{" "}
                    <span className="text-[#ed8b00]">*</span>
                  </label>

                  <select
                    id="correoCorporativo"
                    name="correoCorporativo"
                    required
                    className="rb-input text-center"
                    autoComplete="off"
                    data-protonpass-ignore="true"
                  >
                    <option value="">SELECCIONE UNA OPCIÓN</option>

                    {empleados.map((empleado) => (
                      <option
                        key={empleado.id}
                        value={empleado.correoCorporativo}
                      >
                        {empleado.correoCorporativo} —{" "}
                        {empleado.nombreCompleto} — {empleado.rolAplicacion}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label htmlFor="password" className="rb-label">
                    Contraseña <span className="text-[#ed8b00]">*</span>
                  </label>

                  <input
                    id="password"
                    name="password"
                    type="password"
                    required
                    className="rb-input text-center"
                    placeholder="Contraseña temporal"
                    autoComplete="off"
                    data-protonpass-ignore="true"
                  />
                </div>
              </div>

              <p className="mt-4 text-xs leading-5 text-slate-500">
                Acceso temporal de validación interna. La autenticación
                definitiva será habilitada en una fase posterior.
              </p>
            </div>
          </section>

          <button type="submit" className="rb-button-primary">
            Ingresar al Dashboard
          </button>
        </div>

        <div className="h-10 w-full bg-gradient-to-r from-[#001871] via-[#00bfb3] to-[#981d97]" />
      </form>
    </main>
  );
}