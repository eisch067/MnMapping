import { describe, expect, it, vi } from "vitest";
import { startSyncPolling } from "./syncPolling";
import type { SyncStatus } from "./syncClient";

function scheduler() {
  let nextId = 0;
  const timeouts = new Map<number, () => void>();
  const intervals = new Map<number, () => void>();
  return {
    timeouts,
    intervals,
    setTimeout(callback: () => void) {
      const id = ++nextId;
      timeouts.set(id, callback);
      return id;
    },
    clearTimeout(id: number) { timeouts.delete(id); },
    setInterval(callback: () => void) {
      const id = ++nextId;
      intervals.set(id, callback);
      return id;
    },
    clearInterval(id: number) { intervals.delete(id); },
  };
}

describe("sync polling", () => {
  it("stops future polls when sync needs sign-in", async () => {
    const timers = scheduler();
    const statuses: SyncStatus[] = [];
    const sync = vi.fn(async () => "sign-in-needed" as const);
    startSyncPolling(sync, (status) => statuses.push(status), timers);

    const initial = [...timers.timeouts.values()][0];
    initial?.();
    await vi.waitFor(() => expect(statuses).toEqual(["sign-in-needed"]));
    expect(timers.intervals.size).toBe(0);
    expect(timers.timeouts.size).toBe(0);
    expect(sync).toHaveBeenCalledTimes(1);
  });

  it("keeps polling after a retryable paused response", async () => {
    const timers = scheduler();
    const statuses: SyncStatus[] = [];
    const sync = vi.fn<() => Promise<SyncStatus>>()
      .mockResolvedValueOnce("paused")
      .mockResolvedValueOnce("idle");
    startSyncPolling(sync, (status) => statuses.push(status), timers);

    [...timers.timeouts.values()][0]?.();
    await vi.waitFor(() => expect(statuses).toEqual(["paused"]));
    [...timers.intervals.values()][0]?.();
    await vi.waitFor(() => expect(statuses).toEqual(["paused", "idle"]));
    expect(sync).toHaveBeenCalledTimes(2);
    expect(timers.intervals.size).toBe(1);
  });
});
