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
    <main className="min-h-screen bg-[#F6F7F9] text-[#101820]">
      <div className="mx-auto grid min-h-screen w-full max-w-[1600px] lg:grid-cols-[minmax(0,3fr)_minmax(420px,2fr)]">
        <section className="flex flex-col px-6 py-8 sm:px-10 lg:px-12 lg:py-10 xl:px-16">
          <div className="flex items-center gap-4">
            <div className="flex h-16 w-20 shrink-0 items-center justify-center rounded-2xl bg-white p-2 shadow-sm ring-1 ring-black/[0.05]">
              <Image
                src="/leroy-merlin-logo.svg"
                alt="Leroy Merlin"
                width={76}
                height={48}
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

          <div className="hidden flex-1 flex-col lg:flex">
            <div className="mt-10 max-w-2xl xl:mt-12">
              <p className="text-4xl font-black leading-[1.08] tracking-[-0.045em] xl:text-5xl">
                Pilotez vos arrivages.{" "}
                <span className="text-[#4F8F12]">Fluidifiez les flux.</span>
              </p>
              <p className="mt-5 max-w-xl text-base leading-7 text-[#66727A] xl:text-lg">
                Une solution simple pour préparer, orienter et réceptionner les arrivages magasin.
              </p>
            </div>

            <div className="relative my-8 min-h-[270px] overflow-hidden rounded-[2rem] border border-white bg-[#E9ECEF] p-6 shadow-[0_20px_50px_rgba(16,24,32,0.08)] xl:min-h-[300px] xl:p-8">
              <div className="absolute inset-x-0 bottom-0 h-[38%] bg-[#DDE1E4]" />
              <div className="absolute inset-x-0 bottom-[38%] h-px bg-[#C7CDD1]" />
              <div className="absolute left-[7%] top-[18%] h-24 w-28 rounded-t-lg border-x-4 border-t-4 border-[#B7BEC3] bg-[#F6F7F9]/70" />
              <div className="absolute right-[8%] top-[14%] grid grid-cols-3 gap-1.5 opacity-70">
                {Array.from({ length: 9 }).map((_, index) => (
                  <span key={index} className="h-7 w-10 rounded-sm border border-[#C6A874] bg-[#D7BB86]" />
                ))}
              </div>
              <div className="absolute bottom-[18%] left-[10%] h-2 w-[80%] rounded-full bg-[#B9C0C4]" />
              <div className="absolute bottom-[14%] left-[15%] h-1.5 w-[70%] rounded-full bg-[#C8CDD0]" />

              <div className="relative z-10 grid h-full grid-cols-3 items-center gap-4 pt-5">
                {[
                  { label: "ARRIVAGE", icon: Truck },
                  { label: "ORIENTATION", icon: PackageCheck },
                  { label: "RÉCEPTION", icon: CheckCircle2 },
                ].map(({ label, icon: Icon }, index) => (
                  <div key={label} className="relative flex items-center">
                    <div className="relative z-10 flex w-full flex-col items-center rounded-2xl border border-white bg-white/95 px-3 py-5 text-center shadow-[0_14px_35px_rgba(16,24,32,0.12)] backdrop-blur">
                      <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#EEF7E5] text-[#4F8F12]">
                        <Icon size={25} strokeWidth={2.2} aria-hidden="true" />
                      </span>
                      <span className="mt-3 text-xs font-black tracking-[0.15em] text-[#263238] xl:text-sm">
                        {label}
                      </span>
                    </div>
                    {index < 2 && (
                      <div className="absolute left-[calc(100%-0.25rem)] top-1/2 z-0 h-1 w-[calc(1rem+0.5rem)] -translate-y-1/2 bg-[#78BE20] xl:w-[calc(1rem+1rem)]">
                        <span className="absolute -right-1 -top-1.5 h-4 w-4 rotate-45 border-r-4 border-t-4 border-[#78BE20]" />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-auto grid grid-cols-3 gap-3 xl:gap-4">
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
                  description: "Suivez vos arrivages et réduisez les erreurs.",
                  icon: CheckCircle2,
                },
              ].map(({ title, description, icon: Icon }) => (
                <article key={title} className="rounded-2xl border border-[#E3E8EC] bg-white p-4 shadow-sm xl:p-5">
                  <Icon size={21} className="text-[#4F8F12]" aria-hidden="true" />
                  <h2 className="mt-3 text-sm font-black xl:text-base">{title}</h2>
                  <p className="mt-1.5 text-xs leading-5 text-[#66727A] xl:text-sm">{description}</p>
                </article>
              ))}
            </div>

            <div className="mt-4 flex items-center gap-3 rounded-2xl border border-[#D8EAC5] bg-[#EEF7E5] px-5 py-3 text-sm text-[#385F16]">
              <span className="h-2.5 w-2.5 shrink-0 rounded-full bg-[#78BE20] shadow-[0_0_0_5px_rgba(120,190,32,0.16)]" />
              <p><strong>DockFlow LM</strong>, la solution conçue pour les équipes magasin.</p>
            </div>
          </div>
        </section>

        <section className="flex items-center justify-center px-5 pb-8 sm:px-10 lg:bg-[#EEF0F2] lg:px-10 lg:py-10 xl:px-14">
          <form
            onSubmit={handleLogin}
            className="w-full max-w-[500px] rounded-[2rem] border border-white bg-white p-6 shadow-[0_30px_80px_rgba(16,24,32,0.13)] sm:p-9 xl:p-11"
          >
            <div className="inline-flex items-center gap-2 rounded-full bg-[#EEF7E5] px-3.5 py-2 text-xs font-black uppercase tracking-[0.12em] text-[#4F8F12]">
              <ShieldCheck size={16} aria-hidden="true" />
              Accès sécurisé
            </div>

            <h2 className="mt-6 text-3xl font-black tracking-[-0.035em] sm:text-4xl">Connexion</h2>
            <p className="mt-2 text-sm leading-6 text-[#66727A] sm:text-base">
              Connectez-vous à votre espace DockFlow.
            </p>

            <div className="mt-8 space-y-5">
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
                    className="min-h-14 w-full rounded-xl border border-[#DCE2E6] bg-[#FAFBFC] py-3 pl-12 pr-4 font-normal text-[#101820] outline-none transition placeholder:text-[#9AA4AA] focus:border-[#78BE20] focus:bg-white focus:ring-4 focus:ring-[#78BE20]/15"
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
                    className="min-h-14 w-full rounded-xl border border-[#DCE2E6] bg-[#FAFBFC] py-3 pl-12 pr-12 font-normal text-[#101820] outline-none transition placeholder:text-[#9AA4AA] focus:border-[#78BE20] focus:bg-white focus:ring-4 focus:ring-[#78BE20]/15"
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

            {error && (
              <p className="mt-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700" role="alert">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="mt-7 flex min-h-14 w-full items-center justify-center rounded-xl bg-[#78BE20] px-5 text-base font-black text-white shadow-[0_12px_25px_rgba(79,143,18,0.22)] transition hover:bg-[#69A91C] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#78BE20]/30 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? "Connexion..." : "Se connecter"}
            </button>

            <div className="mt-7 border-t border-[#E8ECEF] pt-6 text-center">
              <p className="text-sm font-black text-[#263238]">Besoin d’aide ?</p>
              <p className="mt-1 text-sm text-[#66727A]">Contactez votre administrateur DockFlow.</p>
            </div>
          </form>
        </section>
      </div>
    </main>
  );
}
