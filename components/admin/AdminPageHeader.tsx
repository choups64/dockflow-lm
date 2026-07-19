import type { ReactNode } from "react";

export default function AdminPageHeader({ title, description, action }: { title: string; description: string; action?: ReactNode }) {
  return <header className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between"><div><h1 className="text-3xl font-black tracking-tight text-[#101820] sm:text-4xl">{title}</h1><p className="mt-2 text-[#66727A]">{description}</p></div>{action}</header>;
}
