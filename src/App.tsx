import React, { Suspense } from "react";
import { BrowserRouter } from "react-router-dom";

import { LoadingPage } from "./components/common/LoadingPage";
import { AppWrapper } from "./components/layout/MainLayout/AppWrapper";

const AppInner = React.lazy(() => import("./AppInner"));

export const App: React.FC = () => {
  return (
    <BrowserRouter basename="/">
      <AppWrapper>
        <Suspense fallback={<LoadingPage />}>
          <AppInner />
        </Suspense>
      </AppWrapper>
    </BrowserRouter>
  );
};
