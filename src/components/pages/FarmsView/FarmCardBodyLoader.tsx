import React from "react";

import { LineItem } from "./LineItem";

export const FarmCardBodyLoader: React.FC = () => {
  return (
    <>
      <LineItem label="Total Staked">{undefined}</LineItem>
      <LineItem label="APY">{undefined}</LineItem>
    </>
  );
};
