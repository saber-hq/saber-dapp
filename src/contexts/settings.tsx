import { Percent } from "@saberhq/token-utils";
import React, { useContext, useState } from "react";

export enum IWithdrawalMode {
  ALL = "ALL",
  ONE = "ONE",
}

interface ISettings {
  /**
   * Maximum amount of tolerated slippage, in [0, 1].
   */
  maxSlippagePercent: Percent;
  setMaxSlippagePercent: (amt: Percent) => void;
  /**
   * Either withdraw all tokens or only one token.
   */
  withdrawalMode: IWithdrawalMode;
  setWithdrawalMode: (mode: IWithdrawalMode) => void;

  /**
   * Whether or not to include decimal-wrapped tokens in selectors.
   */
  includeWrapped: boolean;
  setIncludeWrapped: (value: boolean) => void;
}

export const SettingsContext = React.createContext<ISettings | null>(null);

interface IProps {
  children: React.ReactNode;
}

export const SettingsProvider: React.FC<IProps> = ({ children }: IProps) => {
  const [maxSlippagePercent, setMaxSlippagePercent] = useState<Percent>(
    new Percent(10, 10_000),
  );
  const [withdrawalMode, setWithdrawalMode] = useState<IWithdrawalMode>(
    IWithdrawalMode.ALL,
  );
  const [includeWrapped, setIncludeWrapped] = useState<boolean>(false);
  return (
    <SettingsContext.Provider
      value={{
        maxSlippagePercent,
        setMaxSlippagePercent,
        withdrawalMode,
        setWithdrawalMode,
        includeWrapped,
        setIncludeWrapped,
      }}
    >
      {children}
    </SettingsContext.Provider>
  );
};

export const useSettings = (): ISettings => {
  const settings = useContext(SettingsContext);
  if (!settings) {
    throw new Error(`Not in settings context`);
  }
  return settings;
};
