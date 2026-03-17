"use client";

import { usePathname } from "next/navigation";

export default function ConditionalLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  
  // Adicionamos o || pathname?.startsWith("/crm") aqui:
  const isPainelAdmin = pathname?.startsWith("/admin") || pathname?.startsWith("/login") || pathname?.startsWith("/crm");

  if (isPainelAdmin) {
    return null; 
  }

  return <>{children}</>;
}