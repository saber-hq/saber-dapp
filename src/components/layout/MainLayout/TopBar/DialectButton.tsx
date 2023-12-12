import "@dialectlabs/react-ui/index.css";

import { defaultVariables, NotificationsButton } from "@dialectlabs/react-ui";
import { ClassNames } from "@emotion/react";
import { useConnectedWallet, useConnectionContext } from "@saberhq/use-solana";
import { PublicKey } from "@solana/web3.js";
import tw from "twin.macro";

import { breakpoints } from "../../../../theme/breakpoints";

const SABER_MONITORING_KEY = new PublicKey(
  "8q3TtJygtw77UfMZYBN2o1QAEEquCN2Wxk61w3fsxT9n",
);

const SABER_NOTIFICATION_TYPES = [
  {
    name: "Stake confirmation",
    detail: "On Stake",
  },
  {
    name: "Farm rewards claimed",
    detail: "On Claim",
  },
];

export const DialectButton: React.FC = () => {
  const wallet = useConnectedWallet();
  const { network } = useConnectionContext();
  return (
    <ClassNames>
      {({ css }) => (
        <NotificationsButton
          wallet={wallet}
          publicKey={SABER_MONITORING_KEY}
          notifications={SABER_NOTIFICATION_TYPES}
          network={network === "mainnet-beta" ? "mainnet" : network}
          variables={{
            dark: {
              colors: {
                bg: css`
                  ${tw`bg-saberGray-secondary`}
                `,
                highlight: css`
                  ${tw`bg-saberGray-tertiary`}
                `,
              },
              modalWrapper: `${defaultVariables.dark.modalWrapper} ${css`
                ${tw`sm:h-[28rem]`}
              `}`,
              modal: `${defaultVariables.dark.modal} ${css`
                ${tw`border border-saberGray-tertiary`}
              `}`,
              bellButton: css`
                ${tw`rounded-2xl bg-mono-50 ml-2 h-[48px] p-3`}
                ${breakpoints.mobile} {
                  ${tw`ml-0 mr-2`}
                }
              `,
            },
          }}
        />
      )}
    </ClassNames>
  );
};

export default DialectButton;
