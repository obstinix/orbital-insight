import { create } from 'zustand';

export interface Exoplanet {
  id: string;
  name: string;
  category: string;
  type: string;
  distance: number;
  discoveryYear: number;
  method: string;
  mass: number;
  radius: number;
  habitabilityScore: number;
  temperature: number;
  star: string;
  description: string;
}

interface ExoplanetState {
  selectedExoplanetId: string | null;
  activeExoplanet: Exoplanet | null;
  showExoplanetCanvas: boolean;
  exoplanets: Exoplanet[];
  totalCount: number;
  loading: boolean;
  searchTerm: string;
  category: string;
  page: number;
  limit: number;
  setSelectedExoplanetId: (id: string | null) => void;
  setShowExoplanetCanvas: (val: boolean) => void;
  setSearch: (term: string) => void;
  setCategory: (cat: string) => void;
  setPage: (p: number) => void;
  fetchExoplanets: () => Promise<void>;
}

export const useExoplanetStore = create<ExoplanetState>((set, get) => ({
  selectedExoplanetId: null,
  activeExoplanet: null,
  showExoplanetCanvas: false,
  exoplanets: [],
  totalCount: 0,
  loading: false,
  searchTerm: '',
  category: 'ALL',
  page: 1,
  limit: 20, // Display 20 per page for optimal visual UI sizing

  setSelectedExoplanetId: async (id) => {
    set({ selectedExoplanetId: id });
    if (!id) {
      set({ activeExoplanet: null });
      return;
    }
    // Check if it's already in the current list
    const existing = get().exoplanets.find(p => p.id === id);
    if (existing) {
      set({ activeExoplanet: existing });
      return;
    }

    // Otherwise fetch details from API
    const API_BASE = import.meta.env.VITE_API_URL || '';
    try {
      const res = await fetch(`${API_BASE}/api/exoplanets/${id}`);
      if (res.ok) {
        const data = await res.json() as Exoplanet;
        set({ activeExoplanet: data });
      }
    } catch (err) {
      console.error('[ExoplanetStore] Failed to fetch exoplanet details:', err);
    }
  },
  setShowExoplanetCanvas: (val) => set({ showExoplanetCanvas: val }),
  
  setSearch: (term) => {
    set({ searchTerm: term, page: 1 });
    get().fetchExoplanets();
  },

  setCategory: (cat) => {
    set({ category: cat, page: 1 });
    get().fetchExoplanets();
  },

  setPage: (p) => {
    set({ page: p });
    get().fetchExoplanets();
  },

  fetchExoplanets: async () => {
    const { searchTerm, category, page, limit } = get();
    set({ loading: true });

    const API_BASE = import.meta.env.VITE_API_URL || '';
    const offset = (page - 1) * limit;

    try {
      const url = new URL(`${API_BASE}/api/exoplanets`);
      url.searchParams.set('search', searchTerm);
      url.searchParams.set('category', category);
      url.searchParams.set('limit', String(limit));
      url.searchParams.set('offset', String(offset));

      const res = await fetch(url.toString());
      if (res.ok) {
        const data = (await res.json()) as { exoplanets: Exoplanet[]; total: number };
        set({
          exoplanets: data.exoplanets,
          totalCount: data.total,
        });

        // Auto-select the first exoplanet if nothing is selected or if the selected one is not in the list
        const currentSelectedId = get().selectedExoplanetId;
        if (data.exoplanets.length > 0) {
          const exists = data.exoplanets.some((p) => p.id === currentSelectedId);
          if (!exists) {
            // Wait, we shouldn't trigger automatic side effects here that mess up custom selections.
            // But if nothing is selected yet, let's select the first.
            if (!currentSelectedId) {
              set({ selectedExoplanetId: data.exoplanets[0].id });
            }
          }
        }
      }
    } catch (err) {
      console.error('[ExoplanetStore] Failed to fetch exoplanets:', err);
    } finally {
      set({ loading: false });
    }
  },
}));
