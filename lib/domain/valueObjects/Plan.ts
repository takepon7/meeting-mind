type PlanValue = "free" | "pro";

const FREE_MONTHLY_LIMIT = 5;

export class Plan {
  private constructor(private readonly value: PlanValue) {}

  static of(value: string): Plan {
    if (value !== "free" && value !== "pro") {
      throw new Error(`Invalid plan: "${value}". Must be "free" or "pro".`);
    }
    return new Plan(value);
  }

  isFree(): boolean {
    return this.value === "free";
  }

  isPro(): boolean {
    return this.value === "pro";
  }

  getMonthlyLimit(): number | null {
    return this.value === "free" ? FREE_MONTHLY_LIMIT : null;
  }

  toString(): string {
    return this.value;
  }
}
