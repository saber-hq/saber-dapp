import { useSOLBalance, useUserATAs } from "@saberhq/sail";
import { RAW_SOL, TokenAmount } from "@saberhq/token-utils";
import { useConnectedWallet, useConnectionContext } from "@saberhq/use-solana";
import React, { useState } from "react";
import { FaCaretDown } from "react-icons/fa";
import tw, { styled } from "twin.macro";

import { useConfig } from "../../../../contexts/config";
import { useConnectWallet } from "../../../../contexts/wallet";
import { breakpoints } from "../../../../theme/breakpoints";
import { useGovernanceToken } from "../../../../utils/farming/useGovernanceToken";
import useWindowDimensions from "../../../../utils/useWindowDimensions";
import { shortenAddress } from "../../../../utils/utils";
import { Button } from "../../../common/Button";
import { TokenAmountDisplay } from "../../../common/TokenAmountDisplay";
import type { MODAL_MODES } from "./WalletSettingsModal";

const DialectButton = React.lazy(() => import("./DialectButton"));
const WalletSettingsModal = React.lazy(() => import("./WalletSettingsModal"));

export const ConnectedWallet: React.FC = () => {
  const { isMobile } = useWindowDimensions();
  const wallet = useConnectedWallet();
  const connect = useConnectWallet();
  const solBalance = useSOLBalance(wallet?.publicKey);

  const [showSettings, setShowSettings] = useState<boolean>(false);
  const { network } = useConnectionContext();
  const { environments } = useConfig();
  const networkName = environments[network].name;
  const [mode, setMode] = useState<MODAL_MODES>("settings");

  const { data: sbrToken } = useGovernanceToken();
  const [sbrTokenAccount] = useUserATAs(sbrToken);

  let nonZeroSBROrUndefined: TokenAmount | undefined = undefined;
  if (sbrTokenAccount && sbrTokenAccount.balance.isNonZero()) {
    nonZeroSBROrUndefined = sbrTokenAccount.balance;
  }

  // Show nothing until we have fetched SBR, so that we don't flash SOL
  const amountToDisplay =
    sbrToken === undefined && sbrTokenAccount === undefined
      ? undefined
      : nonZeroSBROrUndefined ??
        solBalance ??
        new TokenAmount(RAW_SOL[network], 0);

  const inner = (
    <>
      {network !== "mainnet-beta" && (
        <NetworkName
          onClick={() => {
            setMode("change-network");
            setShowSettings(true);
          }}
        >
          {networkName}
        </NetworkName>
      )}
      {wallet ? (
        <>
          <Wrapper onClick={() => setShowSettings(true)}>
            <Info>
              <AccountIcon />
              <InfoText>
                <Balance>
                  {amountToDisplay === undefined ? (
                    "\u00A0" // &nsbp;
                  ) : (
                    <TokenAmountDisplay
                      amount={amountToDisplay}
                      numberFormatOptions={{
                        maximumFractionDigits: 4,
                      }}
                    />
                  )}
                </Balance>
                <TextAddress>
                  {shortenAddress(`${wallet.publicKey.toString()}`)}
                </TextAddress>
              </InfoText>
            </Info>
            <DownIcon />
          </Wrapper>
          <DialectButton />
        </>
      ) : (
        <Button size="small" variant="secondary" onClick={connect}>
          Connect Wallet
        </Button>
      )}
    </>
  );

  return (
    <>
      <WalletSettingsModal
        mode={mode}
        setMode={setMode}
        isOpen={showSettings}
        onDismiss={() => setShowSettings(false)}
      />
      {isMobile ? <MobileWrapper>{inner}</MobileWrapper> : inner}
    </>
  );
};

const NetworkName = styled.div`
  padding: 8px 12px;
  border-radius: 8px;
  line-height: 1em;
  font-weight: 600;
  ${tw`bg-gold-700 text-gold hover:bg-gold-600`}
  margin-right: 12px;
  cursor: pointer;
  transition: all 0.3s ease;
`;

const MobileWrapper = styled.div`
  position: fixed;
  left: 0;
  bottom: 0;
  height: 80px;
  width: 100vw;
  background: ${({ theme }) => theme.colors.base.secondary};

  display: flex;
  flex-direction: row-reverse;
  justify-content: space-between;
  align-items: center;
  padding: 0 19px;
  ${NetworkName} {
    margin-left: 12px;
    margin-right: 0;
  }
`;

const DownIcon = styled(FaCaretDown)`
  fill: ${({ theme }) => theme.colors.text.muted};
`;

const Balance = styled.div`
  font-weight: 600;
  font-size: 14px;
  line-height: 16.71px;
  color: ${({ theme }) => theme.colors.text.bold};
`;

const TextAddress = styled.div`
  font-size: 12px;
  line-height: 14.32px;
  color: ${({ theme }) => theme.colors.text.default};
`;

const InfoText = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1px;
`;

const Info = styled.div`
  display: grid;
  grid-template-columns: 32px 1fr;
  grid-column-gap: 8px;
`;

const AccountIcon = styled.div`
  background: linear-gradient(180deg, #d329fc 0%, #8f6dde 49.48%, #19e6ad 100%);
  width: 32px;
  height: 32px;
  border-radius: 100%;
`;

const Wrapper = styled.div`
  border-radius: 16px;
  background-color: ${({ theme }) => theme.colors.base.secondary};
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 180px;
  ${breakpoints.mobile} {
    width: 100%;
  }
  padding: 8px;

  ${({ theme }) => theme["swap box shadow"]};

  &:hover {
    cursor: pointer;
    background-color: ${({ theme }) => theme.colors.base.tertiary};
  }
  transition: 0.3s ease;
`;
