import { useConnectedWallet, useConnectionContext } from "@saberhq/use-solana";
import copy from "copy-to-clipboard";
import React, { useMemo } from "react";
import {
  FaClipboard,
  FaGlobeAsia,
  FaPiggyBank,
  FaPowerOff,
  FaSatelliteDish,
} from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import { styled } from "twin.macro";

import { useConfig } from "../../../../contexts/config";
import { DEFAULT_ENDPOINT_LABEL } from "../../../../utils/environments";
import { notify } from "../../../../utils/notifications";
import type { ModalProps as IModalProps } from "../../../common/Modal";
import { Modal } from "../../../common/Modal";
import { ModalResults } from "../../../common/Modal/ModalResults";
import { useUserLockup } from "../../../pages/tools/LockupView/useUserLockup";

export type MODAL_MODES = "change-network" | "change-rpc" | "settings";

type IProps = Omit<IModalProps, "children" | "title"> & {
  mode: MODAL_MODES;
  setMode: (network: MODAL_MODES) => void;
};

export const WalletSettingsModal: React.FC<IProps> = ({
  mode,
  setMode,
  ...modalProps
}: IProps) => {
  const wallet = useConnectedWallet();
  const { network: selectedNetwork, setNetwork } = useConnectionContext();
  const navigate = useNavigate();
  const { release } = useUserLockup();
  const { environments, currentAlternateEndpoint, setAlternateEndpoint } =
    useConfig();

  const onDismiss = () => {
    setMode("settings");
    modalProps.onDismiss();
  };

  const rpcEndpointNamesForNetwork = useMemo(() => {
    const rpcEndpointNamesForNetwork: string[] = [DEFAULT_ENDPOINT_LABEL];
    const altEndpoints = environments[selectedNetwork]?.alternateEndpoints;
    if (altEndpoints) {
      rpcEndpointNamesForNetwork.push(...Object.keys(altEndpoints));
    }
    return rpcEndpointNamesForNetwork;
  }, [environments, selectedNetwork]);

  if (mode === "change-network") {
    return (
      <Modal title="Change Network" {...modalProps} onDismiss={onDismiss}>
        <ModalResults
          results={(["mainnet-beta", "devnet"] as const).map((network) => {
            const env = environments[network];
            return {
              key: network,
              content: (
                <Option>
                  <FaGlobeAsia />
                  <span>{env.name}</span>
                </Option>
              ),
              onClick: async () => {
                await setNetwork(network);
                setMode("settings");
                modalProps.onDismiss();
              },
              selected: network === selectedNetwork,
            };
          })}
        />
      </Modal>
    );
  }

  if (mode === "change-rpc") {
    return (
      <Modal title="Change RPC Endpoint" {...modalProps} onDismiss={onDismiss}>
        <ModalResults
          results={rpcEndpointNamesForNetwork.map((rpcEndpointName) => {
            return {
              key: rpcEndpointName,
              content: (
                <Option>
                  <FaSatelliteDish />
                  <span>{rpcEndpointName}</span>
                </Option>
              ),
              onClick: () => {
                setAlternateEndpoint(rpcEndpointName);
                notify({
                  message: "RPC Endpoint update",
                  description: (
                    <div>Switching to endpoint {rpcEndpointName}</div>
                  ),
                });
                setMode("settings");
                modalProps.onDismiss();
              },
              selected:
                (rpcEndpointName === DEFAULT_ENDPOINT_LABEL &&
                  !rpcEndpointNamesForNetwork.includes(rpcEndpointName)) ||
                rpcEndpointName === currentAlternateEndpoint,
            };
          })}
        />
      </Modal>
    );
  }

  const results = [
    {
      key: "change-network",
      content: (
        <Option>
          <FaGlobeAsia />
          <span>Change network</span>
        </Option>
      ),
      onClick: () => {
        setMode("change-network");
      },
    },
    {
      key: "change-rpc",
      content: (
        <Option>
          <FaSatelliteDish />
          <span>Change RPC Endpoint</span>
        </Option>
      ),
      onClick: () => {
        setMode("change-rpc");
      },
    },
    {
      key: "copy-address",
      content: (
        <Option>
          <FaClipboard />
          <span>Copy Address</span>
        </Option>
      ),
      onClick: () => {
        if (wallet) {
          copy(wallet.publicKey.toString());
          notify({
            message: `Copied address to clipboard.`,
          });
        }
        modalProps.onDismiss();
      },
    },
    {
      key: "disconnect",
      content: (
        <Option>
          <FaPowerOff />
          <span>Disconnect wallet</span>
        </Option>
      ),
      onClick: () => {
        void wallet?.disconnect();
        modalProps.onDismiss();
      },
    },
  ];

  if (release) {
    results.unshift({
      key: "lockup",
      content: (
        <Option>
          <FaPiggyBank />
          <span>Manage Lockup</span>
        </Option>
      ),
      onClick: () => {
        navigate("/tools/lockup");
        modalProps.onDismiss();
      },
    });
  }

  return (
    <Modal title="Wallet Settings" {...modalProps} onDismiss={onDismiss}>
      <ModalResults results={results} />
    </Modal>
  );
};

export default WalletSettingsModal;

const Option = styled.div`
  display: flex;
  align-items: center;
  & > svg {
    height: 16px;
    width: 16px;
    margin-right: 12px;
  }
`;
