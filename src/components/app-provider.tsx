"use client";
import { createContext, useContext, useState } from "react";
import { initialVisits } from "@/lib/mock-data";
import type { Visit } from "@/lib/types";
interface State {
  visits: Visit[];
  addVisit: (visit: Visit) => void;
  reset: () => void;
}
const AppContext = createContext<State | null>(null);
export function AppProvider({ children }: { children: React.ReactNode }) {
  const [visits, setVisits] = useState(initialVisits);
  return (
    <AppContext.Provider
      value={{
        visits,
        addVisit: (v) => setVisits((current) => [v, ...current]),
        reset: () => setVisits(initialVisits),
      }}
    >
      {children}
    </AppContext.Provider>
  );
}
export function useMembers() {
  const context = useContext(AppContext);
  if (!context) throw new Error("AppProvider ontbreekt");
  return context;
}
