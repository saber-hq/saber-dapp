import { TokenAmount } from "@saberhq/token-utils";
import { useConnectedWallet } from "@saberhq/use-solana";
import React, { useEffect, useState } from "react";
import CountUp from "react-countup";
import { css } from "twin.macro";

import { useSDK } from "../../../../contexts/sdk";
import { SBR_INFO } from "../../../../utils/builtinTokens";
import { useGovernanceToken } from "../../../../utils/farming/useGovernanceToken";
import { AttributeList } from "../../../common/AttributeList";
import { Button } from "../../../common/Button";
import { LoadingPage } from "../../../common/LoadingPage";
import { LoadingSpinner } from "../../../common/LoadingSpinner";
import { MainLayout } from "../../../layout/MainLayout";
import { SubLayout } from "../../../layout/SubLayout";
import { ClaimModal } from "./ClaimModal";
import type { ReleaseQuantities } from "./useUserLockup";
import { useUserLockup } from "./useUserLockup";

export const LockupView: React.FC = () => {
  const { saber } = useSDK();
  const wallet = useConnectedWallet();
  const { release, key, loading, getQuantities } = useUserLockup();
  const { data: token } = useGovernanceToken();

  const [showClaimModal, setShowClaimModal] = useState<boolean>(false);

  const [quantities, setQuantities] = useState<ReleaseQuantities | null>(null);
  useEffect(() => {
    if (!key) {
      return;
    }
    const interval = setInterval(() => {
      setQuantities(getQuantities());
    }, 1_000);
    return () => clearInterval(interval);
  }, [getQuantities, key]);

  const availableForWithdrawal = quantities?.availableForWithdrawal;

  const [initialAvailableForWithdrawal, setInitialAvailableForWithdrawal] =
    useState<TokenAmount | null>(null);
  useEffect(() => {
    if (availableForWithdrawal && !initialAvailableForWithdrawal) {
      setInitialAvailableForWithdrawal(availableForWithdrawal);
    }
  }, [availableForWithdrawal, initialAvailableForWithdrawal]);

  return (
    <MainLayout title="Lockup" hideOptions>
      {!wallet ? (
        <p>You must connect your wallet to view this page.</p>
      ) : loading ? (
        <LoadingSpinner />
      ) : !release ? (
        <p>
          You are not eligible for a lockup. If you believe you have reached
          this page in error, please contact the team.
        </p>
      ) : (
        <>
          <ClaimModal
            isOpen={showClaimModal}
            onDismiss={() => setShowClaimModal(false)}
            availableForWithdrawal={availableForWithdrawal}
            onClaim={() => {
              if (initialAvailableForWithdrawal) {
                setInitialAvailableForWithdrawal(
                  new TokenAmount(initialAvailableForWithdrawal.token, 0),
                );
              }
            }}
          />
          <SubLayout title="Claim">
            {availableForWithdrawal ? (
              <div
                css={css`
                  display: flex;
                  flex-direction: column;
                  align-items: center;
                  justify-content: center;

                  color: #fff;
                  width: 100%;
                  font-size: 24px;
                  padding: 24px 0;
                `}
              >
                <span
                  css={css`
                    margin-right: 4px;
                  `}
                >
                  Claim
                </span>
                <span
                  css={css`
                    font-size: 48px;
                    font-weight: 600;
                  `}
                >
                  {initialAvailableForWithdrawal ? (
                    <CountUp
                      preserveValue
                      useEasing={false}
                      start={parseFloat(
                        initialAvailableForWithdrawal.toExact(),
                      )}
                      end={parseFloat(availableForWithdrawal.toExact())}
                      duration={1}
                      decimals={SBR_INFO.decimals}
                      formattingFn={(n) =>
                        n.toLocaleString(undefined, {
                          minimumFractionDigits: 6,
                          maximumFractionDigits: 6,
                        })
                      }
                    />
                  ) : (
                    "0"
                  )}
                </span>
                <span>SBR</span>
              </div>
            ) : (
              <LoadingPage
                css={css`
                  padding: 24px 0;
                `}
              />
            )}
            <Button
              size="large"
              disabled={!saber}
              onClick={() => setShowClaimModal(true)}
            >
              Claim
            </Button>
          </SubLayout>
          <SubLayout title="Your Lockup">
            <AttributeList
              attributes={{
                "Amount Withdrawn": quantities?.withdrawnAmount,
                "Total Released": quantities?.totalReleased,
                "Total Outstanding": quantities?.outstandingReleased,
                "Available for Withdrawal": quantities?.availableForWithdrawal,
                "Release Start": release
                  ? new Date(parseFloat(release.startTs.toString()) * 1000)
                  : null,
                "Release End": release
                  ? new Date(parseFloat(release.endTs.toString()) * 1000)
                  : null,
                Beneficiary: release.beneficiary,
                "Total Allocation": token
                  ? new TokenAmount(token, release.startBalance)
                  : null,
              }}
            />
          </SubLayout>
          <SubLayout title="About lockups">
            <p>Lockups are subject to a {52 * 2} week linear release period.</p>
            <p>
              Tokens are released continuously, meaning that the total number of
              tokens one may claim increases every block.
            </p>
          </SubLayout>
        </>
      )}
    </MainLayout>
  );
};

export default LockupView;
