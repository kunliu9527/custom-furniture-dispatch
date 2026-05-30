type StatusToastListener = (message: string) => void;

const listeners = new Set<StatusToastListener>();

export function showStatusToast(message: string) {
  for (const listener of listeners) {
    listener(message);
  }
}

export function subscribeStatusToast(listener: StatusToastListener): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}
