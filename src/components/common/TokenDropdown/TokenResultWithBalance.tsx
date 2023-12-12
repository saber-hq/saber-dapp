import { useUserATAs } from "@saberhq/sail";

import type { Props as TokenResultProps } from "./TokenResult";
import { TokenResult } from "./TokenResult";

type Props = Omit<TokenResultProps, "userTokenAccounts">;

/**
 * {@link TokenResult} with the balance of the provided token loaded.
 * @param props
 * @returns
 */
export const TokenResultWithBalance: React.FC<Props> = (props: Props) => {
  const userTokenAccounts = useUserATAs(props.token);
  return <TokenResult {...props} userTokenAccounts={userTokenAccounts} />;
};
