import type { ReleaseData } from "@saberhq/saber-periphery";
import { SABER_CODERS } from "@saberhq/saber-periphery";
import { useAccountData } from "@saberhq/sail";
import { TokenAmount } from "@saberhq/token-utils";
import { useSolana } from "@saberhq/use-solana";
import type { PublicKey } from "@solana/web3.js";
import BN from "bn.js";
import { useCallback, useMemo } from "react";

import { useGovernanceToken } from "../../../../utils/farming/useGovernanceToken";
import type { ProgramAddressInput } from "../../../../utils/useProgramAddresses";
import {
  ProgramAddressType,
  useProgramAddresses,
} from "../../../../utils/useProgramAddresses";

export interface ReleaseQuantities {
  withdrawnAmount: TokenAmount | null;
  totalReleased: TokenAmount | null;
  outstandingReleased: TokenAmount | null;
  availableForWithdrawal: TokenAmount | null;
}

interface UserLockup {
  release: ReleaseData | null;
  key: PublicKey | null;
  loading: boolean;
  getQuantities: () => ReleaseQuantities;
}

export const useUserLockup = (): UserLockup => {
  const { publicKey } = useSolana();
  const addresses = useMemo(
    (): (ProgramAddressInput | null)[] => [
      publicKey
        ? {
            type: ProgramAddressType.RELEASE,
            path: [publicKey],
          }
        : null,
    ],
    [publicKey],
  );
  const [key] = useProgramAddresses(addresses);

  const { data: releaseData, loading: releaseLoading } = useAccountData(key);
  const release = useMemo(() => {
    if (releaseData) {
      return SABER_CODERS.Lockup.accountParsers.release(
        releaseData.accountInfo.data,
      );
    }
    return null;
  }, [releaseData]);

  const { data: token } = useGovernanceToken();
  const getQuantities = useCallback(() => {
    if (!release || !token) {
      return {
        withdrawnAmount: null,
        totalReleased: null,
        outstandingReleased: null,
        availableForWithdrawal: null,
      };
    }
    const now = new BN(Math.floor(new Date().getTime() / 1000));
    const withdrawnAmount = release.startBalance.sub(release.outstanding);
    const totalReleased = now.lt(release.startTs)
      ? new BN(0)
      : now.gte(release.endTs)
        ? release.startBalance
        : linearUnlock(release, now);

    // The amount of outstanding locked tokens released.
    const outstandingReleased = totalReleased.sub(withdrawnAmount);

    const availableForWithdrawal = BN.min(
      outstandingReleased,
      release.outstanding,
    );

    return {
      withdrawnAmount: new TokenAmount(token, withdrawnAmount),
      totalReleased: new TokenAmount(token, totalReleased),
      outstandingReleased: new TokenAmount(token, outstandingReleased),
      availableForWithdrawal: new TokenAmount(token, availableForWithdrawal),
    };
  }, [release, token]);

  return {
    release,
    key: key ?? null,
    loading: releaseLoading || token === undefined || !key,
    getQuantities,
  };
};

const linearUnlock = (release: ReleaseData, now: BN): BN => {
  if (now.lte(release.startTs)) {
    return new BN(0);
  }
  if (now.gte(release.endTs)) {
    return new BN(release.startBalance);
  }
  return now
    .sub(release.startTs)
    .mul(release.startBalance)
    .div(release.endTs.sub(release.startTs));
};
