import type { ReactNode } from "react";

type RRPageHeaderProps = {
  title: string;
  description: string;
  actions?: ReactNode;
};

export default function RRPageHeader({
  title,
  description,
  actions,
}: RRPageHeaderProps) {
  return (
    <header className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h1 className="text-3xl font-black tracking-tight text-[#101820] sm:text-4xl">{title}</h1>
        <p className="mt-2 text-base text-[#66727A]">{description}</p>
      </div>
      {actions && <div className="flex shrink-0 flex-wrap gap-3">{actions}</div>}
    </header>
  );
}
