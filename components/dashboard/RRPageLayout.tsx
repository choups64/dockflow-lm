import type { ReactNode } from "react";
import Image from "next/image";
import RRSidebar from "@/components/dashboard/RRSidebar";

type RRPageLayoutProps = {
  children: ReactNode;
};

export default function RRPageLayout({ children }: RRPageLayoutProps) {
  return (
    <div className="min-h-screen bg-[#F6F8FA] text-[#101820] lg:flex">
      <RRSidebar />

      <div className="min-w-0 flex-1">
        <header className="border-b border-[#E3E8EC] bg-white px-5 py-4 lg:hidden">
          <div className="flex items-center gap-3">
            <Image
              src="/leroy-merlin-logo.svg"
              alt="Leroy Merlin"
              width={44}
              height={32}
              className="h-8 w-auto brightness-0"
            />
            <div>
              <p className="text-lg font-black tracking-[0.12em]">
                DOCK<span className="text-[#78BE20]">FLOW</span>
              </p>
              <p className="text-xs font-bold tracking-[0.16em] text-[#66727A]">MODE RR</p>
            </div>
          </div>
        </header>

        <main className="mx-auto max-w-7xl p-5 sm:p-8">{children}</main>
      </div>
    </div>
  );
}
