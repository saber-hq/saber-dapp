import type { Network } from "@saberhq/solana-contrib";
import React from "react";
import ReactDOMServer from "react-dom/server";
import type { ToastPosition } from "react-hot-toast";
import { toast } from "react-hot-toast";
import { styled } from "twin.macro";

interface INotifyArgs {
  message?: string;
  description?: React.ReactNode;
  txid?: string;
  txids?: string[];
  env?: Network;
  type?: "info" | "warn" | "error" | "success";
  position?: ToastPosition;
}

export const InsufficientSOLMessage: INotifyArgs = {
  message: "Insufficient SOL balance",
  description:
    "Your account does not have enough SOL to pay for this transaction. Please fund your account.",
  type: "error",
};

export function notify({
  message,
  description,
  txid,
  txids,
  env,
  type = "success",
  position = "bottom-left",
}: INotifyArgs): void {
  // log for Sentry and other debug purposes
  const logLevel =
    type === "warn" ? "warn" : type === "error" ? "error" : "info";
  console[logLevel](
    `Notify: ${message ?? "<no message>"} -- ${
      typeof description === "string"
        ? description
        : ReactDOMServer.renderToStaticMarkup(<>{description}</>)
    }`,
    {
      env,
      txid,
      txids,
      type,
    },
  );

  if (txids?.length === 1) {
    txid = txids[0];
  }
  if (txid) {
    description = (
      <div>
        View Transaction:{" "}
        <a
          href={`https://explorer.solana.com/tx/${txid}?cluster=${
            env?.toString() ?? ""
          }`}
          target="_blank"
          rel="noopener noreferrer"
        >
          {txid.slice(0, 8)}...{txid.slice(txid.length - 8)}
        </a>
      </div>
    );
  } else if (txids) {
    description = (
      <div>
        View Transactions:{" "}
        <TxContainer>
          {txids.map((txid, i) => (
            <a
              key={i}
              href={`https://explorer.solana.com/tx/${txid}?cluster=${
                env?.toString() ?? ""
              }`}
              target="_blank"
              rel="noopener noreferrer"
            >
              [{i + 1}]
            </a>
          ))}
        </TxContainer>
      </div>
    );
  }

  toast(
    <div tw="flex flex-col text-sm gap-1">
      <div tw="font-semibold text-secondary">{message}</div>
      {description && <div tw="text-mono-400">{description}</div>}
    </div>,
    {
      duration: 6000,
      position,
    },
  );
}

const TxContainer = styled.div`
  display: inline-flex;
  gap: 4px;
`;
