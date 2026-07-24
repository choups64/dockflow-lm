"use client";

import { useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  CheckCircle2,
  Eye,
  EyeOff,
  LockKeyhole,
  Mail,
  MapPin,
  PackageCheck,
  ShieldCheck,
  Truck,
  Zap,
} from "lucide-react";
import { supabase } from "@/lib/supabase";

export default function LoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  async function handleLogin(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    if (loading) return;

    setLoading(true);
    setError("");

    const { error: loginError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (loginError) {
      setError(loginError.message);
      setLoading(false);
      return;
    }

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setError("Utilisateur introuvable");
      setLoading(false);
      return;
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (!profile) {
      setError("Profil introuvable");
      setLoading(false);
      return;
    }

    if (profile.role === "RR") {
      router.push("/dashboard");
      return;
    }

    if (profile.role === "CARISTE") {
      router.push("/cariste");
      return;
    }

    if (profile.role === "ADMIN") {
      router.push("/dashboard");
      return;
    }

    setLoading(false);
  }

  function handleEnterSubmit(event: React.KeyboardEvent<HTMLInputElement>) {
    if (event.key !== "Enter" || loading) return;

    event.preventDefault();
    event.currentTarget.form?.requestSubmit();
  }

  return (
    <main className="min-h-screen overflow-hidden bg-[#FAFBFC] text-[#101820]">
      <div className="mx-auto grid min-h-screen w-full max-w-[1600px] lg:grid-cols-[minmax(0,58fr)_minmax(0,42fr)]">
        <section className="min-w-0 flex flex-col px-5 py-7 sm:px-10 lg:px-12 lg:py-9 xl:px-16 2xl:px-20">
          <div className="flex items-center gap-4">
            <div className="flex h-[68px] w-[86px] shrink-0 items-center justify-center rounded-2xl bg-white p-2 shadow-[0_8px_24px_rgba(16,24,32,0.07)] ring-1 ring-black/[0.06]">
              <Image
                src="/leroy-merlin-logo.svg"
                alt="Leroy Merlin"
                width={82}
                height={54}
                priority
                className="h-full w-full object-contain"
              />
            </div>
            <h1 className="whitespace-nowrap text-3xl font-black uppercase tracking-[-0.04em] sm:text-4xl">
              <span className="text-[#101820]">Dock</span>
              <span className="text-[#78BE20]">Flow</span>
              <span className="text-[#101820]"> LM</span>
            </h1>
          </div>

          <div className="mt-7 lg:hidden">
            <p className="text-2xl font-black leading-tight tracking-[-0.035em]">
              Pilotez vos arrivages. <span className="text-[#4F8F12]">Fluidifiez les flux.</span>
            </p>
          </div>

          <div className="hidden flex-1 flex-col lg:flex">
            <div className="mt-8 max-w-3xl xl:mt-10">
              <p className="whitespace-nowrap text-[2rem] font-black leading-[1.06] tracking-[-0.05em] xl:text-[2.2rem] 2xl:text-[2.55rem]">
                Pilotez vos arrivages.{" "}
                <span className="text-[#4F8F12]">Fluidifiez les flux.</span>
              </p>
              <p className="mt-4 max-w-2xl text-base leading-7 text-[#66727A] xl:text-lg">
                Une solution simple pour préparer, orienter et réceptionner les arrivages magasin.
              </p>
            </div>

            <div className="relative my-7 min-h-[350px] overflow-hidden rounded-[2rem] border border-[#E7EBEE] bg-white shadow-[0_24px_60px_rgba(16,24,32,0.1)] xl:min-h-[380px] 2xl:min-h-[455px]">
              <Image
                src="/images/dockflow-login-visual.webp"
                alt="Camion Leroy Merlin devant quatre quais logistiques avec palettes et chariot élévateur"
                fill
                priority
                sizes="(min-width: 1024px) 58vw, 0px"
                className="object-cover object-center"
              />
              <div className="absolute inset-0 bg-gradient-to-b from-white/35 via-transparent to-white/10" />

              <svg className="pointer-events-none absolute left-[8%] top-[11%] z-10 h-[42%] w-[84%]" viewBox="0 0 800 180" fill="none" aria-hidden="true">
                <path d="M58 118 C172 22 266 20 370 88 S590 166 742 54" stroke="white" strokeWidth="15" strokeLinecap="round" opacity=".75" />
                <path d="M58 118 C172 22 266 20 370 88 S590 166 742 54" stroke="#78BE20" strokeWidth="6" strokeLinecap="round" />
                {[{ x: 58, y: 118 }, { x: 370, y: 88 }, { x: 742, y: 54 }].map(({ x, y }) => (
                  <g key={`${x}-${y}`}>
                    <circle cx={x} cy={y} r="12" fill="white" />
                    <circle cx={x} cy={y} r="7" fill="#78BE20" />
                  </g>
                ))}
              </svg>

              <div className="absolute inset-x-[4%] top-[8%] z-20 grid grid-cols-3 gap-[9%]">
                {[
                  { label: "ARRIVAGE", icon: Truck, offset: "translate-y-8" },
                  { label: "ORIENTATION", icon: PackageCheck, offset: "-translate-y-1" },
                  { label: "RÉCEPTION", icon: CheckCircle2, offset: "translate-y-5" },
                ].map(({ label, icon: Icon, offset }) => (
                  <div key={label} className={`flex flex-col items-center rounded-2xl border border-white bg-white/95 px-3 py-4 text-center shadow-[0_18px_42px_rgba(16,24,32,0.17)] backdrop-blur-sm ${offset}`}>
                    <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#EEF7E5] text-[#4F8F12]">
                      <Icon size={25} strokeWidth={2.2} aria-hidden="true" />
                    </span>
                    <span className="mt-2.5 text-xs font-black tracking-[0.14em] text-[#263238] xl:text-sm">{label}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-auto grid grid-cols-3">
              {[
                {
                  title: "Préparation rapide",
                  description: "Gagnez du temps et anticipez vos réceptions.",
                  icon: Zap,
                },
                {
                  title: "Destinations claires",
                  description: "Orientez chaque palette vers la bonne destination.",
                  icon: MapPin,
                },
                {
                  title: "Réception simplifiée",
                  description: "Suivez vos arrivages en temps réel et réduisez les erreurs.",
                  icon: CheckCircle2,
                },
              ].map(({ title, description, icon: Icon }) => (
                <article key={title} className="border-r border-[#DDE3E6] px-5 first:pl-0 last:border-r-0 last:pr-0">
                  <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#EEF7E5] text-[#4F8F12]">
                    <Icon size={19} aria-hidden="true" />
                  </span>
                  <h2 className="mt-2.5 text-sm font-black xl:text-base">{title}</h2>
                  <p className="mt-1 text-xs leading-5 text-[#66727A] xl:text-sm">{description}</p>
                </article>
              ))}
            </div>

            <div className="mt-5 flex items-center gap-3 rounded-xl border border-[#D8EAC5] bg-[#F3F9EC] px-5 py-3 text-sm text-[#385F16]">
              <span className="h-2.5 w-2.5 shrink-0 rounded-full bg-[#78BE20] shadow-[0_0_0_5px_rgba(120,190,32,0.16)]" />
              <p><strong>DockFlow LM</strong>, la solution conçue pour les équipes magasin par Leroy Merlin.</p>
            </div>
          </div>
        </section>

        <section className="relative min-w-0 flex items-center justify-center px-5 pb-8 sm:px-10 lg:px-8 lg:py-10 xl:px-10 2xl:px-16">
          <div className="pointer-events-none absolute -right-24 top-[8%] h-72 w-72 rounded-full bg-[#EAF6DD] blur-2xl" />
          <div className="pointer-events-none absolute -bottom-20 left-[10%] h-64 w-64 rounded-full bg-[#F0F7E8] blur-3xl" />
          <div className="pointer-events-none absolute right-[8%] top-[17%] h-20 w-20 rounded-[2rem] border border-[#DDECCB] bg-white/50 rotate-12" />
          <form
            onSubmit={handleLogin}
            className="relative z-10 w-full max-w-[550px] rounded-[1.75rem] border border-[#E7EBEE] bg-white p-6 shadow-[0_32px_90px_rgba(16,24,32,0.12)] sm:p-10 xl:p-12"
          >
            <div className="mx-auto flex w-fit items-center gap-2 rounded-full bg-[#EEF7E5] px-3.5 py-2 text-xs font-black uppercase tracking-[0.12em] text-[#4F8F12]">
              <ShieldCheck size={16} aria-hidden="true" />
              Accès sécurisé
            </div>

            <h2 className="mt-6 text-center text-3xl font-black tracking-[-0.035em] sm:text-4xl">Connexion</h2>
            <p className="mt-2 text-center text-sm leading-6 text-[#66727A] sm:text-base">
              Connectez-vous à votre espace DockFlow.
            </p>

            <div className="mt-9 space-y-6">
              <label className="block text-sm font-bold text-[#263238]">
                Email
                <span className="relative mt-2 block">
                  <Mail
                    size={20}
                    className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[#7B878E]"
                    aria-hidden="true"
                  />
                  <input
                    type="email"
                    placeholder="exemple@leroymerlin.fr"
                    className="min-h-16 w-full rounded-xl border border-[#DCE2E6] bg-[#FAFBFC] py-4 pl-12 pr-4 font-normal text-[#101820] outline-none transition placeholder:text-[#9AA4AA] focus:border-[#78BE20] focus:bg-white focus:ring-4 focus:ring-[#78BE20]/15"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    onKeyDown={handleEnterSubmit}
                    autoComplete="email"
                  />
                </span>
              </label>

              <label className="block text-sm font-bold text-[#263238]">
                Mot de passe
                <span className="relative mt-2 block">
                  <LockKeyhole
                    size={20}
                    className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[#7B878E]"
                    aria-hidden="true"
                  />
                  <input
                    type={showPassword ? "text" : "password"}
                    placeholder="Votre mot de passe"
                    className="min-h-16 w-full rounded-xl border border-[#DCE2E6] bg-[#FAFBFC] py-4 pl-12 pr-12 font-normal text-[#101820] outline-none transition placeholder:text-[#9AA4AA] focus:border-[#78BE20] focus:bg-white focus:ring-4 focus:ring-[#78BE20]/15"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    onKeyDown={handleEnterSubmit}
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((visible) => !visible)}
                    className="absolute right-2 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-lg text-[#66727A] transition hover:bg-[#EEF1F3] hover:text-[#101820] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#78BE20]"
                    aria-label={showPassword ? "Masquer le mot de passe" : "Afficher le mot de passe"}
                    aria-pressed={showPassword}
                  >
                    {showPassword ? <EyeOff size={20} aria-hidden="true" /> : <Eye size={20} aria-hidden="true" />}
                  </button>
                </span>
              </label>
            </div>

            <p className="mt-4 text-right text-sm font-bold text-[#4F8F12]">Mot de passe oublié ?</p>

            {error && (
              <p className="mt-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700" role="alert">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="mt-8 flex min-h-16 w-full items-center justify-center rounded-xl bg-[#78BE20] px-5 text-base font-black text-white shadow-[0_14px_28px_rgba(79,143,18,0.24)] transition hover:bg-[#69A91C] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#78BE20]/30 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? "Connexion..." : "Se connecter"}
            </button>

            <div className="mt-7 rounded-xl bg-[#F5F7F8] px-5 py-4 text-center">
              <p className="text-sm font-black text-[#263238]">Besoin d’aide ?</p>
              <p className="mt-1 text-sm text-[#66727A]">Contactez votre administrateur DockFlow.</p>
            </div>
          </form>
        </section>
      </div>
    </main>
  );
}
