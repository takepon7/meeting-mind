const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export class Email {
  private constructor(private readonly value: string) {}

  static of(value: string): Email {
    if (!EMAIL_PATTERN.test(value)) {
      throw new Error(`Invalid email address: "${value}".`);
    }
    return new Email(value);
  }

  getValue(): string {
    return this.value;
  }
}
