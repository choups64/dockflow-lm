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

export async function DELETE(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;
    const { auth, admin, token } = createClients(request);
    if (!token) throw new Error("Session requise.");

    const { data: userData, error: userError } = await auth.auth.getUser(token);
    if (userError || !userData.user) throw new Error("Session invalide.");

    const { data: profile, error: profileError } = await admin
      .from("profiles")
      .select("id, role, admin_scope, magasin_id, actif")
      .eq("id", userData.user.id)
      .single();
    if (profileError || !profile || profile.actif === false || !["RR", "ADMIN"].includes(profile.role)) {
      throw new Error("Vous n’êtes pas autorisé à supprimer cet arrivage.");
    }

    const { data: arrivage, error: arrivageError } = await admin
      .from("arrivages")
      .select("id, magasin_id, rayon_id")
      .eq("id", id)
      .single();
    if (arrivageError || !arrivage) throw new Error("Arrivage introuvable ou déjà supprimé.");

    const canAccessStore = profile.magasin_id === arrivage.magasin_id || (profile.role === "ADMIN" && profile.admin_scope === "NATIONAL");
    if (!canAccessStore) throw new Error("Vous n’êtes pas autorisé à supprimer cet arrivage.");

    if (profile.role === "RR") {
      const { data: assignment, error: assignmentError } = await admin
        .from("profile_rayons")
        .select("rayon_id")
        .eq("profile_id", profile.id)
        .eq("rayon_id", arrivage.rayon_id)
        .maybeSingle();
      if (assignmentError || !assignment) throw new Error("Vous n’êtes pas autorisé à supprimer cet arrivage.");
    }

    const [destinationsResult, lignesResult] = await Promise.all([
      admin.from("arrivage_destinations").delete({ count: "exact" }).eq("arrivage_id", id),
      admin.from("arrivage_lignes").delete({ count: "exact" }).eq("arrivage_id", id),
    ]);
    if (destinationsResult.error) throw destinationsResult.error;
    if (lignesResult.error) throw lignesResult.error;

    const { data: deleted, error: deleteError } = await admin
      .from("arrivages")
      .delete()
      .eq("id", id)
      .select("id");
    if (deleteError) throw deleteError;
    if (!deleted?.length) throw new Error("Arrivage introuvable ou déjà supprimé.");

    return NextResponse.json({
      ok: true,
      id,
      deletedCount: deleted.length,
      destinationsDeleted: destinationsResult.count ?? 0,
      lignesDeleted: lignesResult.count ?? 0,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erreur serveur lors de la suppression.";
    const code = typeof error === "object" && error && "code" in error && typeof error.code === "string" ? error.code : undefined;
    return NextResponse.json({ error: message, code }, { status: 400 });
  }
}
