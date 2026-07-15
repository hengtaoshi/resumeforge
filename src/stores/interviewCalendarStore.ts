import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface Interview {
  id: string;
  company: string;
  role: string;
  dateTime: string; // ISO string
  type: 'phone' | 'video' | 'onsite';
  notes: string;
  status: 'pending' | 'confirmed' | 'done';
  createdAt: string;
}

interface InterviewCalendarState {
  interviews: Interview[];
  addInterview: (data: Omit<Interview, 'id' | 'createdAt'>) => void;
  updateInterview: (id: string, data: Partial<Omit<Interview, 'id' | 'createdAt'>>) => void;
  removeInterview: (id: string) => void;
  getUpcoming: () => Interview[];
}

function genId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

export const useInterviewCalendarStore = create<InterviewCalendarState>()(
  persist(
    (set, get) => ({
      interviews: [],

      addInterview: (data) => {
        set((state) => ({
          interviews: [{
            ...data,
            id: genId(),
            createdAt: new Date().toISOString(),
          }, ...state.interviews],
        }));
      },

      updateInterview: (id, data) => {
        set((state) => ({
          interviews: state.interviews.map((i) =>
            i.id === id ? { ...i, ...data } : i,
          ),
        }));
      },

      removeInterview: (id) => {
        set((state) => ({
          interviews: state.interviews.filter((i) => i.id !== id),
        }));
      },

      getUpcoming: () => {
        return get().interviews
          .filter((i) => i.status === 'pending' || i.status === 'confirmed')
          .sort((a, b) => new Date(a.dateTime).getTime() - new Date(b.dateTime).getTime());
      },
    }),
    { name: 'resumeforge-interviews' },
  ),
);
