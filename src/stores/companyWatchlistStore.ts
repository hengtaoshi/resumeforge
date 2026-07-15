import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface Company {
  id: string;
  name: string;
  industry: string;
  reason: string;
  status: 'watching' | 'applied' | 'interviewing';
  createdAt: string;
}

interface CompanyWatchlistState {
  companies: Company[];
  addCompany: (data: Omit<Company, 'id' | 'createdAt'>) => void;
  updateCompany: (id: string, data: Partial<Omit<Company, 'id' | 'createdAt'>>) => void;
  removeCompany: (id: string) => void;
}

function genId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

export const useCompanyWatchlistStore = create<CompanyWatchlistState>()(
  persist(
    (set) => ({
      companies: [],

      addCompany: (data) => {
        set((state) => ({
          companies: [{
            ...data,
            id: genId(),
            createdAt: new Date().toISOString(),
          }, ...state.companies],
        }));
      },

      updateCompany: (id, data) => {
        set((state) => ({
          companies: state.companies.map((c) =>
            c.id === id ? { ...c, ...data } : c,
          ),
        }));
      },

      removeCompany: (id) => {
        set((state) => ({
          companies: state.companies.filter((c) => c.id !== id),
        }));
      },
    }),
    { name: 'resumeforge-watchlist' },
  ),
);
