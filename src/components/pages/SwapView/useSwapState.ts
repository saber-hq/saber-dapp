import type { Token } from "@saberhq/token-utils";
import { TokenAmount } from "@saberhq/token-utils";
import { useCallback, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";

import { useSwappableTokens } from "../../../contexts/swappableTokens";
import { Tags } from "../../../utils/builtinTokens";
import { useEnvironment } from "../../../utils/useEnvironment";

export const useSwapState = (): {
  selectedFrom: Token | null;
  setSelectedFrom: (v: Token) => void;
  selectedTo: Token | null;
  setSelectedTo: (v: Token) => void;

  uiFromAmount: string;
  setUIFromAmount: (v: string) => void;
  uiToAmount: string;
  setUIToAmount: (v: string) => void;

  invertSwap: () => void;
  fromAmount?: TokenAmount;
} => {
  const { tokens, tokenGroups } = useEnvironment();
  const { swappableTokens } = useSwappableTokens();

  const navigate = useNavigate();
  const location = useLocation();

  const { from: selectedFrom, to: selectedTo } = useMemo((): {
    from: Token | null;
    to: Token | null;
  } => {
    const qParams = new URLSearchParams(location.search); // Slice off "#/swap"
    const fromStr = qParams.get("from");
    const toStr = qParams.get("to");

    const desiredFrom =
      (fromStr
        ? swappableTokens.find((tkn) => tkn.address === fromStr)
        : null) ?? null;
    const desiredTo =
      (toStr ? swappableTokens.find((tkn) => tkn.address === toStr) : null) ??
      null;

    const from = (() => {
      if (!desiredFrom && !desiredTo) {
        return tokens.find((tok) => tok.name === "USD Coin") ?? null;
      }
      if (
        desiredTo &&
        (!desiredFrom || !tokenGroups.canTradeWith(desiredFrom, desiredTo))
      ) {
        const others = tokenGroups.getTradeableAssets(desiredTo);
        return (
          others?.find(
            (other) =>
              !other.equals(desiredTo) &&
              !other.info.tags?.includes(Tags.DecimalWrapped),
          ) ?? null
        );
      }
      return desiredFrom;
    })();

    const to = (() => {
      if (from && (!desiredTo || !tokenGroups.canTradeWith(from, desiredTo))) {
        const others = tokenGroups.getTradeableAssets(from);
        const tether = others?.find((t) => t.name === "USDT");
        if (tether) {
          return tether;
        }
        return (
          others?.find(
            (other) =>
              !other.equals(from) &&
              !other.info.tags?.includes(Tags.DecimalWrapped),
          ) ?? null
        );
      } else {
        return desiredTo;
      }
    })();

    return {
      from,
      to,
    };
  }, [location.search, swappableTokens, tokenGroups, tokens]);

  const [selectedTokens, setSelectedTokens] = useState<{
    fromAmount: TokenAmount | null;
  }>({ fromAmount: null });

  const { fromAmount: fromAmountCached } = selectedTokens;

  const [uiFromAmount, setUIFromAmount] = useState<string>("");
  const [uiToAmount, setUIToAmount] = useState<string>("");

  const setFromAmount = useCallback(
    (val: string) => {
      setUIFromAmount(val);
      if (selectedFrom) {
        try {
          const amount = TokenAmount.parse(selectedFrom, val);
          setSelectedTokens({
            ...selectedTokens,
            fromAmount: amount,
          });
        } catch (e) {
          setSelectedTokens({
            ...selectedTokens,
            fromAmount: null,
          });
          setUIToAmount("");
        }
      }
    },
    [selectedTokens, selectedFrom],
  );

  const setTokens = ({
    from,
    to,
  }: {
    from: Token | null;
    to: Token | null;
  }) => {
    navigate(
      `/swap?${from ? `from=${from.address}` : ""}&${
        to ? `to=${to.address}` : ""
      }`,
    );
  };

  const invertSwap = () => {
    let nextFromAmount = null;
    try {
      nextFromAmount = selectedTo
        ? TokenAmount.parse(selectedTo, uiToAmount)
        : null;
    } catch (e) {
      nextFromAmount = null;
    }
    setSelectedTokens({
      fromAmount: nextFromAmount,
    });
    setUIFromAmount(uiToAmount);
    setTokens({
      from: selectedTo,
      to: selectedFrom,
    });
  };

  return {
    selectedFrom,
    selectedTo,
    setSelectedFrom: (v: Token) => {
      const from = v;
      const to = selectedTo === v ? selectedFrom : selectedTo;
      const fromAmount = fromAmountCached
        ? TokenAmount.parse(v, fromAmountCached.toFixed())
        : null;

      // check if we need to change the other token
      if (to && !tokenGroups.canTradeWith(from, to)) {
        const others = tokenGroups.getTradeableAssets(from);
        const nextTo =
          others?.find(
            (other) =>
              !other.equals(from) &&
              !other.info.tags?.includes(Tags.DecimalWrapped),
          ) ?? null;
        setTokens({ from, to: nextTo });
        setSelectedTokens({ fromAmount });
      } else {
        setTokens({ from, to });
        setSelectedTokens({ fromAmount });
      }
    },
    setSelectedTo: (v: Token) => {
      const to = v;
      const from = selectedFrom === v ? selectedTo : selectedFrom;
      const fromAmount =
        from && fromAmountCached
          ? TokenAmount.parse(from, fromAmountCached.toFixed())
          : null;

      if (from && !tokenGroups.canTradeWith(from, to)) {
        const others = tokenGroups.getTradeableAssets(to);
        const nextFrom = others?.find((other) => !other.equals(to)) ?? null;
        setTokens({ from: nextFrom, to });
        setSelectedTokens({ fromAmount });
      } else {
        setTokens({ from, to });
        setSelectedTokens({ fromAmount });
      }
    },

    uiFromAmount,
    setUIFromAmount: setFromAmount,
    uiToAmount,
    setUIToAmount,

    invertSwap,

    fromAmount: fromAmountCached ?? undefined,
  };
};
