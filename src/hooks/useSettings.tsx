"use client";

import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";

interface Settings {
  sound: boolean;
  setSound: (v: boolean) => void;
}

const Ctx = createContext<Settings>({ sound: true, setSound: () => undefined });

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [sound, setSoundState] = useState(true);
  useEffect(() => {
    const v = localStorage.getItem("belote-sound");
    if (v !== null) setSoundState(v === "1");
  }, []);
  const setSound = useCallback((v: boolean) => {
    setSoundState(v);
    localStorage.setItem("belote-sound", v ? "1" : "0");
  }, []);
  return <Ctx.Provider value={{ sound, setSound }}>{children}</Ctx.Provider>;
}

export const useSettings = () => useContext(Ctx);
