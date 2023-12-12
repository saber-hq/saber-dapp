import type { Payroll } from "@quarryprotocol/quarry-sdk";
import type { Percent, TokenAmount } from "@saberhq/token-utils";

export interface PlotStats {
  rewardsShare: Percent | null;
  totalDeposits?: TokenAmount | null;
  payroll: Payroll | null;
  stakedAmount: TokenAmount | null;
  rewardsPerDay: TokenAmount | null;
  userRewardsPerDay: TokenAmount | null;
}
