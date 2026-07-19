import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

type StoreAction = "create" | "update" | "toggle" | "delete";

type StorePayload = {
  action: StoreAction;
  id?: string;
  code?: string;
  nom?: string;
  actif?: boolean;
};

function createClients(request: NextRequest) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const token = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "");

  if (!url || !anonKey || !serviceRoleKey) {
    throw new Error("Configuration serveur Supabase incomplète.");
  }

  return {
    auth: createClient(url, anonKey),
    admin: createClient(url, serviceRoleKey),
    token,
  };
}

function normalizeCode(value: string) {
  return value.trim().replace(/\s+/g, "").toUpperCase();
}

function normalizeName(value: string) {
  return value.trim().replace(/\s+/g, " ");
}

async function authorizeNationalAdmin(request: NextRequest) {
  const { auth, admin, token } = createClients(request);
  if (!token) throw new Error("Session administrateur requise.");

  const { data: userData, error: userError } = await auth.auth.getUser(token);
  if (userError || !userData.user) throw new Error("Session administrateur invalide.");

  const { data: profile, error: profileError } = await admin
    .from("profiles")
    .select("id, role, admin_scope, magasin_id, actif")
    .eq("id", userData.user.id)
    .single();

  if (
    profileError ||
    !profile ||
    profile.role !== "ADMIN" ||
    profile.admin_scope !== "NATIONAL" ||
    profile.actif === false
  ) {
    throw new Error("Cette action est réservée aux administrateurs nationaux.");
  }

  return { admin, profile };
}

export async function POST(request: NextRequest) {
  try {
    const payload = (await request.json()) as StorePayload;
    const { admin, profile } = await authorizeNationalAdmin(request);

    if (!payload.action || !["create", "update", "toggle", "delete"].includes(payload.action)) {
      throw new Error("Action magasin invalide.");
    }

    if (payload.action === "create" || payload.action === "update") {
      const code = normalizeCode(payload.code ?? "");
      const nom = normalizeName(payload.nom ?? "");
      if (!code || !nom) throw new Error("Le code et le nom du magasin sont obligatoires.");

      const duplicateQuery = admin.from("magasins").select("id").eq("code", code);
      const { data: duplicates, error: duplicateError } = payload.action === "update" && payload.id
        ? await duplicateQuery.neq("id", payload.id)
        : await duplicateQuery;
      if (duplicateError) throw duplicateError;
      if (duplicates?.length) throw new Error("Ce code magasin existe déjà.");

      if (payload.action === "create") {
        const { data, error } = await admin.from("magasins").insert({ code, nom }).select("id, code, nom, actif").single();
        if (error) throw error;
        return NextResponse.json({ ok: true, magasin: data, message: "Magasin créé." });
      }

      if (!payload.id) throw new Error("Magasin requis.");
      const { data, error } = await admin.from("magasins").update({ code, nom }).eq("id", payload.id).select("id, code, nom, actif").single();
      if (error) throw error;
      return NextResponse.json({ ok: true, magasin: data, message: "Magasin modifié." });
    }

    if (!payload.id) throw new Error("Magasin requis.");
    const { data: store, error: storeError } = await admin.from("magasins").select("id, code, actif").eq("id", payload.id).single();
    if (storeError || !store) throw storeError ?? new Error("Magasin introuvable.");

    if (payload.action === "toggle") {
      if (typeof payload.actif !== "boolean") throw new Error("Statut magasin invalide.");
      if (payload.id === profile.magasin_id) throw new Error("Vous ne pouvez pas désactiver votre magasin principal.");

      if (!payload.actif) {
        const { count, error: activeStoresError } = await admin.from("magasins").select("id", { count: "exact", head: true }).eq("actif", true);
        if (activeStoresError) throw activeStoresError;
        if ((count ?? 0) <= 1) throw new Error("Le dernier magasin actif ne peut pas être désactivé.");
      }

      const { error } = await admin.from("magasins").update({ actif: payload.actif }).eq("id", payload.id);
      if (error) throw error;
      return NextResponse.json({ ok: true, message: payload.actif ? "Magasin réactivé." : "Magasin désactivé." });
    }

    if (store.code === "LM_LOCAL") throw new Error("Le magasin pilote LM_LOCAL ne peut pas être supprimé.");
    if (payload.id === profile.magasin_id) throw new Error("Vous ne pouvez pas supprimer votre magasin principal.");
    const [profiles, rayons, destinations, arrivages] = await Promise.all([
      admin.from("profiles").select("id", { count: "exact", head: true }).eq("magasin_id", payload.id),
      admin.from("rayons").select("id", { count: "exact", head: true }).eq("magasin_id", payload.id),
      admin.from("destinations").select("id", { count: "exact", head: true }).eq("magasin_id", payload.id),
      admin.from("arrivages").select("id", { count: "exact", head: true }).eq("magasin_id", payload.id),
    ]);
    const usageError = profiles.error || rayons.error || destinations.error || arrivages.error;
    if (usageError) throw usageError;
    if ((profiles.count ?? 0) + (rayons.count ?? 0) + (destinations.count ?? 0) + (arrivages.count ?? 0) > 0) {
      throw new Error("Ce magasin contient des données et ne peut pas être supprimé. Utilisez le bouton Désactiver pour conserver son historique.");
    }

    const { error } = await admin.from("magasins").delete().eq("id", payload.id);
    if (error) throw error;
    return NextResponse.json({ ok: true, message: "Magasin supprimé définitivement." });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Erreur serveur." },
      { status: 400 },
    );
  }
}
