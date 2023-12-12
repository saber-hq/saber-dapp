import React, { useEffect } from "react";
import {
  Navigate,
  Outlet,
  Route,
  useLocation,
  useNavigate,
} from "react-router-dom";

import { PoolCreateView } from "./components/pages/PoolCreateView";
import { TokenAccountCreatorView } from "./components/pages/tools/TokenAccountCreatorView";
import { WrapperCreatorView } from "./components/pages/tools/WrapperCreatorView";
import { SentryRoutes, useAnalytics } from "./utils/useAnalytics";

const FarmsView = React.lazy(() => import("./components/pages/FarmsView"));
const SwapView = React.lazy(() => import("./components/pages/SwapView"));
const SimView = React.lazy(() => import("./components/pages/tools/SimView"));
const PoolsView = React.lazy(() => import("./components/pages/PoolsView"));
const PoolView = React.lazy(() => import("./components/pages/PoolView"));
const QuarryView = React.lazy(() => import("./components/pages/QuarryView"));
const AirdropView = React.lazy(() => import("./components/pages/AirdropView"));
const LockupView = React.lazy(
  () => import("./components/pages/tools/LockupView"),
);

export const SaberRoutes: React.FC = () => {
  useAnalytics();

  // remove hashes
  const { hash } = useLocation();
  const navigate = useNavigate();
  useEffect(() => {
    if (hash.startsWith("#/")) {
      navigate(hash.replace("#", ""), {
        replace: true,
      });
    }
  }, [hash, navigate]);

  return (
    <SentryRoutes>
      <Route path="/" element={<Navigate to="/swap" />} />
      <Route path="swap" element={<SwapView />} />

      <Route path="pools/create" element={<PoolCreateView />} />
      <Route path="pools/currencies/:currency" element={<PoolsView />} />
      <Route path="pools/:poolID" element={<Outlet />}>
        <Route path="*" element={<PoolView />} />
        <Route path="" element={<Navigate to="deposit" />} />
      </Route>
      <Route
        path="pools"
        element={
          <>
            <PoolsView />
            <Navigate to="/pools/currencies/usd" replace />
          </>
        }
      />

      <Route path="farms/:currency" element={<FarmsView />} />
      <Route
        path="farms"
        element={
          <>
            <FarmsView />
            <Navigate to="/farms/my-farms" replace />
          </>
        }
      />
      <Route path="quarries/:poolID" element={<Outlet />}>
        <Route path="*" element={<QuarryView />} />
        <Route path="" element={<Navigate to="stake" />} />
      </Route>

      <Route path="airdrop" element={<AirdropView />} />

      <Route path="tools/simulate" element={<SimView />} />
      <Route path="tools/lockup" element={<LockupView />} />
      <Route
        path="tools/token-account-creator"
        element={<TokenAccountCreatorView />}
      />
      <Route
        path="tools/create-decimal-wrapper"
        element={<WrapperCreatorView />}
      />

      <Route path="" element={<Navigate to="/" />} />
    </SentryRoutes>
  );
};
