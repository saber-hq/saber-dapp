import { useSolana } from "@saberhq/use-solana";
import type { ReactNode } from "react";
import React from "react";
import { resolveValue, Toaster } from "react-hot-toast";
import { styled } from "twin.macro";

import { globalStyles } from "../../../globalStyles";
import { breakpoints } from "../../../theme/breakpoints";
import { useNetworkTPS } from "../../../utils/useNetworkTPS";
import {
  RPCHealth,
  useRPCHealth,
} from "../../../utils/useRPCHealthAndNotifier";
import useWindowDimensions from "../../../utils/useWindowDimensions";
import { Alert } from "../../common/Alert";
import { ErrorMessage } from "../../common/LabelWrapper";
import { LoadingPage } from "../../common/LoadingPage";
import { AirdropModal } from "./AirdropModal";
import { Banner } from "./Banner";
import { PageLayout, PageWidthContainer } from "./PageLayout";
import { TopBar } from "./TopBar";

interface IProps {
  children: ReactNode | ReactNode[];
  className?: string;
}

export const AppWrapper: React.FC<IProps> = ({
  children,
  className,
}: IProps) => {
  const { health, loading, error } = useRPCHealth();
  const { width } = useWindowDimensions();
  const { data: avgTPS } = useNetworkTPS();
  const { network } = useSolana();

  return (
    <>
      <PageWrapper className={className}>
        {globalStyles}
        {network === "mainnet-beta" && avgTPS && avgTPS < 1250 ? (
          <Banner
            message={
              width < 550
                ? "The Solana network is experiencing degraded performance."
                : "The Solana network is experiencing degraded performance. Transactions may fail to send or confirm."
            }
          />
        ) : (
          <div />
        )}
        <TopBar />
        {loading && <LoadingPage />}
        {health === RPCHealth.UNHEALTHY && (
          <PageLayout title="Error" hideOptions>
            <Alert type="danger">
              <h2>Cannot connect to Solana</h2>
              <p>
                There is an issue with our RPC nodes. Please come back later.
              </p>
              <ErrorMessage>{error?.message}</ErrorMessage>
            </Alert>
          </PageLayout>
        )}
        {health === RPCHealth.HEALTHY && (
          <>
            <PageWidthContainer tw="mb-5">
              <AirdropModal />
            </PageWidthContainer>
            {children}
          </>
        )}
        <Toaster>
          {(t) => (
            <div
              tw="bg-base-100 rounded p-4 max-w-sm"
              style={{
                opacity: t.visible ? 1 : 0,
              }}
            >
              {resolveValue(t.message, t)}
            </div>
          )}
        </Toaster>
      </PageWrapper>
    </>
  );
};

const PageWrapper = styled.div`
  ${breakpoints.mobile} {
    /* for the connect wallet stuff */
    padding-bottom: 104px;
  }
`;
