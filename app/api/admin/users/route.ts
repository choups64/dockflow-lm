import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const roles = ["RR", "CARISTE", "ADMIN"] as const;
type Role = (typeof roles)[number];

function clients(request: NextRequest) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !anon || !serviceKey) throw new Error("Configuration serveur Supabase incomplète.");
  const token = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
  return { auth: createClient(url, anon), admin: createClient(url, serviceKey), token };
}

async function authorize(request: NextRequest) {
  const { auth, admin, token } = clients(request);
  if (!token) throw new Error("Session administrateur requise.");
  const { data: userData, error: userError } = await auth.auth.getUser(token);
  if (userError || !userData.user) throw new Error("Session administrateur invalide.");
  const { data: profile, error } = await admin.from("profiles").select("id, role, admin_scope, magasin_id, actif").eq("id", userData.user.id).single();
  if (error || !profile || profile.role !== "ADMIN" || profile.actif === false) throw new Error("Droits administrateur insuffisants.");
  return { admin, profile };
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json() as { action: "create" | "toggle" | "reset"; email?: string; password?: string; role?: Role; magasinId?: string | null; rayonIds?: number[]; adminScope?: "MAGASIN" | "NATIONAL" | null; userId?: string; actif?: boolean };
    const { admin, profile } = await authorize(request);
    if (body.action === "reset") { if (!body.email) throw new Error("E-mail requis."); await admin.auth.resetPasswordForEmail(body.email); return NextResponse.json({ ok: true }); }
    if (body.action === "toggle") { if (!body.userId || typeof body.actif !== "boolean") throw new Error("Utilisateur requis."); if (body.userId === profile.id) throw new Error("Vous ne pouvez pas désactiver votre propre compte."); await admin.from("profiles").update({ actif: body.actif }).eq("id", body.userId); return NextResponse.json({ ok: true }); }
    if (!body.email || !body.password || body.password.length < 8 || !body.role || !roles.includes(body.role)) throw new Error("Données utilisateur invalides.");
    if (body.role !== "ADMIN" && !body.magasinId) throw new Error("Magasin obligatoire.");
    if (profile.admin_scope !== "NATIONAL" && (body.magasinId !== profile.magasin_id || body.adminScope === "NATIONAL")) throw new Error("Vous ne pouvez administrer que votre magasin.");
    if (body.role === "RR" && !(body.rayonIds?.length)) throw new Error("Au moins un rayon est requis pour un RR.");
    const { data: created, error: createError } = await admin.auth.admin.createUser({ email: body.email, password: body.password, email_confirm: true });
    if (createError || !created.user) throw createError ?? new Error("Création Auth impossible.");
    const { error: profileError } = await admin.from("profiles").insert({ id: created.user.id, email: body.email, role: body.role, magasin_id: body.magasinId, admin_scope: body.role === "ADMIN" ? body.adminScope : null, actif: true });
    if (profileError) { await admin.auth.admin.deleteUser(created.user.id); throw profileError; }
    if (body.role === "RR" && body.rayonIds?.length) { const { error: rayonsError } = await admin.from("profile_rayons").insert(body.rayonIds.map((rayon_id) => ({ profile_id: created.user!.id, rayon_id }))); if (rayonsError) throw rayonsError; }
    return NextResponse.json({ ok: true, id: created.user.id });
  } catch (error) { return NextResponse.json({ error: error instanceof Error ? error.message : "Erreur serveur." }, { status: 400 }); }
}
