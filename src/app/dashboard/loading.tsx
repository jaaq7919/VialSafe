"use client";

import { Loader2 } from "lucide-react";

export default function Loading() {
  // Puedes personalizar este componente de carga como desees.
  // Se mostrará centrado dentro del layout del dashboard.
  return (
    <div className="flex h-full w-full items-center justify-center">
      <Loader2 className="h-16 w-16 animate-spin text-primary" />
    </div>
  );
}
