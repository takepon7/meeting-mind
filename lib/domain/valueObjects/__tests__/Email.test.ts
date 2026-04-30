import { Email } from "../Email";

describe("Email", () => {
  describe("of()", () => {
    it("有効なメールアドレスで生成できる", () => {
      expect(() => Email.of("user@example.com")).not.toThrow();
      expect(() => Email.of("foo.bar+tag@sub.domain.org")).not.toThrow();
    });

    it("@がないアドレスはエラーを投げる", () => {
      expect(() => Email.of("invalidemail")).toThrow();
    });

    it("ドメインがないアドレスはエラーを投げる", () => {
      expect(() => Email.of("user@")).toThrow();
    });

    it("空文字はエラーを投げる", () => {
      expect(() => Email.of("")).toThrow();
    });

    it("スペースを含む値はエラーを投げる", () => {
      expect(() => Email.of("user @example.com")).toThrow();
    });
  });

  describe("getValue()", () => {
    it("メールアドレスの文字列を返す", () => {
      const email = Email.of("user@example.com");
      expect(email.getValue()).toBe("user@example.com");
    });
  });
});
