import { SaberQuarryProvider } from "./contexts/quarry";
import { RouterProvider } from "./contexts/router";
import { SettingsProvider } from "./contexts/settings";
import { SwappableTokensProvider } from "./contexts/swappableTokens";
import { SaberRoutes } from "./routes";
import { AllPoolsProvider } from "./utils/exchange/useAllPoolsWithUserBalances";
import { TVLProvider } from "./utils/exchange/useTVL";
import { AllPlotsProvider } from "./utils/farming/useAllPlots";
import { EnvironmentProvider } from "./utils/useEnvironment";

export const AppInner: React.FC = () => {
  return (
    <SettingsProvider>
      <EnvironmentProvider>
        <SaberQuarryProvider>
          <SwappableTokensProvider>
            <RouterProvider>
              <TVLProvider>
                <AllPoolsProvider>
                  <AllPlotsProvider>
                    <SaberRoutes />
                  </AllPlotsProvider>
                </AllPoolsProvider>
              </TVLProvider>
            </RouterProvider>
          </SwappableTokensProvider>
        </SaberQuarryProvider>
      </EnvironmentProvider>
    </SettingsProvider>
  );
};

export default AppInner;
