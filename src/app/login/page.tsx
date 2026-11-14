import Link from "next/link";
import { redirect } from "next/navigation";
import { currentUser } from "@/lib/auth";
import { getTheme } from "@/lib/theme";
import { LoginForm } from "@/components/forms/LoginForm";
import { Avatar } from "@/components/ui/Avatar";
import { ThemeToggle } from "@/components/ThemeToggle";

export const metadata = { title: "Entrar" };

export default async function LoginPage() {
  if (await currentUser()) redirect("/app/feed");

  const theme = await getTheme();

  const demo = await import("@/lib/prisma").then((m) =>
    m.prisma.user.findMany({ select: { name: true, username: true, avatarSeed: true }, take: 4, orderBy: { credits: "desc" } }),
  );

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
          <h1 className="font-display text-xl tracking-[0.2em] uppercase">Acessar a rede</h1>
          <p className="mt-2 mb-6 text-sm text-muted">
            Seus amigos, scraps e cutucadas estão te esperando.
          </p>
          <LoginForm />
        </div>

        <div className="mt-4 flex justify-center">
          <ThemeToggle current={theme} />
        </div>

        {demo.length > 0 ? (
          <div className="panel mt-4 p-5">
            <p className="panel-title mb-3">Contas de demonstração</p>
            <div className="flex flex-wrap gap-3">
              {demo.map((person) => (
                <div key={person.username} className="flex items-center gap-2">
                  <Avatar name={person.name} seed={person.avatarSeed} size={32} />
                  <div className="leading-tight">
                    <p className="text-sm">{person.name}</p>
                    <p className="font-mono text-[11px] text-muted">@{person.username}</p>
                  </div>
                </div>
              ))}
            </div>
            <p className="mt-3 font-mono text-[11px] text-muted">
              senha de todas: <span className="text-cyan">orb2088</span>
            </p>
          </div>
        ) : null}
      </div>
    </main>
  );
}
