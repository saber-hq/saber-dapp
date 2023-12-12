import "react-app-polyfill/stable";

import { ThemeProvider } from "@emotion/react";
import type { SaberPrograms } from "@saberhq/saber-periphery";
import { SABER_ADDRESSES, SABER_IDLS } from "@saberhq/saber-periphery";
import type {
  SailError,
  SailGetMultipleAccountsError,
  SailTransactionError,
  SailUnknownTXFailError,
  UseSailArgs,
} from "@saberhq/sail";
import { SailProvider } from "@saberhq/sail";
import { TransactionErrorType } from "@saberhq/sail/dist/cjs/errors/categorizeTransactionError";
import { RAW_SOL, TokenAmount } from "@saberhq/token-utils";
import * as Sentry from "@sentry/react";
import type { PublicKey } from "@solana/web3.js";
import { SendTransactionError } from "@solana/web3.js";
import { mapValues } from "lodash-es";
import React from "react";
import { QueryClient, QueryClientProvider } from "react-query";
import { ReactQueryDevtools } from "react-query/devtools";

import { App } from "./App";
import { ConfigProvider } from "./contexts/config";
import { SDKProvider } from "./contexts/sdk";
import { WalletConnectorProvider } from "./contexts/wallet";
import { theme } from "./theme";
import { parseIdlErrors, ProgramError } from "./utils/anchorError";
import { describeRPCError, handleException } from "./utils/error";
import { notify } from "./utils/notifications";
import { RPCHealthProvider } from "./utils/useRPCHealthAndNotifier";

type ProgramKey = keyof SaberPrograms;

const programErrors = mapValues({ ...SABER_IDLS }, (prog) =>
  parseIdlErrors(prog),
);

const programIDs = Object.entries(SABER_ADDRESSES).reduce(
  (acc, [name, prog]: [name: string, prog: PublicKey]) => ({
    ...acc,
    [prog.toString()]: name,
  }),
  {},
) as Record<string, ProgramKey>;

const onTxSend: UseSailArgs["onTxSend"] = ({ network, pending, message }) => {
  notify({
    message,
    txids: pending.map((p) => p.signature),
    env: network,
  });
};

const onTxError = (error: SailTransactionError) => {
  // Log the program error
  const err = error.originalError as Error;
  const { tx } = error;

  if (!err.message) {
    handleException(err, {
      userMessage: {
        title: "Unknown error when processing transaction",
      },
    });
    return;
  }

  const logsList = err instanceof SendTransactionError ? err.logs : null;
  const logs = logsList?.join("\n") ?? null;

  if (logs?.includes(": custom program error:")) {
    // todo: figure out the duplicates
    const inspectLink = tx.generateInspectLink();
    console.error(`TX`, inspectLink);
    const progError = ProgramError.parse(logs, tx, programIDs, programErrors);
    if (progError) {
      const message = err.message.split(":")[1] ?? "Transaction failed";
      handleException(progError, {
        userMessage: {
          title: message,
          description: `${progError.message}`,
        },
        network: error.network,
        tags: {
          program: progError.program ?? "AnchorInternal",
          "program.error.code": progError.code.toString(),
          "program.error.name": progError.errorName,
        },
        extra: {
          progError,
          message,
          originalError: err,
        },
      });
      return;
    }
  }

  const insufficientLamportsMatch = logsList
    ?.map((l) => /Transfer: insufficient lamports (\d+), need (\d+)/g.exec(l))
    .find((m) => !!m);
  if (insufficientLamportsMatch) {
    const [, current, required] = insufficientLamportsMatch;
    try {
      const currentAmt = current ? parseInt(current) : null;
      const requiredAmt = required ? parseInt(required) : null;
      if (currentAmt && requiredAmt) {
        notify({
          message: "SOL balance too low",
          description: `This action requires ${new TokenAmount(
            RAW_SOL[error.network],
            requiredAmt,
          ).formatUnits()}, but your wallet only has ${new TokenAmount(
            RAW_SOL[error.network],
            currentAmt,
          ).formatUnits()}. Consider adding more SOL to your wallet or spending less SOL in this transaction.`,
          env: error.network,
          type: "error",
        });
      }
    } catch (e) {
      notify({
        message: "SOL balance too low",
        description: error.message,
        env: error.network,
        type: "warn",
      });
    }
    return;
  } else if (error.tag === TransactionErrorType.Cancelled) {
    notify({
      message: "Transaction cancelled",
      description: error.message,
      env: error.network,
      type: "info",
    });
    return;
  } else if (error.tag === TransactionErrorType.SignatureRequestDenied) {
    notify({
      message: `Signature request denied`,
      description: error.message,
      env: error.network,
      type: "info",
    });
    return;
  }

  handleException(error, {
    userMessage: {
      title: "Transaction failed (try again later)",
    },
    source: "onTxError",
    tags: error.tag
      ? {
          "tx.error": error.tag,
        }
      : {},
    extra: {
      txDump: error.generateLogMessage(),
    },
    fingerprint: error.fingerprint,
  });
};

const onGetMultipleAccountsError = (
  err: SailGetMultipleAccountsError,
): void => {
  handleException(err, {
    source: "onGetMultipleAccountsError",
    userMessage: {
      title: "Error fetching data from Solana",
      description: describeRPCError(
        err.originalError instanceof Error
          ? err.originalError.message
          : err.message,
      ),
    },
  });
  return;
};

const onSailError = (err: SailError) => {
  switch (err.sailErrorName) {
    case "SailTransactionError":
      onTxError(err as SailTransactionError);
      return;
    case "SailTransactionSignError":
      notify({
        message: err.title,
        description: err.cause,
        type: "error",
      });
      return;
    case "SailUnknownTXFailError": {
      const failErr = err as SailUnknownTXFailError;
      failErr.txs.forEach((tx, i) => {
        console.error(`TX #${i}:`, tx.debugStr);
      });
      handleException(err, {
        userMessage: {
          title: "Transaction failed",
        },
        tags: {
          network: failErr.network,
        },
      });
      return;
    }
    case "SailGetMultipleAccountsError":
      onGetMultipleAccountsError(err as SailGetMultipleAccountsError);
      return;
    case "SailInsufficientSOLError":
      notify({
        message: "Insufficient SOL",
        description: "You need SOL to be able to perform this action.",
        type: "error",
      });
      return;
    default:
      console.error("Sail error", err);
      Sentry.captureException(err);
  }
};

const queryClient = new QueryClient();

export const AppWithProviders: React.FC = () => {
  return (
    <React.StrictMode>
      <QueryClientProvider client={queryClient}>
        <ConfigProvider>
          <ThemeProvider theme={theme}>
            <WalletConnectorProvider>
              <RPCHealthProvider>
                <SailProvider
                  initialState={{
                    batchDurationMs: 20,
                    onTxSend,
                    onSailError,
                  }}
                >
                  <SDKProvider>
                    <App />
                  </SDKProvider>
                </SailProvider>
              </RPCHealthProvider>
            </WalletConnectorProvider>
          </ThemeProvider>
        </ConfigProvider>
        <ReactQueryDevtools initialIsOpen={false} />
      </QueryClientProvider>
    </React.StrictMode>
  );
};
