"use client";
import { useEffect, useState } from "react";
import AdminPageHeader from "@/components/admin/AdminPageHeader";
import { supabase } from "@/lib/supabase";
import { ProfileService } from "@/services/profile";

export default function AdminTablePage({ title, description, table, columns }: { title: string; description: string; table: "rayons" | "destinations" | "arrivages" | "profiles"; columns: string[] }) {
  const [rows, setRows] = useState<Record<string, unknown>[]>([]); const [error, setError] = useState<string | null>(null);
  useEffect(() => { async function charger() { try { const profil = await ProfileService.getCurrentProfile(); let query = supabase.from(table).select("*").limit(200); if (profil.adminScope !== "NATIONAL" && profil.magasinId) query = query.eq("magasin_id", profil.magasinId); const { data, error: requestError } = await query; if (requestError) setError(requestError.message); setRows((data ?? []) as Record<string, unknown>[]); } catch (cause) { setError(cause instanceof Error ? cause.message : "Impossible de charger les données."); } } void charger(); }, [table]);
  return <><AdminPageHeader title={title} description={description} />{error ? <p className="rounded-xl bg-red-50 p-4 text-red-700">{error}</p> : <section className="overflow-x-auto rounded-3xl border border-[#E3E8EC] bg-white shadow-sm"><table className="min-w-full text-left"><thead className="bg-[#F6F8FA] text-sm text-[#66727A]"><tr>{columns.map((column) => <th key={column} className="p-5 capitalize">{column.replaceAll("_", " ")}</th>)}</tr></thead><tbody>{rows.length === 0 ? <tr><td colSpan={columns.length} className="p-8 text-center text-[#66727A]">Aucune donnée.</td></tr> : rows.map((row, index) => <tr key={String(row.id ?? index)} className="border-t border-[#E3E8EC]">{columns.map((column) => <td key={column} className="p-5">{typeof row[column] === "boolean" ? (row[column] ? "Oui" : "Non") : String(row[column] ?? "—")}</td>)}</tr>)}</tbody></table></section>}</>;
}
