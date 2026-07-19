import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

function createClients(request: NextRequest) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const token = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
  if (!url || !anonKey || !serviceRoleKey) throw new Error("Configuration serveur Supabase incomplète.");
  return { auth: createClient(url, anonKey), admin: createClient(url, serviceRoleKey), token };
}

export async function POST(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;
    const { auth, admin, token } = createClients(request);
    if (!token) throw new Error("Session requise.");
    const { data: userData, error: userError } = await auth.auth.getUser(token);
    if (userError || !userData.user) throw new Error("Session invalide.");

    const { data: profile, error: profileError } = await admin
      .from("profiles")
      .select("role, magasin_id, actif")
      .eq("id", userData.user.id)
      .single();
    if (profileError || !profile || profile.role !== "CARISTE" || profile.actif === false) {
      throw new Error("Vous n’êtes pas autorisé à réceptionner cette commande.");
    }

    const { data: arrivage, error: arrivageError } = await admin
      .from("arrivages")
      .select("id, magasin_id, statut")
      .eq("id", id)
      .single();
    if (arrivageError || !arrivage) throw new Error("Commande introuvable.");
    if (arrivage.magasin_id !== profile.magasin_id) throw new Error("Vous n’êtes pas autorisé à réceptionner cette commande.");
    if (arrivage.statut !== "PRET_A_RECEVOIR") throw new Error("Cette commande n’est pas prête à être réceptionnée.");

    const { data: updated, error: updateError } = await admin
      .from("arrivages")
      .update({ statut: "RECEPTIONNEE", updated_at: new Date().toISOString() })
      .eq("id", id)
      .eq("magasin_id", profile.magasin_id)
      .eq("statut", "PRET_A_RECEVOIR")
      .select("id, statut")
      .maybeSingle();
    if (updateError) throw updateError;
    if (!updated) throw new Error("Cette commande a déjà été réceptionnée ou son statut a changé.");

    return NextResponse.json({ ok: true, arrivage: updated });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Erreur serveur." }, { status: 400 });
  }
}
