"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Globe, Plus } from "lucide-react";
import { createCommunity } from "@/actions/content";
import { COMMUNITY_THEMES } from "@/lib/enums";

export function CreateCommunityForm() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  function submit(formData: FormData) {
    setError(null);
    startTransition(async () => {
      const result = await createCommunity(formData);
      if (result && "error" in result && result.error) {
        setError(result.error);
        return;
      }
      setOpen(false);
      if (result && "ok" in result && result.slug) {
        router.push(`/app/comunidades/${result.slug}`);
      }
    });
  }

  if (!open) {
    return (
      <button type="button" onClick={() => setOpen(true)} className="btn btn-primary">
        <Plus size={15} /> Criar comunidade
      </button>
    );
  }

  return (
    <form action={submit} className="w-full space-y-3 rounded-xl border border-cyan/15 bg-black/25 p-4">
      <div>
        <label className="label">Nome</label>
        <input name="name" className="field" placeholder="Ex.: Vaporwave Brasil" maxLength={60} required />
      </div>
      <div>
        <label className="label">Tagline</label>
        <input name="tagline" className="field" placeholder="Uma frase" maxLength={120} />
      </div>
      <div>
        <label className="label">Descrição</label>
        <textarea name="description" className="field min-h-24 resize-y" maxLength={900} />
      </div>
      <div>
        <label className="label">Tema</label>
        <div className="flex flex-wrap gap-2">
          {COMMUNITY_THEMES.map((theme, index) => (
            <label key={theme} className="flex cursor-pointer items-center gap-2 text-xs">
              <input type="radio" name="theme" value={theme} defaultChecked={index === 0} className="accent-cyan" />
              <span className="h-3 w-3 rounded-full" style={{ backgroundColor: theme }} />
              <span className="font-mono">{theme}</span>
            </label>
          ))}
        </div>
      </div>
      {error ? <p className="text-sm text-magenta">{error}</p> : null}
      <div className="flex gap-2">
        <button type="submit" className="btn btn-primary">
          <Globe size={14} /> Criar
        </button>
        <button type="button" onClick={() => setOpen(false)} className="btn btn-ghost">
          Cancelar
        </button>
      </div>
    </form>
  );
}
