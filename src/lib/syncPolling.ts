import type { SyncStatus } from "./syncClient";

interface PollScheduler {
  setTimeout(callback: () => void, delay: number): number;
  clearTimeout(handle: number): void;
  setInterval(callback: () => void, delay: number): number;
  clearInterval(handle: number): void;
}

export function startSyncPolling(
  sync: () => Promise<SyncStatus>,
  onStatus: (status: SyncStatus) => void,
  scheduler: PollScheduler = window,
): () => void {
  let stopped = false;
  const interval = scheduler.setInterval(() => void poll(), 30_000);
  const initialSync = scheduler.setTimeout(() => void poll(), 0);

  async function poll() {
    if (stopped) return;
    const status = await sync();
    if (stopped) return;
    onStatus(status);
    if (status === "sign-in-needed") stop();
  }

  function stop() {
    if (stopped) return;
    stopped = true;
    scheduler.clearTimeout(initialSync);
    scheduler.clearInterval(interval);
  }

  return stop;
}
