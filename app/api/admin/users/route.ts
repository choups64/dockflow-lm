import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const roles = ["RR", "CARISTE", "ADMIN"] as const;
type Role = (typeof roles)[number];
type AdminScope = "MAGASIN" | "NATIONAL";
type UserAction = "create" | "update" | "toggle" | "delete" | "reset";

type UserPayload = {
  action: UserAction;
  userId?: string;
  email?: string;
  password?: string;
  role?: Role;
  magasinId?: string | null;
  rayonIds?: number[];
  adminScope?: AdminScope | null;
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

type AdminClient = ReturnType<typeof createClients>["admin"];

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

async function authorize(request: NextRequest) {
  const { auth, admin, token } = createClients(request);
  if (!token) throw new Error("Session administrateur requise.");
  const { data: userData, error: userError } = await auth.auth.getUser(token);
  if (userError || !userData.user) throw new Error("Session administrateur invalide.");
  const { data: profile, error } = await admin
    .from("profiles")
    .select("id, role, admin_scope, magasin_id, actif")
    .eq("id", userData.user.id)
    .single();
  if (error || !profile || profile.role !== "ADMIN" || profile.actif === false) {
    throw new Error("Droits administrateur insuffisants.");
  }
  return { admin, profile };
}

async function getTarget(admin: AdminClient, userId: string) {
  const { data, error } = await admin
    .from("profiles")
    .select("id, email, role, admin_scope, magasin_id, actif")
    .eq("id", userId)
    .single();
  if (error || !data) throw error ?? new Error("Utilisateur introuvable.");
  return data;
}

function assertScope(caller: { admin_scope: string | null; magasin_id: string | null }, targetStoreId: string | null) {
  if (caller.admin_scope !== "NATIONAL" && targetStoreId !== caller.magasin_id) {
    throw new Error("Vous ne pouvez administrer que les utilisateurs de votre magasin.");
  }
}

function isNationalAdmin(user: { role: string; admin_scope: string | null; actif: boolean }) {
  return user.role === "ADMIN" && user.admin_scope === "NATIONAL" && user.actif;
}

async function assertNotLastNationalAdmin(
  admin: AdminClient,
  current: { role: string; admin_scope: string | null; actif: boolean },
  next: { role: string; admin_scope: string | null; actif: boolean },
) {
  if (!isNationalAdmin(current) || isNationalAdmin(next)) return;
  const { count, error } = await admin
    .from("profiles")
    .select("id", { count: "exact", head: true })
    .eq("role", "ADMIN")
    .eq("admin_scope", "NATIONAL")
    .eq("actif", true);
  if (error) throw error;
  if ((count ?? 0) <= 1) throw new Error("Le dernier ADMIN NATIONAL ne peut pas être modifié, désactivé ou supprimé.");
}

async function validateUserData(
  admin: AdminClient,
  caller: { admin_scope: string | null; magasin_id: string | null },
  body: UserPayload,
) {
  const email = normalizeEmail(body.email ?? "");
  const role = body.role;
  const magasinId = body.magasinId ?? null;
  const adminScope = body.adminScope ?? null;
  const rayonIds = [...new Set((body.rayonIds ?? []).filter(Number.isInteger))];

  if (!email || !role || !roles.includes(role) || !magasinId) throw new Error("E-mail, rôle et magasin sont obligatoires.");
  if (role === "ADMIN" && !adminScope) throw new Error("Le périmètre d’un ADMIN est obligatoire.");
  if (role !== "ADMIN" && adminScope) throw new Error("Le périmètre administrateur est réservé aux ADMIN.");
  if (role === "RR" && rayonIds.length === 0) throw new Error("Au moins un rayon est requis pour un RR.");
  if (role !== "RR" && rayonIds.length > 0) throw new Error("Les rayons sont réservés aux responsables de rayon.");
  if (caller.admin_scope !== "NATIONAL" && (magasinId !== caller.magasin_id || adminScope === "NATIONAL")) {
    throw new Error("Vous ne pouvez administrer que votre magasin.");
  }

  const { data: store, error: storeError } = await admin.from("magasins").select("id").eq("id", magasinId).single();
  if (storeError || !store) throw new Error("Magasin introuvable.");

  if (rayonIds.length > 0) {
    const { data: rayons, error: rayonsError } = await admin.from("rayons").select("id").eq("magasin_id", magasinId).in("id", rayonIds);
    if (rayonsError) throw rayonsError;
    if ((rayons ?? []).length !== rayonIds.length) throw new Error("Un rayon sélectionné n’appartient pas au magasin choisi.");
  }

  return { email, role, magasinId, adminScope: role === "ADMIN" ? adminScope : null, rayonIds };
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as UserPayload;
    const { admin, profile: caller } = await authorize(request);
    if (!body.action || !["create", "update", "toggle", "delete", "reset"].includes(body.action)) throw new Error("Action utilisateur invalide.");

    if (body.action === "reset") {
      if (!body.userId) throw new Error("Utilisateur requis.");
      const target = await getTarget(admin, body.userId);
      assertScope(caller, target.magasin_id);
      const { error } = await admin.auth.resetPasswordForEmail(target.email);
      if (error) throw error;
      return NextResponse.json({ ok: true, message: "E-mail de réinitialisation envoyé." });
    }

    if (body.action === "create") {
      if (!body.password || body.password.length < 8) throw new Error("Le mot de passe temporaire doit contenir au moins 8 caractères.");
      const values = await validateUserData(admin, caller, body);
      const { data: created, error: createError } = await admin.auth.admin.createUser({ email: values.email, password: body.password, email_confirm: true });
      if (createError || !created.user) throw createError ?? new Error("Création Auth impossible.");
      const { error: profileError } = await admin.from("profiles").insert({ id: created.user.id, email: values.email, role: values.role, magasin_id: values.magasinId, admin_scope: values.adminScope, actif: true });
      if (profileError) { await admin.auth.admin.deleteUser(created.user.id); throw profileError; }
      if (values.rayonIds.length) {
        const { error: rayonsError } = await admin.from("profile_rayons").insert(values.rayonIds.map((rayonId) => ({ profile_id: created.user.id, rayon_id: rayonId })));
        if (rayonsError) {
          await admin.from("profiles").delete().eq("id", created.user.id);
          await admin.auth.admin.deleteUser(created.user.id);
          throw rayonsError;
        }
      }
      return NextResponse.json({ ok: true, message: "Utilisateur créé." });
    }

    if (!body.userId) throw new Error("Utilisateur requis.");
    const target = await getTarget(admin, body.userId);
    assertScope(caller, target.magasin_id);

    if (body.action === "toggle") {
      if (typeof body.actif !== "boolean") throw new Error("Statut utilisateur invalide.");
      if (target.id === caller.id) throw new Error("Vous ne pouvez pas désactiver votre propre compte.");
      await assertNotLastNationalAdmin(admin, target, { ...target, actif: body.actif });
      const { error } = await admin.from("profiles").update({ actif: body.actif }).eq("id", target.id);
      if (error) throw error;
      return NextResponse.json({ ok: true, message: body.actif ? "Utilisateur réactivé." : "Utilisateur désactivé." });
    }

    if (body.action === "delete") {
      if (target.id === caller.id) throw new Error("Vous ne pouvez pas supprimer votre propre compte.");
      await assertNotLastNationalAdmin(admin, target, { ...target, actif: false });
      const { error: rayonsError } = await admin.from("profile_rayons").delete().eq("profile_id", target.id);
      if (rayonsError) throw rayonsError;
      const { error: authError } = await admin.auth.admin.deleteUser(target.id);
      if (authError) throw authError;
      const { error: profileError } = await admin.from("profiles").delete().eq("id", target.id);
      if (profileError) throw profileError;
      return NextResponse.json({ ok: true, message: "Utilisateur supprimé définitivement." });
    }

    const values = await validateUserData(admin, caller, body);
    if (target.id === caller.id && (target.role !== values.role || target.admin_scope !== values.adminScope || target.magasin_id !== values.magasinId || target.actif !== body.actif)) {
      throw new Error("Vous ne pouvez pas modifier vos propres droits ou votre magasin.");
    }
    const actif = typeof body.actif === "boolean" ? body.actif : target.actif;
    await assertNotLastNationalAdmin(admin, target, { role: values.role, admin_scope: values.adminScope, actif });

    if (values.email !== target.email) {
      const { error: authError } = await admin.auth.admin.updateUserById(target.id, { email: values.email, email_confirm: true });
      if (authError) throw authError;
    }
    const { error: profileError } = await admin.from("profiles").update({ email: values.email, role: values.role, magasin_id: values.magasinId, admin_scope: values.adminScope, actif }).eq("id", target.id);
    if (profileError) throw profileError;
    const { error: clearRayonsError } = await admin.from("profile_rayons").delete().eq("profile_id", target.id);
    if (clearRayonsError) throw clearRayonsError;
    if (values.rayonIds.length) {
      const { error: rayonsError } = await admin.from("profile_rayons").insert(values.rayonIds.map((rayonId) => ({ profile_id: target.id, rayon_id: rayonId })));
      if (rayonsError) throw rayonsError;
    }
    return NextResponse.json({ ok: true, message: "Utilisateur modifié." });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Erreur serveur." }, { status: 400 });
  }
}
