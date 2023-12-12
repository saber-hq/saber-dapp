import type { Token } from "@saberhq/token-utils";
import { TokenAmount } from "@saberhq/token-utils";
import JSBI from "jsbi";

/**
 * Token with an (optional) underlying token backing it.
 */
export class WrappedToken {
  constructor(
    readonly value: Token,
    readonly underlying: Token = value,
  ) {}

  isWrapped(): boolean {
    return !this.value.equals(this.underlying);
  }

  equals(other: WrappedToken): boolean {
    return (
      this.value.equals(other.value) && this.underlying.equals(other.underlying)
    );
  }

  get multiplier(): JSBI {
    return JSBI.BigInt(10 ** (this.value.decimals - this.underlying.decimals));
  }

  /**
   * Returns the amount of wrapped tokens.
   * @param amount
   * @returns
   */
  wrappedAmount(amount: TokenAmount): TokenAmount {
    if (amount.token.equals(this.underlying) && this.isWrapped()) {
      // convert to wrapped
      return new TokenAmount(
        this.value,
        JSBI.multiply(amount.raw, this.multiplier),
      );
    } else if (amount.token.equals(this.value)) {
      return amount;
    }
    throw new Error("invalid token amount");
  }

  /**
   * Returns the amount of underlying tokens.
   * @param amount
   * @returns
   */
  underlyingAmount(amount: TokenAmount): TokenAmount {
    if (amount.token.equals(this.value) && this.isWrapped()) {
      // convert to underlying
      return new TokenAmount(
        this.underlying,
        JSBI.divide(amount.raw, this.multiplier),
      );
    } else if (amount.token.equals(this.underlying)) {
      return amount;
    }
    throw new Error("invalid token amount");
  }
}
