import AdminTablePage from "@/components/admin/AdminTablePage";
export default function Page() { return <AdminTablePage title="Utilisateurs" description="Utilisateurs existants. La création Auth sera ajoutée via une route serveur sécurisée." table="profiles" columns={["email", "role", "magasin_id", "admin_scope", "actif", "created_at"]} />; }
