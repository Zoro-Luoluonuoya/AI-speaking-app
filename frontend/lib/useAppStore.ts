import { create } from "zustand";
import type { Lang } from "./i18n";

export type Scenario = "interview" | "restaurant" | "meeting";

export const SCENARIOS: Record<Scenario, { icon: string; i18nKey: string }> = {
  interview: { icon: "💼", i18nKey: "scenario.interview" },
  restaurant: { icon: "🍽️", i18nKey: "scenario.restaurant" },
  meeting: { icon: "🤝", i18nKey: "scenario.meeting" },
};

interface AppState {
  scenario: Scenario;
  setScenario: (s: Scenario) => void;
  uiLanguage: Lang;
  toggleLanguage: () => void;
}

export const useAppStore = create<AppState>((set) => ({
  scenario: "interview",
  setScenario: (scenario) => set({ scenario }),
  uiLanguage: "zh",
  toggleLanguage: () =>
    set((s) => ({ uiLanguage: s.uiLanguage === "zh" ? "en" : "zh" })),
}));
