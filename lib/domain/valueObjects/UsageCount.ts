import { Plan } from "./Plan";

export class UsageCount {
  private constructor(private readonly count: number) {}

  static of(count: number): UsageCount {
    if (!Number.isInteger(count) || count < 0) {
      throw new Error(`Invalid usage count: ${count}. Must be a non-negative integer.`);
    }
    return new UsageCount(count);
  }

  hasReachedLimit(plan: Plan): boolean {
    const limit = plan.getMonthlyLimit();
    if (limit === null) return false;
    return this.count >= limit;
  }

  getRemaining(plan: Plan): number | null {
    const limit = plan.getMonthlyLimit();
    if (limit === null) return null;
    return Math.max(0, limit - this.count);
  }

  increment(): UsageCount {
    return new UsageCount(this.count + 1);
  }

  getValue(): number {
    return this.count;
  }
}
