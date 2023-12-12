import {
  useConnectedWallet,
  useConnectionContext,
  useWallet,
} from "@saberhq/use-solana";
import { ExtraErrorData as ExtraErrorDataIntegration } from "@sentry/integrations";
import * as Sentry from "@sentry/react";
import { BrowserTracing } from "@sentry/tracing";
import React, { useEffect } from "react";
import {
  createRoutesFromChildren,
  matchRoutes,
  Routes,
  useLocation,
  useNavigationType,
} from "react-router-dom";

export const SentryRoutes = Sentry.withSentryReactRouterV6Routing(Routes);

/**
 * Sets up analytics. Only call this file ONCE.
 */
export const useAnalytics = (): void => {
  const { network } = useConnectionContext();
  const wallet = useConnectedWallet();
  const { walletProviderInfo } = useWallet();
  const location = useLocation();

  // Google Analytics
  useEffect(() => {
    window.gtag?.("event", "page_view", {
      page_path: location.pathname + location.search,
      page_location: location.key ?? window.location.href,
      page_title: document.title,
    });
  }, [location.key, location.pathname, location.search]);

  const owner = wallet?.publicKey;
  useEffect(() => {
    if (owner) {
      Sentry.setUser({
        id: owner.toString(),
      });
    } else {
      Sentry.configureScope((scope) => scope.setUser(null));
    }
  }, [owner]);

  useEffect(() => {
    Sentry.setTag("network", network);
    Sentry.setTag("wallet.provider", walletProviderInfo?.name);
  }, [network, walletProviderInfo?.name]);

  useEffect(() => {
    if (process.env.REACT_APP_SENTRY_DSN) {
      const sentryCfg = {
        environment:
          process.env.REACT_APP_SENTRY_ENV ??
          `${process.env.REACT_APP_VERCEL_ENV ?? "unknown"}`,
        release:
          process.env.REACT_APP_SENTRY_RELEASE ??
          `${
            process.env.REACT_APP_VERCEL_GIT_COMMIT_REF?.replace(/\//g, "--") ??
            "unknown"
          }-${process.env.REACT_APP_VERCEL_GIT_COMMIT_SHA ?? "unknown"}`,
      };
      Sentry.init({
        dsn: process.env.REACT_APP_SENTRY_DSN,
        integrations: [
          new ExtraErrorDataIntegration({
            depth: 3,
          }),
          new BrowserTracing({
            routingInstrumentation: Sentry.reactRouterV6Instrumentation(
              React.useEffect,
              useLocation,
              useNavigationType,
              createRoutesFromChildren,
              matchRoutes,
            ),
          }),
        ],
        tracesSampleRate: 0.2,
        ignoreErrors: [
          // phantom error
          "Cannot assign to read only property 'solana' of object '#<Window>'",
          // wallet disconnected
          "Wallet disconnected",
        ],
        ...sentryCfg,
      });

      console.log(
        `Initializing Sentry environment at release ${sentryCfg.release} in environment ${sentryCfg.environment}`,
      );
    } else {
      console.warn(
        `REACT_APP_SENTRY_DSN not found. Sentry will not be loaded.`,
      );
    }
  }, []);
};
