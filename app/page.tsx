"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { users } from "@/lib/users";

export default function Home() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const connexion = () => {
    const utilisateur = users.find(
      (u) => u.email === email && u.password === password
    );

    if (!utilisateur) {
      setError("Email ou mot de passe incorrect.");
      return;
    }

    localStorage.setItem(
      "user",
      JSON.stringify({
        prenom: utilisateur.prenom,
        nom: utilisateur.nom,
        email: utilisateur.email,
        role: utilisateur.role,
        rayon: utilisateur.rayon ?? "",
        libelleRayon: utilisateur.libelleRayon ?? "",
      })
    );

    if (utilisateur.role === "cariste") {
      router.push("/cariste");
    } else if (utilisateur.role === "rr") {
      router.push("/dashboard");
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
            className="w-full bg-[#78BE20] hover:bg-[#6BAA1C] text-white font-bold rounded-xl p-4 transition"
          >
            Se connecter
          </button>

        </div>

      </div>

    </main>
  );
}