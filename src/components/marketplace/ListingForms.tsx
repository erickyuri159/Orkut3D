"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Plus, Tag } from "lucide-react";
import { createListing, markListingSold } from "@/actions/content";
import { LISTING_CATEGORIES } from "@/lib/enums";
import { SubmitButton } from "@/components/ui/SubmitButton";

export function NewListingForm() {
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  function submit(formData: FormData) {
    setError(null);
    startTransition(async () => {
      const result = await createListing(formData);
      if (result && "error" in result && result.error) {
        setError(result.error);
        return;
      }
      setOpen(false);
    });
  }

  if (!open) {
    return (
      <button type="button" onClick={() => setOpen(true)} className="btn btn-primary">
        <Plus size={15} /> Novo anúncio
      </button>
    );
  }

  return (
    <form action={submit} className="w-full space-y-3 rounded-xl border border-cyan/15 bg-black/25 p-4">
      <div>
        <label className="label">Título</label>
        <input name="title" className="field" maxLength={90} required />
      </div>
      <div className="grid gap-3 sm:grid-cols-3">
        <div>
          <label className="label">Preço (R$)</label>
          <input name="price" type="number" min="0" step="0.01" className="field" defaultValue="0" required />
        </div>
        <div>
          <label className="label">Categoria</label>
          <select name="category" className="field" defaultValue="outros">
            {LISTING_CATEGORIES.map((category) => (
              <option key={category.id} value={category.id}>
                {category.label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="label">Local</label>
          <input name="location" className="field" maxLength={90} />
        </div>
      </div>
      <div>
        <label className="label">Descrição</label>
        <textarea name="description" className="field min-h-24 resize-y" maxLength={900} />
      </div>
      {error ? <p className="text-sm text-magenta">{error}</p> : null}
      <div className="flex gap-2">
        <SubmitButton className="btn btn-primary">
          <Tag size={14} /> Publicar
        </SubmitButton>
        <button type="button" onClick={() => setOpen(false)} className="btn btn-ghost">
          Cancelar
        </button>
      </div>
    </form>
  );
}

export function ListingActions({ listingId, sold, isOwner }: { listingId: string; sold: boolean; isOwner: boolean }) {
  const router = useRouter();
  const [, startTransition] = useTransition();
  if (!isOwner) return null;

  return (
    <button
      type="button"
      onClick={() => startTransition(async () => {
        await markListingSold(listingId);
        router.refresh();
      })}
      className={`btn px-3 py-1.5 text-[11px] ${sold ? "btn-ghost" : "btn-primary"}`}
    >
      {sold ? "remover do ar" : "marcar vendido"}
    </button>
  );
}
