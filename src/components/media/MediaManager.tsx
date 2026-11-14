"use client";

import { useRouter } from "next/navigation";
import { useRef, useState, useTransition } from "react";
import { ImagePlus, Loader2, Trash2, User } from "lucide-react";
import { deleteMedia, setAvatar, clearAvatar } from "@/actions/media";
import { MAX_UPLOAD_BYTES, formatBytes } from "@/lib/image";

type MediaItem = {
  id: string;
  url: string;
  kind: string;
  width: number;
  height: number;
  size: number;
};

export function MediaManager({
  media,
  avatarUrl,
  isSelf,
}: {
  media: MediaItem[];
  avatarUrl: string;
  isSelf: boolean;
}) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [pending, startTransition] = useTransition();
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);

  async function upload(files: FileList | null) {
    if (!files || files.length === 0) return;
    setError(null);
    setUploading(true);

    for (const file of Array.from(files)) {
      try {
        setProgress(`enviando ${file.name}`);

        const body = new FormData();
        body.set("file", file);
        body.set("kind", "photo");

        const response = await fetch("/api/upload", { method: "POST", body });

        const payload = (await response.json()) as {
          error?: string;
          url?: string;
          id?: string;
        };

        if (!response.ok) {
          setError(payload.error ?? "falha no upload");
          continue;
        }

        // Avatar: cada imagem enviada vira o avatar do perfil.
        // Nao precisamos passar callback do server: o router.refresh() traz.
        if (payload.id) {
          const result = await setAvatar(payload.id);
          if (result && "error" in result && result.error) {
            setError(result.error);
          }
        }

        router.refresh();
      } catch {
        setError("falha de rede no upload");
      }
    }

    setUploading(false);
    setProgress(null);
    if (inputRef.current) inputRef.current.value = "";
  }

  function remove(id: string) {
    startTransition(async () => {
      await deleteMedia(id);
      router.refresh();
    });
  }

  function dropAvatar() {
    startTransition(async () => {
      await clearAvatar();
      router.refresh();
    });
  }

  return (
    <section className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <span className="panel-title">Suas fotos</span>
        {isSelf ? (
          <>
            <input
              ref={inputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif,image/avif"
              multiple
              hidden
              onChange={(event) => void upload(event.target.files)}
            />
            <button
              type="button"
              disabled={uploading || pending}
              onClick={() => inputRef.current?.click()}
              className="btn btn-primary px-3 py-1.5 text-[11px]"
            >
              {uploading ? (
                <Loader2 size={13} className="animate-spin" />
              ) : (
                <ImagePlus size={13} />
              )}
              {uploading ? "enviando" : "enviar fotos"}
            </button>
            <span className="font-mono text-[11px] text-muted">
              jpg, png, webp, gif · ate {formatBytes(MAX_UPLOAD_BYTES)}
            </span>
          </>
        ) : null}
        {avatarUrl && isSelf ? (
          <button type="button" onClick={dropAvatar} disabled={pending} className="btn btn-ghost px-3 py-1.5 text-[11px]">
            <User size={13} /> remover foto do perfil
          </button>
        ) : null}
      </div>

      {progress ? (
        <p className="font-mono text-[11px] text-cyan">{progress}</p>
      ) : null}
      {error ? <p className="text-sm text-magenta">{error}</p> : null}

      {isSelf ? (
        <div
          role="button"
          tabIndex={0}
          onClick={() => inputRef.current?.click()}
          onKeyDown={(event) => {
            if (event.key === "Enter" || event.key === " ") inputRef.current?.click();
          }}
          onDragOver={(event) => {
            event.preventDefault();
            setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={(event) => {
            event.preventDefault();
            setDragOver(false);
            void upload(event.dataTransfer.files);
          }}
          className={`grid min-h-28 place-items-center rounded-xl border border-dashed px-4 py-8 text-center text-sm transition-colors ${
            dragOver ? "border-cyan bg-cyan/10" : "border-cyan/25 bg-black/20"
          }`}
        >
          <div>
            <p className="text-muted">
              arraste imagens para cima, ou clique para escolher
            </p>
            <p className="mt-1 font-mono text-[11px] text-muted/70">
              processadas no servidor: EXIF removido, redimensionadas e convertidas
            </p>
          </div>
        </div>
      ) : null}

      {media.length === 0 ? (
        <p className="py-4 text-sm text-muted">Nenhuma foto enviada ainda.</p>
      ) : (
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {media.map((item) => (
            <li key={item.id} className="group relative">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={item.url}
                alt={item.kind}
                width={item.width || 300}
                height={item.height || 300}
                className="aspect-square w-full rounded-xl border border-cyan/15 object-cover"
              />
              <p className="mt-1 font-mono text-[10px] text-muted">
                {item.width}×{item.height} · {formatBytes(item.size)}
              </p>
              {isSelf ? (
                <button
                  type="button"
                  onClick={() => remove(item.id)}
                  disabled={pending}
                  aria-label="Remover foto"
                  className="absolute top-1.5 right-1.5 grid h-7 w-7 place-items-center rounded-lg border border-magenta/40 bg-void/80 text-magenta opacity-0 transition-opacity group-hover:opacity-100"
                >
                  <Trash2 size={13} />
                </button>
              ) : null}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}