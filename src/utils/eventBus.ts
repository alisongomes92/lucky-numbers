/**
 * Global in-memory event bus for cross-screen communication.
 * Supports both parameterless events and events with typed payloads.
 */

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Listener<T = any> = (payload?: T) => void;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const listeners = new Map<string, Set<Listener<any>>>();

export const EventBus = {
  on<T>(event: string, fn: Listener<T>) {
    if (!listeners.has(event)) listeners.set(event, new Set());
    listeners.get(event)!.add(fn);
  },
  off<T>(event: string, fn: Listener<T>) {
    listeners.get(event)?.delete(fn);
  },
  emit<T>(event: string, payload?: T) {
    listeners.get(event)?.forEach(fn => fn(payload));
  },
};

export const EVENTS = {
  ENTRY_SAVED:     'entry_saved',
  OPEN_GENERATOR:  'open_generator',   // payload: { lotteryId: string; numbers?: number[] }
} as const;

/** Payload emitted with OPEN_GENERATOR */
export interface OpenGeneratorPayload {
  lotteryId: string;
  /** Pre-selected numbers to seed the generator (from Stats shortcuts) */
  seedNumbers?: number[];
  /** Label shown in the generator as context hint */
  hint?: string;
}
