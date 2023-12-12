import { useConnectedWallet } from "@saberhq/use-solana";
import React, { useState } from "react";
import { styled } from "twin.macro";

import { useConnectWallet } from "../../contexts/wallet";
import { handleException } from "../../utils/error";
import { Button } from "./Button";
import { LoadingSpinner } from "./LoadingSpinner";

export interface AsyncButtonProps
  extends Omit<React.ComponentPropsWithRef<typeof Button>, "onClick"> {
  onClick: () => Promise<void> | void;
  loadingMessage?: string;
}

export const AsyncButton: React.FC<AsyncButtonProps> = ({
  onClick,
  children,
  disabled,
  loadingMessage,
  ...rest
}: AsyncButtonProps) => {
  const wallet = useConnectedWallet();
  const connect = useConnectWallet();
  const [loading, setLoading] = useState<boolean>(false);
  return wallet !== null ? (
    <Button
      key="main"
      size="large"
      {...rest}
      disabled={disabled || loading}
      onClick={async () => {
        if (loading) {
          return;
        }
        setLoading(true);
        try {
          await onClick();
        } catch (e) {
          handleException(e, {
            source: "async-button",
          });
        }
        setLoading(false);
      }}
    >
      {loading ? (
        <MsgWrapper key="msgWrapper">{loadingMessage ?? children}</MsgWrapper>
      ) : (
        children
      )}
      {loading && (
        <SpinWrapper key="loadingSpinner">
          <LoadingSpinner />
        </SpinWrapper>
      )}
    </Button>
  ) : (
    <Button
      key="connectWallet"
      size="large"
      {...rest}
      variant="secondary"
      onClick={() => connect()}
    >
      Connect Wallet
    </Button>
  );
};

const SpinWrapper = styled.span`
  margin-left: 8px;
  line-height: 0;
`;

const MsgWrapper = styled.div`
  display: flex;
  align-items: center;
`;
