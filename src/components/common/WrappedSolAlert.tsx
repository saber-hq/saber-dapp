import { useSail } from "@saberhq/sail";
import {
  SingleConnectionBroadcaster,
  SolanaProvider,
} from "@saberhq/solana-contrib";
import type { TokenAmount } from "@saberhq/token-utils";
import { useConnectedWallet, useSendConnection } from "@saberhq/use-solana";
import { css } from "twin.macro";

import { closeWrappedAccount } from "../../utils/wrappedSol";
import { Alert } from "./Alert";
import { AsyncButton } from "./AsyncButton";

interface IProps {
  wSOLAmount: TokenAmount | undefined;
}

export const WrappedSOLAlert: React.FC<IProps> = ({ wSOLAmount }: IProps) => {
  const wallet = useConnectedWallet();
  const connection = useSendConnection();
  const { handleTXs } = useSail();

  const handleUnwrapSOL = async () => {
    if (!wallet) {
      throw new Error("wallet is null");
    }

    const provider = new SolanaProvider(
      connection,
      new SingleConnectionBroadcaster(connection),
      wallet,
    );

    await handleTXs(
      [await closeWrappedAccount(provider, wallet.publicKey)],
      `Unwrapping Wrapped SOL`,
    );
  };

  return (
    <Alert>
      <p>
        You have {wSOLAmount?.toFixed(5) ?? "0"}
        <a
          href="https://spl.solana.com/token#wrapping-sol"
          target="_blank"
          rel="noreferrer noopener"
        >
          {" "}
          wrapped SOL{" "}
        </a>
        in your wallet. Click below to unwrap to native SOL.
      </p>
      <AsyncButton
        css={css`
          margin-top: 36px;
        `}
        size="small"
        onClick={async () => {
          await handleUnwrapSOL();
        }}
      >
        Unwrap SOL
      </AsyncButton>
    </Alert>
  );
};
