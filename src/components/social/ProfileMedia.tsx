"use client";

import { useState, useTransition } from "react";
import { BookOpen, Camera, Disc3, Plus, Trash2, Video } from "lucide-react";
import { addProfileItem, removeProfileItem } from "@/actions/content";
import { Panel } from "@/components/ui/Panel";
import { hashCode, relativeTime } from "@/lib/format";

type MediaProfile = {
  name: string;
  uid: string;
  photos: { id: string; seed: string; caption: string; createdAt: Date }[];
  videos: { id: string; title: string; seed: string; createdAt: Date }[];
  tracks: { id: string; title: string; artist: string; seed: string; createdAt: Date }[];
  books: { id: string; title: string; author: string; status: string; createdAt: Date }[];
};

const TABS = [
  { id: "photos", label: "Fotos", icon: Camera },
  { id: "videos", label: "Vídeos", icon: Video },
  { id: "tracks", label: "Música", icon: Disc3 },
  { id: "books", label: "Livros", icon: BookOpen },
] as const;

type TabId = (typeof TABS)[number]["id"];

/** "Foto" e "vídeo" são mosaicos procedurais — cada seed vira uma cena 3D única. */
function Mosaic({ seed, label }: { seed: string; label: string }) {
  const hue = hashCode(seed) % 360;
  const angle = (hashCode(`${seed}-a`) % 360) + 40;
  return (
    <div
      className="relative aspect-square overflow-hidden rounded-xl border border-cyan/18"
      style={{
        background: `
          radial-gradient(circle at 28% 26%, hsl(${(hue + 60) % 360} 95% 66% / 0.95), transparent 55%),
          radial-gradient(circle at 74% 70%, hsl(${hue} 90% 55% / 0.9), transparent 58%),
          linear-gradient(${angle}deg, #05070f, #101a3c)`,
      }}
    >
      <div className="absolute inset-0 grid-floor opacity-60" />
      <span className="absolute bottom-1.5 left-2 font-mono text-[9px] tracking-widest text-white/60 uppercase">
        {label}
      </span>
    </div>
  );
}

export function ProfileMedia({ profile, isSelf }: { profile: MediaProfile; isSelf: boolean }) {
  const [tab, setTab] = useState<TabId>("photos");
  const [adding, setAdding] = useState(false);
  const [pending, startTransition] = useTransition();

  const counts = {
    photos: profile.photos.length,
    videos: profile.videos.length,
    tracks: profile.tracks.length,
    books: profile.books.length,
  };

  function remove(kind: TabId, id: string) {
    startTransition(async () => {
      await removeProfileItem(kind, id);
    });
  }

  return (
    <Panel
      title="Galeria do perfil"
      action={
        isSelf ? (
          <button type="button" onClick={() => setAdding((value) => !value)} className="btn btn-ghost px-3 py-1.5 text-[11px]">
            <Plus size={13} /> adicionar
          </button>
        ) : null
      }
    >
      <div className="flex flex-wrap gap-2 px-5 pt-4">
        {TABS.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => setTab(item.id)}
            className={`btn px-3 py-1.5 text-[11px] ${tab === item.id ? "btn-primary" : "btn-ghost"}`}
          >
            <item.icon size={13} /> {item.label} ({counts[item.id]})
          </button>
        ))}
      </div>

      {isSelf && adding ? (
        <AddForm kind={tab} onDone={() => setAdding(false)} />
      ) : null}

      <div className="px-5 py-5">
        {tab === "photos" ? (
          <Grid
            items={profile.photos.map((photo) => ({
              id: photo.id,
              seed: photo.seed,
              title: photo.caption || "Foto sem legenda",
              meta: relativeTime(photo.createdAt),
            }))}
            label="foto"
            canEdit={isSelf}
            onRemove={(id) => remove("photos", id)}
            pending={pending}
            empty="Nenhuma foto publicada."
          />
        ) : null}

        {tab === "videos" ? (
          <Grid
            items={profile.videos.map((video) => ({
              id: video.id,
              seed: video.seed,
              title: video.title,
              meta: relativeTime(video.createdAt),
            }))}
            label="vídeo"
            canEdit={isSelf}
            onRemove={(id) => remove("videos", id)}
            pending={pending}
            empty="Nenhum vídeo publicado."
          />
        ) : null}

        {tab === "tracks" ? (
          <div className="space-y-2">
            {profile.tracks.length === 0 ? (
              <Empty text="Nenhuma faixa adicionada." />
            ) : (
              profile.tracks.map((track) => (
                <Row
                  key={track.id}
                  seed={track.seed}
                  title={track.title}
                  meta={track.artist}
                  canEdit={isSelf}
                  onRemove={() => remove("tracks", track.id)}
                  pending={pending}
                />
              ))
            )}
          </div>
        ) : null}

        {tab === "books" ? (
          <div className="space-y-2">
            {profile.books.length === 0 ? (
              <Empty text="Nenhum livro na estante." />
            ) : (
              profile.books.map((book) => (
                <Row
                  key={book.id}
                  seed={book.id}
                  title={book.title}
                  meta={`${book.author} · ${book.status}`}
                  canEdit={isSelf}
                  onRemove={() => remove("books", book.id)}
                  pending={pending}
                />
              ))
            )}
          </div>
        ) : null}
      </div>
    </Panel>
  );
}

function Grid({
  items,
  label,
  canEdit,
  onRemove,
  empty,
  pending,
}: {
  items: { id: string; seed: string; title: string; meta: string }[];
  label: string;
  canEdit: boolean;
  onRemove: (id: string) => void;
  empty: string;
  pending: boolean;
}) {
  if (items.length === 0) return <Empty text={empty} />;

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
      {items.map((item) => (
        <figure key={item.id} className="group relative">
          <Mosaic seed={item.seed} label={label} />
          <figcaption className="mt-1.5 truncate text-xs">{item.title}</figcaption>
          <p className="font-mono text-[10px] text-muted">{item.meta}</p>
          {canEdit ? (
            <button
              type="button"
              onClick={() => onRemove(item.id)}
              disabled={pending}
              aria-label="Remover"
              className="absolute top-1.5 right-1.5 grid h-7 w-7 place-items-center rounded-lg border border-magenta/40 bg-void/80 text-magenta opacity-0 transition-opacity group-hover:opacity-100"
            >
              <Trash2 size={13} />
            </button>
          ) : null}
        </figure>
      ))}
    </div>
  );
}

function Row({
  seed,
  title,
  meta,
  canEdit,
  onRemove,
  pending,
}: {
  seed: string;
  title: string;
  meta: string;
  canEdit: boolean;
  onRemove: () => void;
  pending: boolean;
}) {
  const hue = hashCode(seed) % 360;
  return (
    <div className="flex items-center gap-3 rounded-xl border border-cyan/12 bg-white/3 px-3 py-2">
      <span
        className="grid h-10 w-10 shrink-0 place-items-center rounded-lg font-display text-[10px] text-white/85"
        style={{
          background: `conic-gradient(from 210deg, hsl(${hue} 90% 55%), hsl(${(hue + 120) % 360} 90% 50%), hsl(${hue} 90% 55%))`,
        }}
      >
        {title.slice(0, 2).toUpperCase()}
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm">{title}</p>
        <p className="truncate font-mono text-[11px] text-muted">{meta}</p>
      </div>
      {canEdit ? (
        <button
          type="button"
          onClick={onRemove}
          disabled={pending}
          className="btn btn-ghost px-2 py-1 text-magenta"
          aria-label="Remover"
        >
          <Trash2 size={13} />
        </button>
      ) : null}
    </div>
  );
}

function Empty({ text }: { text: string }) {
  return <p className="py-8 text-center text-sm text-muted">{text}</p>;
}

function AddForm({ kind, onDone }: { kind: TabId; onDone: () => void }) {
  const [error, setError] = useState<string | null>(null);

  function handleSubmit(formData: FormData) {
    void addProfileItem(kind, formData).then((result) => {
      if (result && "error" in result && result.error) {
        setError(result.error);
        return;
      }
      setError(null);
      onDone();
    });
  }

  return (
    <form action={handleSubmit} className="mx-5 mt-4 grid gap-3 rounded-xl border border-cyan/15 bg-black/25 p-4 sm:grid-cols-2">
      {kind === "photos" ? (
        <div className="sm:col-span-2">
          <label className="label">Legenda da foto</label>
          <input name="caption" className="field" placeholder="O que essa cena representa?" />
        </div>
      ) : null}

      {kind === "videos" ? (
        <div className="sm:col-span-2">
          <label className="label">Título do vídeo</label>
          <input name="title" className="field" required />
        </div>
      ) : null}

      {kind === "tracks" ? (
        <>
          <div>
            <label className="label">Faixa</label>
            <input name="title" className="field" required />
          </div>
          <div>
            <label className="label">Artista</label>
            <input name="artist" className="field" required />
          </div>
        </>
      ) : null}

      {kind === "books" ? (
        <>
          <div>
            <label className="label">Livro</label>
            <input name="title" className="field" required />
          </div>
          <div>
            <label className="label">Autor</label>
            <input name="author" className="field" />
          </div>
          <div>
            <label className="label">Status</label>
            <select name="status" className="field" defaultValue="reading">
              <option value="reading">Lendo</option>
              <option value="finished">Terminei</option>
              <option value="want">Quero ler</option>
            </select>
          </div>
        </>
      ) : null}

      {error ? <p className="text-sm text-magenta sm:col-span-2">{error}</p> : null}

      <div className="flex gap-2 sm:col-span-2">
        <button type="submit" className="btn btn-primary">
          Salvar
        </button>
        <button type="button" onClick={onDone} className="btn btn-ghost">
          Cancelar
        </button>
      </div>
    </form>
  );
}
