"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Save, Shuffle } from "lucide-react";
import { updateProfile } from "@/actions/content";
import { GENDERS, RELATIONSHIPS } from "@/lib/enums";

export function ProfileEditor({
  profile,
}: {
  profile: {
    name: string;
    uid: string;
    avatarSeed: string;
    headline: string;
    bio: string;
    aboutMe: string;
    gender: string;
    city: string;
    state: string;
    country: string;
    relationship: string;
    lookingFor: string;
    hobbies: string;
    job: string;
    school: string;
    favoriteMus: string;
    quote: string;
    isPublic: boolean;
    birthday: Date | null;
  };
}) {
  const router = useRouter();
  const [seed, setSeed] = useState(profile.avatarSeed);
  const [saved, setSaved] = useState(false);
  const [, startTransition] = useTransition();

  function submit(formData: FormData) {
    setSaved(false);
    startTransition(async () => {
      await updateProfile(formData);
      setSaved(true);
      router.refresh();
    });
  }

  return (
    <form action={submit} className="space-y-5">
      <input type="hidden" name="avatarSeed" value={seed} />

      <div className="flex flex-wrap items-center gap-3">
        <span className="grid h-14 w-14 place-items-center rounded-full border border-cyan/40 bg-cyan/10 font-display text-lg text-cyan">
          {Number(seed) % 360}
        </span>
        <div>
          <p className="text-sm font-semibold">Semente do seu núcleo 3D</p>
          <p className="font-mono text-[11px] text-muted">
            valor atual: {seed} — muda a cor e a geometria do seu avatar
          </p>
        </div>
        <button
          type="button"
          onClick={() => setSeed(String(Math.floor(Math.random() * 360)))}
          className="btn btn-ghost ml-auto px-3 py-1.5 text-[11px]"
        >
          <Shuffle size={13} /> Recalibrar
        </button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Text name="headline" label="Frase de efeito" defaultValue={profile.headline} maxLength={120} wide />
        <Text name="bio" label="Bio curta" defaultValue={profile.bio} maxLength={400} wide />
        <Text name="quote" label="Frase em destaque" defaultValue={profile.quote} maxLength={240} wide />
        <Text name="aboutMe" label="Sobre mim" defaultValue={profile.aboutMe} maxLength={3000} textarea wide />

        <Text name="city" label="Cidade" defaultValue={profile.city} maxLength={60} />
        <Text name="state" label="Estado" defaultValue={profile.state} maxLength={60} />
        <Text name="country" label="País" defaultValue={profile.country} maxLength={60} />
        <Text name="job" label="Trabalho" defaultValue={profile.job} maxLength={120} />
        <Text name="school" label="Escola" defaultValue={profile.school} maxLength={120} />
        <Text name="lookingFor" label="Procuro" defaultValue={profile.lookingFor} maxLength={120} />
        <Text name="hobbies" label="Passatempos" defaultValue={profile.hobbies} maxLength={300} />
        <Text name="favoriteMus" label="Música favorita" defaultValue={profile.favoriteMus} maxLength={300} />

        <div>
          <label className="label">Gênero</label>
          <select name="gender" className="field" defaultValue={profile.gender}>
            <option value="">—</option>
            {GENDERS.map((gender) => (
              <option key={gender} value={gender}>
                {gender}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="label">Relacionamento</label>
          <select name="relationship" className="field" defaultValue={profile.relationship}>
            <option value="">—</option>
            {RELATIONSHIPS.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="label">Nascimento</label>
          <input
            type="date"
            name="birthday"
            className="field"
            defaultValue={profile.birthday ? profile.birthday.toISOString().slice(0, 10) : ""}
          />
        </div>

        <label className="flex items-center gap-2 self-end pb-2 text-sm">
          <input type="checkbox" name="isPublic" className="accent-cyan" defaultChecked={profile.isPublic} />
          Perfil visível na busca
        </label>
      </div>

      <div className="flex items-center gap-3">
        <button type="submit" className="btn btn-primary">
          <Save size={15} /> Salvar perfil
        </button>
        {saved ? <p className="text-sm text-lime">Perfil atualizado.</p> : null}
      </div>
    </form>
  );
}

function Text({
  name,
  label,
  defaultValue,
  maxLength,
  textarea = false,
  wide = false,
}: {
  name: string;
  label: string;
  defaultValue: string;
  maxLength: number;
  textarea?: boolean;
  wide?: boolean;
}) {
  return (
    <div className={wide ? "sm:col-span-2" : ""}>
      <label className="label" htmlFor={name}>
        {label}
      </label>
      {textarea ? (
        <textarea
          id={name}
          name={name}
          className="field min-h-28 resize-y"
          defaultValue={defaultValue}
          maxLength={maxLength}
        />
      ) : (
        <input id={name} name={name} className="field" defaultValue={defaultValue} maxLength={maxLength} />
      )}
    </div>
  );
}
