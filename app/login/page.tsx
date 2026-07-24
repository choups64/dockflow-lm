"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function LoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

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
    <main className="min-h-screen bg-slate-100 flex items-center justify-center">

      <form
        onSubmit={handleLogin}
        className="bg-white rounded-3xl shadow-xl p-10 w-full max-w-md"
      >
        <h1 className="text-4xl font-bold text-center mb-2">
          DockFlow LM
        </h1>

        <p className="text-center text-slate-500 mb-8">
          Connexion
        </p>

        <input
          type="email"
          placeholder="Adresse email"
          className="w-full border rounded-xl p-4 mb-4"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          onKeyDown={handleEnterSubmit}
        />

        <input
          type="password"
          placeholder="Mot de passe"
          className="w-full border rounded-xl p-4 mb-6"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          onKeyDown={handleEnterSubmit}
        />

        {error && (
          <p className="text-red-600 mb-4">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-[#78BE20] text-white font-bold rounded-xl p-4 hover:bg-green-700 transition"
        >
          {loading ? "Connexion..." : "Se connecter"}
        </button>
      </form>

    </main>
  );
}
