import { Plan, UsageCount } from "@/lib/domain/valueObjects";

export interface CheckUsageLimitInput {
  plan: Plan;
  usageCount: UsageCount;
}

export interface CheckUsageLimitOutput {
  hasReachedLimit: boolean;
  used: number;
  limit: number | null;
  remaining: number | null;
}

export class CheckUsageLimit {
  execute(input: CheckUsageLimitInput): CheckUsageLimitOutput {
    const { plan, usageCount } = input;

    return {
      hasReachedLimit: usageCount.hasReachedLimit(plan),
      used: usageCount.getValue(),
      limit: plan.getMonthlyLimit(),
      remaining: usageCount.getRemaining(plan),
    };
  }
}
