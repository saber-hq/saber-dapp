import {
  MinerProvider,
  QuarrySDKProvider,
  RewarderProvider,
} from "@quarryprotocol/react-quarry";
import { SBR_REWARDER } from "@saberhq/saber-periphery";

import { useEnvironment } from "../utils/useEnvironment";

interface Props {
  children?: React.ReactNode;
}

export const SaberQuarryProvider: React.FC<Props> = ({ children }: Props) => {
  const { tokenMap } = useEnvironment();
  return (
    <QuarrySDKProvider
      initialState={{
        tokenMap: tokenMap ?? undefined,
      }}
    >
      <RewarderProvider initialState={{ rewarderKey: SBR_REWARDER }}>
        <MinerProvider>{children}</MinerProvider>
      </RewarderProvider>
    </QuarrySDKProvider>
  );
};
