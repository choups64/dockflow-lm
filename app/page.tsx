"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { ProfileService } from "@/services/profile";

export default function Home() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const connexion = async () => {
    setLoading(true);
    setError("");

    try {
      const { error: loginError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (loginError) {
        setError(loginError.message);
        return;
      }

      const utilisateur = await ProfileService.getCurrentProfile();

      if (utilisateur.role === "CARISTE") {
      router.push("/cariste");
      return;
    }

      if (utilisateur.role === "RR") {
      router.push("/dashboard");
      return;
    }

      if (utilisateur.role === "ADMIN") {
        router.push("/admin");
        return;
      }

      setError("Rôle utilisateur non reconnu.");
    } catch (connexionError) {
      console.error("Impossible de charger le profil Supabase", connexionError);
      setError("Impossible de charger votre profil.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#0F172A] flex items-center justify-center p-6">

      <div className="w-full max-w-md bg-[#111827] rounded-3xl shadow-2xl overflow-hidden">

        <div className="bg-gradient-to-r from-[#78BE20] to-[#5F9C18] p-8">

          <h1 className="text-4xl font-black text-white text-center">
            DockFlow LM
          </h1>

          <p className="text-center text-white/80 mt-2">
            Connexion
          </p>

        </div>

        <div className="p-8 space-y-5">

          <input
            type="email"
            placeholder="Adresse e-mail"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-xl p-4 bg-slate-800 text-white border border-slate-700"
          />

          <input
            type="password"
            placeholder="Mot de passe"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded-xl p-4 bg-slate-800 text-white border border-slate-700"
          />

          {error && (
            <p className="text-red-400 text-sm">
              {error}
            </p>
          )}

          <button
            onClick={connexion}
            disabled={loading}
            className="w-full bg-[#78BE20] hover:bg-[#6BAA1C] text-white font-bold rounded-xl p-4 transition"
          >
            {loading ? "Connexion..." : "Se connecter"}
          </button>

        </div>

      </div>

    </main>
  );
}
