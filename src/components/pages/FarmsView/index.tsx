import React from "react";

import { AllPlotsProvider } from "../../../utils/farming/useAllPlots";
import { FarmsViewInner } from "./FarmsViewInner";

export const FarmsView: React.FC = () => {
  return (
    <AllPlotsProvider>
      <FarmsViewInner />
    </AllPlotsProvider>
  );
};

export default FarmsView;
