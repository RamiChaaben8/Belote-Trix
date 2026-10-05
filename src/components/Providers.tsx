"use client";

import { SessionProvider } from "next-auth/react";
import type { ReactNode } from "react";
import { SettingsProvider } from "@/hooks/useSettings";

export function Providers({ children }: { children: ReactNode }) {
  return (
    <SessionProvider>
      <SettingsProvider>{children}</SettingsProvider>
    </SessionProvider>
  );
}
