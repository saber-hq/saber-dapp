import type { PublicKey } from "@solana/web3.js";
import { useCallback, useState } from "react";

export function useLocalStorageState<T>(
  key: string,
  defaultState: T,
): [T, (newState: T) => void] {
  const [state, setState] = useState<T>((): T => {
    // NOTE: Not sure if this is ok
    const storedState = localStorage.getItem(key);
    if (storedState) {
      return JSON.parse(storedState) as T;
    }
    return defaultState;
  });

  const setLocalStorageState = useCallback(
    (newState: T) => {
      const changed = state !== newState;
      if (!changed) {
        return;
      }
      setState(newState);
      if (newState === null) {
        localStorage.removeItem(key);
      } else {
        localStorage.setItem(key, JSON.stringify(newState));
      }
    },
    [state, key],
  );

  return [state, setLocalStorageState];
}

/**
 * shorten the checksummed version of the input address to have 4 characters at start and end
 * @param address
 * @param chars
 * @returns
 */
export function shortenAddress(address: string, chars = 4): string {
  return `${address.substring(0, chars)}...${address.substring(
    address.length - chars,
  )}`;
}

/**
 *
 */
export function generateAnalyticsUrl(poolMint: PublicKey): string {
  return `https://saber.markets/#/pools/${poolMint.toString()}`;
}

export function getSourceName(name: string): string {
  // Exception in the naming case
  if (name.toLowerCase() === "asol") {
    return "aSOL";
  }
  // convert to title case
  const newName = name.replace("-", " ");

  return newName
    .split(" ")
    .map((w) => w.substring(0, 1).toUpperCase() + w.substr(1).toLowerCase())
    .join(" ");
}
