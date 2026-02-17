"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

export default function AdminRedirect() {
  const router = useRouter();
  
  useEffect(() => {
    router.replace("/admin/imoveis");
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <Loader2 className="animate-spin text-green-700" size={40} />
    </div>
  );
}