import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { Plan, UsageCount } from "@/lib/domain/valueObjects";
import { CheckUsageLimit } from "@/lib/usecases/CheckUsageLimit";

const checkUsageLimit = new CheckUsageLimit();

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    const freePlan = Plan.of("free");
    const zeroUsage = UsageCount.of(0);
    const result = checkUsageLimit.execute({ plan: freePlan, usageCount: zeroUsage });
    return NextResponse.json({ authenticated: false, ...result });
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("plan")
    .eq("id", user.id)
    .single();

  const plan = Plan.of(profile?.plan ?? "free");

  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);

  const { count } = await supabase
    .from("usage_logs")
    .select("id", { count: "exact", head: true })
    .eq("user_id", user.id)
    .gte("created_at", startOfMonth.toISOString());

  const usageCount = UsageCount.of(count ?? 0);
  const result = checkUsageLimit.execute({ plan, usageCount });

  return NextResponse.json({ authenticated: true, plan: plan.toString(), ...result });
}
