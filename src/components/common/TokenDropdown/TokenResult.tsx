import type { AssociatedTokenAccount } from "@saberhq/sail";
import type { Token } from "@saberhq/token-utils";
import {
  Fraction,
  NATIVE_MINT,
  RAW_SOL_MINT,
  TokenAmount,
} from "@saberhq/token-utils";
import tw, { styled } from "twin.macro";

import { TokenAmountDisplay } from "../TokenAmountDisplay";
import { TokenInfo } from "./TokenInfo";

export interface Props {
  style?: React.CSSProperties;
  onSelect?: (token: Token) => void;
  token: Token;
  userTokenAccounts: readonly (AssociatedTokenAccount | null | undefined)[];
}

export const TokenResult: React.FC<Props> = ({
  style,
  onSelect,
  token,
  userTokenAccounts,
}: Props): JSX.Element => {
  const amount =
    userTokenAccounts.find((account) =>
      token.mintAccount.equals(NATIVE_MINT)
        ? account?.balance.token.mintAccount.equals(RAW_SOL_MINT)
        : account?.balance.token.equals(token),
    )?.balance ?? new TokenAmount(token, 0);
  return (
    <TokenOption style={style} onClick={() => onSelect?.(token)}>
      <TokenInfo token={token} />
      <Balance>
        <TokenAmountDisplay
          amount={amount}
          numberFormatOptions={
            amount.lessThan(new Fraction(1, 1_000))
              ? {
                  minimumSignificantDigits: 3,
                }
              : {
                  maximumFractionDigits: 3,
                }
          }
        />
      </Balance>
    </TokenOption>
  );
};

const Balance = styled.div`
  font-size: 14px;
  line-height: 16px;
  color: ${({ theme }) => theme.colors.text.default};
`;

const TokenOption = styled.div`
  ${tw`h-14 mb-1 flex items-center justify-between rounded-lg cursor-pointer px-3`}
  &:hover {
    background: ${({ theme }) => theme.colors.modal.item.base.hover};
  }
`;
