import { hashCode, initials } from "@/lib/format";

/** Avatar procedural: sem upload de imagem, cada pessoa ganha um "núcleo" único. */
export function Avatar({
  name,
  seed,
  size = 44,
  ring = true,
  src = "",
}: {
  name: string;
  seed: string;
  size?: number;
  ring?: boolean;
  src?: string;
}) {
  const hash = hashCode(`${name}-${seed}`);
  const hue = hash % 360;
  const hue2 = (hue + 120 + (hash % 60)) % 360;
  const tilt = (hash % 40) - 20;

  if (src) {
    return (
      <span
        className="relative inline-grid shrink-0 place-items-center overflow-hidden rounded-full"
        style={{
          width: size,
          height: size,
          boxShadow: ring
            ? `0 0 0 1px hsl(${hue} 100% 78% / 0.55), 0 0 ${Math.round(size * 0.35)}px hsl(${hue} 100% 60% / 0.35)`
            : undefined,
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={src}
          alt={name}
          width={size}
          height={size}
          className="h-full w-full object-cover"
        />
      </span>
    );
  }

  return (
    <span
      className="relative inline-grid shrink-0 place-items-center overflow-hidden rounded-full font-display font-semibold text-white/95"
      style={{
        width: size,
        height: size,
        fontSize: size * 0.36,
        background: `linear-gradient(${140 + tilt}deg, hsl(${hue} 92% 62%), hsl(${hue2} 88% 48%))`,
        boxShadow: ring
          ? `0 0 0 1px hsl(${hue} 100% 78% / 0.55), 0 0 ${Math.round(size * 0.45)}px hsl(${hue} 100% 60% / 0.42)`
          : undefined,
      }}
    >
      <span
        aria-hidden
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(circle at 32% 24%, rgba(255,255,255,0.55), transparent 46%), radial-gradient(circle at 74% 82%, rgba(0,0,0,0.45), transparent 55%)",
        }}
      />
      <span className="relative drop-shadow-[0_1px_3px_rgba(0,0,0,0.7)]">{initials(name)}</span>
    </span>
  );
}
