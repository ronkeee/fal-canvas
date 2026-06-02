import { create } from 'zustand';

/**
 * Global popover dismissal store.
 * Any popover/menu registers itself. When the user clicks on the canvas
 * or opens a different popover, all others close.
 */

type DismissCallback = () => void;

interface PopoverStore {
  /** Map of active popover IDs → their close callbacks */
  active: Map<string, DismissCallback>;

  /** Register a popover as open */
  register: (id: string, onClose: DismissCallback) => void;

  /** Unregister a popover (it closed itself) */
  unregister: (id: string) => void;

  /** Dismiss all open popovers */
  dismissAll: () => void;

  /** Dismiss all popovers except the given one */
  dismissAllExcept: (id: string) => void;
}

export const usePopoverStore = create<PopoverStore>((set, get) => ({
  active: new Map(),

  register: (id, onClose) => {
    const { active } = get();
    // Close all other popovers when a new one opens
    active.forEach((cb, existingId) => {
      if (existingId !== id) cb();
    });
    const next = new Map([[id, onClose]]);
    set({ active: next });
  },

  unregister: (id) => {
    const next = new Map(get().active);
    next.delete(id);
    set({ active: next });
  },

  dismissAll: () => {
    const { active } = get();
    active.forEach((cb) => cb());
    set({ active: new Map() });
  },

  dismissAllExcept: (id) => {
    const { active } = get();
    active.forEach((cb, existingId) => {
      if (existingId !== id) cb();
    });
    const kept = new Map<string, DismissCallback>();
    const cb = active.get(id);
    if (cb) kept.set(id, cb);
    set({ active: kept });
  },
}));
