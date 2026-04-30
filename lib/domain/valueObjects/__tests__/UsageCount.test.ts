import { Plan } from "../Plan";
import { UsageCount } from "../UsageCount";

describe("UsageCount", () => {
  describe("of()", () => {
    it("0以上の整数で生成できる", () => {
      expect(() => UsageCount.of(0)).not.toThrow();
      expect(() => UsageCount.of(10)).not.toThrow();
    });

    it("負の値はエラーを投げる", () => {
      expect(() => UsageCount.of(-1)).toThrow();
    });

    it("小数はエラーを投げる", () => {
      expect(() => UsageCount.of(1.5)).toThrow();
    });
  });

  describe("hasReachedLimit()", () => {
    it("freeプランで5回到達したらtrueを返す", () => {
      const free = Plan.of("free");
      expect(UsageCount.of(5).hasReachedLimit(free)).toBe(true);
      expect(UsageCount.of(6).hasReachedLimit(free)).toBe(true);
    });

    it("freeプランで4回以下はfalseを返す", () => {
      const free = Plan.of("free");
      expect(UsageCount.of(4).hasReachedLimit(free)).toBe(false);
      expect(UsageCount.of(0).hasReachedLimit(free)).toBe(false);
    });

    it("proプランは何回でもfalseを返す(無制限)", () => {
      const pro = Plan.of("pro");
      expect(UsageCount.of(100).hasReachedLimit(pro)).toBe(false);
      expect(UsageCount.of(0).hasReachedLimit(pro)).toBe(false);
    });
  });

  describe("getRemaining()", () => {
    it("freeプランで残り回数を返す", () => {
      const free = Plan.of("free");
      expect(UsageCount.of(0).getRemaining(free)).toBe(5);
      expect(UsageCount.of(3).getRemaining(free)).toBe(2);
      expect(UsageCount.of(5).getRemaining(free)).toBe(0);
      expect(UsageCount.of(6).getRemaining(free)).toBe(0);
    });

    it("proプランはnullを返す(無制限)", () => {
      const pro = Plan.of("pro");
      expect(UsageCount.of(0).getRemaining(pro)).toBeNull();
      expect(UsageCount.of(100).getRemaining(pro)).toBeNull();
    });
  });

  describe("increment()", () => {
    it("新しいUsageCountを返す(不変)", () => {
      const original = UsageCount.of(3);
      const incremented = original.increment();
      expect(incremented.getValue()).toBe(4);
      expect(original.getValue()).toBe(3);
    });
  });

  describe("getValue()", () => {
    it("内部の数値を返す", () => {
      expect(UsageCount.of(7).getValue()).toBe(7);
    });
  });
});
