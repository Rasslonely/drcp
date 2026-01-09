import * as SecureStore from "expo-secure-store";

interface QueuedAction {
  id: string;
  type: "distress" | "task_accept" | "proof_submit";
  data: any;
  timestamp: number;
  retries: number;
}

const QUEUE_KEY = "drcp_offline_queue";

class OfflineService {
  private isOnline: boolean = true;
  private syncInterval: NodeJS.Timeout | null = null;

  setOnlineStatus(online: boolean): void {
    this.isOnline = online;
    if (online) {
      this.syncQueue();
    }
  }

  async queueAction(
    type: QueuedAction["type"],
    data: any
  ): Promise<string> {
    const action: QueuedAction = {
      id: this.generateId(),
      type,
      data,
      timestamp: Date.now(),
      retries: 0,
    };

    const queue = await this.getQueue();
    queue.push(action);
    await this.saveQueue(queue);

    if (this.isOnline) {
      this.syncQueue();
    }

    return action.id;
  }

  async getQueue(): Promise<QueuedAction[]> {
    try {
      const data = await SecureStore.getItemAsync(QUEUE_KEY);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  }

  private async saveQueue(queue: QueuedAction[]): Promise<void> {
    await SecureStore.setItemAsync(QUEUE_KEY, JSON.stringify(queue));
  }

  async syncQueue(): Promise<void> {
    if (!this.isOnline) return;

    const queue = await this.getQueue();
    if (queue.length === 0) return;

    const failedActions: QueuedAction[] = [];

    for (const action of queue) {
      try {
        await this.processAction(action);
      } catch (error) {
        action.retries++;
        if (action.retries < 3) {
          failedActions.push(action);
        }
        // Actions with 3+ retries are dropped
      }
    }

    await this.saveQueue(failedActions);
  }

  private async processAction(action: QueuedAction): Promise<void> {
    // API endpoints would be configured here
    const API_BASE = process.env.EXPO_PUBLIC_API_URL || "http://localhost:8000";

    switch (action.type) {
      case "distress":
        await fetch(`${API_BASE}/api/distress`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(action.data),
        });
        break;

      case "task_accept":
        await fetch(`${API_BASE}/api/tasks/accept`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(action.data),
        });
        break;

      case "proof_submit":
        // For proof with photo, would use FormData
        await fetch(`${API_BASE}/api/proof`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(action.data),
        });
        break;
    }
  }

  startPeriodicSync(intervalMs: number = 30000): void {
    this.stopPeriodicSync();
    this.syncInterval = setInterval(() => {
      this.syncQueue();
    }, intervalMs);
  }

  stopPeriodicSync(): void {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
      this.syncInterval = null;
    }
  }

  async getPendingCount(): Promise<number> {
    const queue = await this.getQueue();
    return queue.length;
  }

  async clearQueue(): Promise<void> {
    await SecureStore.deleteItemAsync(QUEUE_KEY);
  }

  private generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
}

export const offlineService = new OfflineService();
