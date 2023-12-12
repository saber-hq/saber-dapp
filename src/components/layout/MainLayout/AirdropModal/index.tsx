import { useSolana } from "@saberhq/use-solana";
import React from "react";

const AirdropInner = React.lazy(() => import("./AirdropInner"));

export const AirdropModal: React.FC = () => {
  const { providerMut } = useSolana();
  if (!providerMut) {
    return <></>;
  }
  return <AirdropInner />;
};
