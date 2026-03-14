import { create } from "zustand";
import { IncidentsFilters } from "../domain/incidents";

const DEFAULT_FILTERS: IncidentsFilters = {
  search: "",
  status: "all",
  severity: "all",
  sla: "all",
  overdueOnly: false,
  page: 1,
  pageSize: 5,
};

type IncidentsFiltersState = {
  filters: IncidentsFilters;
  setSearch: (search: string) => void;
  setStatus: (status: IncidentsFilters["status"]) => void;
  setSeverity: (severity: IncidentsFilters["severity"]) => void;
  setSla: (sla: IncidentsFilters["sla"]) => void;
  setOverdueOnly: (overdueOnly: boolean) => void;
  setPage: (page: number) => void;
  resetFilters: () => void;
  setFromUrl: (params: Partial<IncidentsFilters>) => void;
};

export const useIncidentsFiltersStore = create<IncidentsFiltersState>((set) => ({
  filters: DEFAULT_FILTERS,
  setSearch: (search) =>
    set((state) => ({
      filters: { ...state.filters, search, page: 1 },
    })),
  setStatus: (status) =>
    set((state) => ({
      filters: { ...state.filters, status, page: 1 },
    })),
  setSeverity: (severity) =>
    set((state) => ({
      filters: { ...state.filters, severity, page: 1 },
    })),
  setSla: (sla) =>
    set((state) => ({
      filters: { ...state.filters, sla, page: 1 },
    })),
  setOverdueOnly: (overdueOnly) =>
    set((state) => ({
      filters: { ...state.filters, overdueOnly, page: 1 },
    })),
  setPage: (page) =>
    set((state) => ({
      filters: { ...state.filters, page },
    })),
  resetFilters: () =>
    set({
      filters: DEFAULT_FILTERS,
    }),
  setFromUrl: (params) =>
    set(() => ({
      filters: {
        ...DEFAULT_FILTERS,
        ...params,
      },
    })),
}));
