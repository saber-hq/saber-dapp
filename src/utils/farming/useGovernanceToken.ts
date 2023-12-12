import { useToken } from "@saberhq/sail";
import { PublicKey } from "@solana/web3.js";

import { SBR_INFO } from "../builtinTokens";

const SBR_ADDRESS = new PublicKey(SBR_INFO.address);

/**
 * Governance token loading
 * @returns
 */
export const useGovernanceToken = () => {
  return useToken(SBR_ADDRESS);
};
