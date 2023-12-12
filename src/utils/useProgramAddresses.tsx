import type { Saber } from "@saberhq/saber-periphery";
import type { PublicKey } from "@solana/web3.js";
import { useEffect, useState } from "react";

import { useSDK } from "../contexts/sdk";

export enum ProgramAddressType {
  RELEASE = "RELEASE",
  MINTER_INFO = "MINTER_INFO",
}

export type ProgramAddressInputPaths = {
  [ProgramAddressType.RELEASE]: readonly [beneficiary: PublicKey];
  [ProgramAddressType.MINTER_INFO]: readonly [minter: PublicKey];
};

const strategies: {
  [T in ProgramAddressType]: (
    path: ProgramAddressInputPaths[T],
    saberReadOnly: Saber,
  ) => Promise<PublicKey>;
} = {
  [ProgramAddressType.RELEASE]: (path, saber) =>
    saber.programs.Lockup.account.release.associatedAddress(path[0]),
  [ProgramAddressType.MINTER_INFO]: (path, saber) =>
    saber.mintProxy.getMinterInfoAddress(path[0]),
};

const associationCache: Record<string, PublicKey> = {};

export type ProgramAddressInput<
  K extends ProgramAddressType = ProgramAddressType,
> = {
  type: K;
  path: ProgramAddressInputPaths[K];
};

const makeCacheKey = ({ type, path }: ProgramAddressInput): string =>
  `${type}|${path.map((p) => p.toString()).join(";")}`;

/**
 * Loads and caches program addresses.
 * @param addresses
 * @returns
 */
export const useProgramAddresses = (
  addresses: (ProgramAddressInput | null)[],
): (PublicKey | null)[] => {
  const { saberReadOnly } = useSDK();
  const [keys, setKeys] = useState<(PublicKey | null)[]>(
    addresses.map((addr) => {
      if (!addr) {
        return null;
      }
      const cacheKey = makeCacheKey(addr);
      if (associationCache[cacheKey]) {
        return associationCache[cacheKey] ?? null;
      }
      return null;
    }),
  );

  useEffect(() => {
    void (async () => {
      setKeys(
        await Promise.all(
          addresses.map(
            async <K extends ProgramAddressType>(
              addr: ProgramAddressInput<K> | null,
            ): Promise<PublicKey | null> => {
              if (!addr) {
                return null;
              }
              const cacheKey = makeCacheKey(addr);
              if (associationCache[cacheKey]) {
                return associationCache[cacheKey] ?? null;
              }
              const strategy = strategies[addr.type] as (
                path: ProgramAddressInputPaths[K],
                saberReadOnly: Saber,
              ) => Promise<PublicKey>;
              const nextKey = await strategy(addr.path, saberReadOnly);
              associationCache[cacheKey] = nextKey;
              return nextKey;
            },
          ),
        ),
      );
    })();
  }, [addresses, saberReadOnly]);

  return keys;
};
