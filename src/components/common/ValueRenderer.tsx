import { Percent, Token, TokenAmount } from "@saberhq/token-utils";
import { PublicKey } from "@solana/web3.js";
import BN from "bn.js";
import React from "react";

import { formatPercent } from "../../utils/format";
import { AddressLink } from "./AddressLink";
import { LoadingSpinner } from "./LoadingSpinner";
import { TokenAmountDisplay } from "./TokenAmountDisplay";
import { TokenInfo } from "./TokenDropdown/TokenInfo";

interface Props {
  loading?: boolean;
  value: unknown;
}

export const ValueRenderer: React.FC<Props> = ({
  loading = true,
  value,
}: Props) => (
  <>
    {value === undefined ? (
      loading ? (
        <LoadingSpinner />
      ) : (
        "(undefined)"
      )
    ) : value === null ? (
      "(null)"
    ) : value instanceof Date ? (
      value.getTime() === 0 ? (
        "never"
      ) : (
        value.toLocaleString()
      )
    ) : value instanceof PublicKey ? (
      <AddressLink address={value} showCopy />
    ) : typeof value === "object" &&
      "_bn" in (value as Record<string, unknown>) ? (
      <AddressLink
        address={new PublicKey((value as PublicKey).toString())}
        showCopy
      />
    ) : value instanceof TokenAmount ? (
      <TokenAmountDisplay showIcon amount={value} />
    ) : value instanceof Percent ||
      (typeof value === "object" &&
        (value as Record<string, unknown>)?.isPercent) ? (
      formatPercent(value as Percent)
    ) : typeof value === "string" ? (
      value
    ) : typeof value === "number" ? (
      value.toLocaleString()
    ) : typeof value === "boolean" ? (
      value.toLocaleString()
    ) : BN.isBN(value) ? (
      value.toString()
    ) : value instanceof Token ? (
      <TokenInfo token={value} />
    ) : (
      (value as React.ReactNode)
    )}
  </>
);
