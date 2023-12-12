import { SBR_MINT } from "@saberhq/saber-periphery";

export const SBR_INFO = {
  name: "Saber Protocol Token",
  symbol: "SBR",
  address: SBR_MINT,
  logoURI: "https://registry.saber.so/token-icons/sbr.svg",
  decimals: 6,
};

/**
 * Tags on tokens.
 */
export enum Tags {
  DecimalWrapped = "saber-dec-wrapped",
  Hidden = "saber-hidden",
  StableSwapLP = "saber-stableswap-lp",
  Swappable = "saber-swappable",
}
