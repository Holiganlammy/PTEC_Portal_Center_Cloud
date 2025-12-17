// lib/sessionRefreshService.ts
"use client";

class SessionRefreshService {
  private intervalId: NodeJS.Timeout | null = null;
  private isRefreshing: boolean = false;
  private readonly REFRESH_INTERVAL = 60 * 60 * 1000; // 1 hour
  private failureCount: number = 0;
  private readonly MAX_FAILURES = 2;
  private isStopped: boolean = false;
  private updateFn: (() => Promise<void>) | null = null;

  start(updateCallback: () => Promise<void>, statusChecker: () => string) {
    if (this.intervalId || this.isStopped) {
      console.log("⚠️ Refresh service already running or stopped");
      return;
    }
    this.failureCount = 0;
    this.isStopped = false;
    this.updateFn = updateCallback;

    setTimeout(() => {
      console.log("🔄 Loading New Session");
      this.refresh();
    }, 1000);
    this.intervalId = setInterval(async () => {
    
      if (this.isStopped) {
        this.stop();
        return;
      }

      const status = statusChecker();
      if (status !== "authenticated") {
        console.log(`⏭️ Status is ${status}, skip refresh`);
        return;
      }

      if (this.isRefreshing) {
        console.log("⏭️ Already refreshing, skip");
        return;
      }

      if (this.failureCount >= this.MAX_FAILURES) {
        console.log("❌ Too many failures, stopping service");
        this.stop();
        return;
      }

      try {
        this.isRefreshing = true;
        console.log("🔄 Auto-refreshing session...");
        await updateCallback();
        this.failureCount = 0;
      } catch (error) {
        this.failureCount++;
        console.error(`❌ Failed to refresh (${this.failureCount}/${this.MAX_FAILURES}):`, error);
        
        if (this.failureCount >= this.MAX_FAILURES) {
          console.log("❌ Max failures reached, stopping");
          this.stop();
        }
      } finally {
        this.isRefreshing = false;
      }
    }, this.REFRESH_INTERVAL);

    console.log(" Session refresh service started");
  }
  private refresh() {
    if (this.updateFn) {
      this.updateFn().catch((error) => {
        console.error("❌ Refresh failed:", error);
      });
    }
  }
  stop() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    this.isRefreshing = false;
    this.failureCount = 0;
    this.isStopped = true;
    console.log("🛑 Session refresh service stopped");
  }

  reset() {
    this.stop();
    this.isStopped = false;
  }

  isRunning(): boolean {
    return this.intervalId !== null && !this.isStopped;
  }
}

export const sessionRefreshService = new SessionRefreshService();