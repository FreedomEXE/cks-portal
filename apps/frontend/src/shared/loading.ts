// Lightweight global loading service usable from non-React modules
// Provides start/stop and subscription for UI overlays.

export interface LoadingCounts {
  blocking: number;
  nonBlocking: number;
}

type Listener = (counts: LoadingCounts) => void;

let inflightBlocking = 0;
let inflightNonBlocking = 0;
const listeners = new Set<Listener>();

function snapshot(): LoadingCounts {
  return { blocking: inflightBlocking, nonBlocking: inflightNonBlocking };
}

function emit() {
  const s = snapshot();
  for (const l of listeners) l(s);
}

export function subscribe(listener: Listener): () => void {
  listeners.add(listener);
  // Initialize with current value
  listener(snapshot());
  return () => listeners.delete(listener);
}

export function getCounts(): LoadingCounts {
  return snapshot();
}

export function start(options?: { blocking?: boolean }): () => void {
  const isBlocking = !!options?.blocking;
  if (isBlocking) inflightBlocking += 1; else inflightNonBlocking += 1;
  emit();
  let stopped = false;
  return () => {
    if (stopped) return;
    stopped = true;
    if (isBlocking) inflightBlocking = Math.max(0, inflightBlocking - 1);
    else inflightNonBlocking = Math.max(0, inflightNonBlocking - 1);
    emit();
  };
}

export async function wrap<T>(p: Promise<T>): Promise<T> {
  const end = start();
  try {
    return await p;
  } finally {
    end();
  }
}

export function startBlocking(): () => void {
  return start({ blocking: true });
}

export async function wrapBlocking<T>(p: Promise<T>): Promise<T> {
  const end = start({ blocking: true });
  try {
    return await p;
  } finally {
    end();
  }
}

export default { subscribe, getCounts, start, wrap, startBlocking, wrapBlocking };
