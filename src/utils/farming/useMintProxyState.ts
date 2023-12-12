import type { MintProxyTypes } from "@saberhq/saber-periphery";
import { SABER_CODERS } from "@saberhq/saber-periphery";
import { useAccountData } from "@saberhq/sail";
import type { PublicKey } from "@solana/web3.js";
import { useEffect, useMemo, useState } from "react";

import { useSDK } from "../../contexts/sdk";

export const useMintProxyState = (): {
  loading: boolean;
  state: MintProxyTypes["State"] | null;
} => {
  const { saberReadOnly } = useSDK();
  const [mintProxyAddress, setMintProxyAddress] = useState<PublicKey | null>(
    null,
  );
  useEffect(() => {
    void (() => {
      const mintProxy = SABER_CODERS.MintProxy.getProgram(
        saberReadOnly.provider,
      );
      setMintProxyAddress(mintProxy.state.address());
    })();
  }, [saberReadOnly.provider]);

  const { loading, data: mintProxyData } = useAccountData(mintProxyAddress);
  const mintProxyState = useMemo(() => {
    const data = mintProxyData?.accountInfo.data;
    if (data) {
      return saberReadOnly.programs.MintProxy.coder.state.decode<
        MintProxyTypes["State"]
      >(data);
    } else {
      return null;
    }
  }, [
    mintProxyData?.accountInfo.data,
    saberReadOnly.programs.MintProxy.coder.state,
  ]);

  return {
    loading,
    state: mintProxyState,
  };
};
