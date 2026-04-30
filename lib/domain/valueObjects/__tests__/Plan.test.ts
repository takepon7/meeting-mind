import { Plan } from "../Plan";

describe("Plan", () => {
  describe("of()", () => {
    it("freeプランを生成できる", () => {
      expect(() => Plan.of("free")).not.toThrow();
    });

    it("proプランを生成できる", () => {
      expect(() => Plan.of("pro")).not.toThrow();
    });

    it("無効な値はエラーを投げる", () => {
      expect(() => Plan.of("enterprise")).toThrow();
      expect(() => Plan.of("")).toThrow();
    });
  });

  describe("isFree()", () => {
    it("freeプランはtrueを返す", () => {
      expect(Plan.of("free").isFree()).toBe(true);
    });

    it("proプランはfalseを返す", () => {
      expect(Plan.of("pro").isFree()).toBe(false);
    });
  });

  describe("isPro()", () => {
    it("proプランはtrueを返す", () => {
      expect(Plan.of("pro").isPro()).toBe(true);
    });

    it("freeプランはfalseを返す", () => {
      expect(Plan.of("free").isPro()).toBe(false);
    });
  });

  describe("getMonthlyLimit()", () => {
    it("freeプランは5を返す", () => {
      expect(Plan.of("free").getMonthlyLimit()).toBe(5);
    });

    it("proプランはnullを返す(無制限)", () => {
      expect(Plan.of("pro").getMonthlyLimit()).toBeNull();
    });
  });

  describe("toString()", () => {
    it("プラン名の文字列を返す", () => {
      expect(Plan.of("free").toString()).toBe("free");
      expect(Plan.of("pro").toString()).toBe("pro");
    });
  });
});
