/**
 * src/modules/audit/trace/executionTimer.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * Sprint 6.6 — Audit Debug Trace: Execution Timer
 *
 * ROLE:
 *   Utility class to calculate duration and generate start/end timestamps.
 */

export class ExecutionTimer {
  private startMs:  number = 0;
  private startIso: string = '';

  /** Starts the timer and captures initial timestamp. */
  public start(): void {
    this.startMs  = Date.now();
    this.startIso = new Date().toISOString();
  }

  /**
   * Stops the timer and returns timing statistics.
   *
   * @returns Object with startTime (ISO), endTime (ISO), and duration in ms.
   */
  public stop(): { startTime: string; endTime: string; duration: number } {
    const endMs  = Date.now();
    const endIso = new Date().toISOString();
    const duration = endMs - this.startMs;

    return {
      startTime: this.startIso,
      endTime:   endIso,
      duration:  Math.max(0, duration),
    };
  }
}
