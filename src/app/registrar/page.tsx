import Link from "next/link";
import { redirect } from "next/navigation";
import { currentUser } from "@/lib/auth";
import { getTheme } from "@/lib/theme";
import { RegisterForm } from "@/components/forms/RegisterForm";
import { ThemeToggle } from "@/components/ThemeToggle";

export const metadata = { title: "Criar perfil" };

export default async function RegisterPage() {
  if (await currentUser()) redirect("/app/feed");

  const theme = await getTheme();

  return (
    <main className="grid min-h-dvh place-items-center px-5 py-14">
      <div className="w-full max-w-md">
        <Link href="/" className="mb-8 flex items-center justify-center gap-3">
          <span className="grid h-11 w-11 place-items-center rounded-full border border-cyan/40 bg-cyan/10 font-display text-[10px] font-bold text-cyan">
            ORB
          </span>
          <span className="font-display text-sm tracking-[0.32em] uppercase">
            ORB<span className="text-cyan">{"//2088"}</span>
          </span>
        </Link>

        <div className="panel corner-frame p-7">
          <h1 className="font-display text-xl tracking-[0.2em] uppercase">Criar perfil</h1>
          <p className="mt-2 mb-6 text-sm text-muted">
            Em 30 segundos você já tem amigos, comunidades, um núcleo 3D e uma VISTA gerados só
            para você.
          </p>
          <RegisterForm />
        </div>

        <div className="mt-4 flex justify-center">
          <ThemeToggle current={theme} />
        </div>
      </div>
    </main>
  );
}
