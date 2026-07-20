import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

type DestinationPayload = {
  code?: string;
  nom?: string;
  magasinId?: string | null;
  actif?: boolean;
};

function createClients(request: NextRequest) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const token = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
  if (!url || !anonKey || !serviceRoleKey) throw new Error("Configuration serveur Supabase incomplète.");
  return { auth: createClient(url, anonKey), admin: createClient(url, serviceRoleKey), token };
}

function normalizeDestinationCode(value: string) {
  return value
    .trim()
    .toUpperCase()
    .replace(/\s+/g, "_")
    .replace(/[^A-Z0-9_]/g, "");
}

export async function POST(request: NextRequest) {
  try {
    const { auth, admin, token } = createClients(request);
    if (!token) throw new Error("Session administrateur requise.");

    const { data: userData, error: userError } = await auth.auth.getUser(token);
    if (userError || !userData.user) throw new Error("Session administrateur invalide.");

    const { data: profile, error: profileError } = await admin
      .from("profiles")
      .select("id, role, admin_scope, magasin_id, actif")
      .eq("id", userData.user.id)
      .single();
    if (profileError || !profile || profile.role !== "ADMIN" || profile.actif === false) {
      throw new Error("Cette action est réservée aux administrateurs actifs.");
    }

    const payload = (await request.json()) as DestinationPayload;
    const code = normalizeDestinationCode(payload.code ?? "");
    const nom = (payload.nom ?? "").trim().replace(/\s+/g, " ");
    const magasinId = typeof payload.magasinId === "string" && payload.magasinId ? payload.magasinId : null;
    if (!code) throw new Error("Le code de la destination est obligatoire et doit contenir une lettre, un chiffre ou un underscore.");
    if (!nom) throw new Error("Le nom de la destination est obligatoire.");
    if (typeof payload.actif !== "boolean") throw new Error("Le statut de la destination est invalide.");
    if (profile.admin_scope !== "NATIONAL" && magasinId !== profile.magasin_id) {
      throw new Error("Vous ne pouvez créer une destination que dans votre magasin.");
    }

    if (magasinId) {
      const { data: magasin, error: magasinError } = await admin.from("magasins").select("id").eq("id", magasinId).maybeSingle();
      if (magasinError) throw magasinError;
      if (!magasin) throw new Error("Le magasin sélectionné est introuvable.");
    } else if (profile.admin_scope !== "NATIONAL") {
      throw new Error("Seul un administrateur national peut créer une destination nationale.");
    }

    let duplicateQuery = admin.from("destinations").select("id").eq("code", code);
    duplicateQuery = magasinId ? duplicateQuery.eq("magasin_id", magasinId) : duplicateQuery.is("magasin_id", null);
    const { data: duplicates, error: duplicateError } = await duplicateQuery.limit(1);
    if (duplicateError) throw duplicateError;
    if (duplicates?.length) throw new Error("Ce code de destination existe déjà pour ce périmètre.");

    const { data, error } = await admin
      .from("destinations")
      .insert({ code, nom, magasin_id: magasinId, actif: payload.actif })
      .select("id, code, nom, magasin_id, actif")
      .single();
    if (error?.code === "23505") throw new Error("Ce code de destination existe déjà pour ce périmètre.");
    if (error) throw error;

    return NextResponse.json({ ok: true, destination: data, message: "Destination créée avec succès." }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Erreur serveur." }, { status: 400 });
  }
}

type DestinationUpdatePayload = {
  id?: number;
  code?: string;
  nom?: string;
  magasinId?: string | null;
};

export async function PATCH(request: NextRequest) {
  try {
    const { auth, admin, token } = createClients(request);
    if (!token) return NextResponse.json({ error: "Session administrateur requise." }, { status: 401 });

    const { data: userData, error: userError } = await auth.auth.getUser(token);
    if (userError || !userData.user) return NextResponse.json({ error: "Session administrateur invalide." }, { status: 401 });

    const { data: profile, error: profileError } = await admin
      .from("profiles")
      .select("id, role, admin_scope, magasin_id, actif")
      .eq("id", userData.user.id)
      .single();
    if (profileError) throw profileError;
    if (!profile || profile.role !== "ADMIN" || profile.actif === false) {
      return NextResponse.json({ error: "Cette action est réservée aux administrateurs actifs." }, { status: 403 });
    }

    const payload = (await request.json()) as DestinationUpdatePayload;
    if (!Number.isInteger(payload.id) || (payload.id ?? 0) <= 0) {
      return NextResponse.json({ error: "Destination invalide." }, { status: 400 });
    }

    const code = normalizeDestinationCode(payload.code ?? "");
    const nom = (payload.nom ?? "").trim().replace(/\s+/g, " ");
    const magasinId = typeof payload.magasinId === "string" && payload.magasinId ? payload.magasinId : null;
    if (!code) return NextResponse.json({ error: "Le code de la destination est obligatoire et doit contenir une lettre, un chiffre ou un underscore." }, { status: 400 });
    if (!nom) return NextResponse.json({ error: "Le nom de la destination est obligatoire." }, { status: 400 });

    const { data: destination, error: destinationError } = await admin
      .from("destinations")
      .select("id, magasin_id")
      .eq("id", payload.id!)
      .maybeSingle();
    if (destinationError) throw destinationError;
    if (!destination) return NextResponse.json({ error: "Destination introuvable." }, { status: 404 });

    if (profile.admin_scope !== "NATIONAL" && (destination.magasin_id !== profile.magasin_id || magasinId !== profile.magasin_id)) {
      return NextResponse.json({ error: "Vous ne pouvez modifier que les destinations de votre magasin." }, { status: 403 });
    }

    if (magasinId) {
      const { data: magasin, error: magasinError } = await admin.from("magasins").select("id").eq("id", magasinId).maybeSingle();
      if (magasinError) throw magasinError;
      if (!magasin) return NextResponse.json({ error: "Le magasin sélectionné est introuvable." }, { status: 400 });
    } else if (profile.admin_scope !== "NATIONAL") {
      return NextResponse.json({ error: "Seul un administrateur national peut gérer une destination nationale." }, { status: 403 });
    }

    let duplicateQuery = admin.from("destinations").select("id").eq("code", code).neq("id", payload.id!);
    duplicateQuery = magasinId ? duplicateQuery.eq("magasin_id", magasinId) : duplicateQuery.is("magasin_id", null);
    const { data: duplicates, error: duplicateError } = await duplicateQuery.limit(1);
    if (duplicateError) throw duplicateError;
    if (duplicates?.length) return NextResponse.json({ error: "Ce code de destination existe déjà pour ce périmètre." }, { status: 409 });

    const { data, error } = await admin
      .from("destinations")
      .update({ code, nom, magasin_id: magasinId })
      .eq("id", payload.id!)
      .select("id, code, nom, magasin_id, actif")
      .maybeSingle();
    if (error?.code === "23505") return NextResponse.json({ error: "Ce code de destination existe déjà pour ce périmètre." }, { status: 409 });
    if (error) throw error;
    if (!data) return NextResponse.json({ error: "Destination introuvable." }, { status: 404 });

    return NextResponse.json({ ok: true, destination: data, message: "Destination modifiée avec succès." });
  } catch (error) {
    console.error("Échec de la modification d’une destination", error);
    return NextResponse.json({ error: "Une erreur inattendue empêche la modification de la destination." }, { status: 500 });
  }
}
