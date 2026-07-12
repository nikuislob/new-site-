import { create } from "zustand";
import { persist } from "zustand/middleware";

export type SelectedSeat = {
  id: string;
  section: string;
  row: string;
  number: number;
  category: "UPPER" | "CLOSER";
};

type BookingState = {
  matchId: string | null;
  category: "UPPER" | "CLOSER" | null;
  seats: SelectedSeat[];
  setMatch: (matchId: string) => void;
  setCategory: (category: "UPPER" | "CLOSER") => void;
  toggleSeat: (seat: SelectedSeat, max: number) => { ok: boolean; message?: string };
  clearSeats: () => void;
  reset: () => void;
};

export const useBookingStore = create<BookingState>()(
  persist(
    (set, get) => ({
      matchId: null,
      category: null,
      seats: [],
      setMatch: (matchId) => set({ matchId, seats: [], category: null }),
      setCategory: (category) => set({ category, seats: [] }),
      toggleSeat: (seat, max) => {
        const state = get();
        const exists = state.seats.find((s) => s.id === seat.id);
        if (exists) {
          set({ seats: state.seats.filter((s) => s.id !== seat.id) });
          return { ok: true };
        }
        if (state.seats.length >= max) {
          return {
            ok: false,
            message:
              max <= 2
                ? "Maximum 2 tickets per order. For 3 or more, contact support."
                : `Maximum ${max} seats allowed.`,
          };
        }
        if (state.category && seat.category !== state.category) {
          return { ok: false, message: "Please select seats from the chosen category only." };
        }
        set({
          category: seat.category,
          seats: [...state.seats, seat],
        });
        return { ok: true };
      },
      clearSeats: () => set({ seats: [] }),
      reset: () => set({ matchId: null, category: null, seats: [] }),
    }),
    { name: "pitchora-booking" }
  )
);
