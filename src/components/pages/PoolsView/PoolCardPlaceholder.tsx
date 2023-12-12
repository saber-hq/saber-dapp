import React from "react";

import { InnerContainer } from "../../layout/MainLayout/PageContainer";

export const PoolCardPlaceholder: React.FC = () => {
  return (
    <InnerContainer tw="h-[214px] flex flex-col justify-between">
      <div tw="flex space-x-2">
        <div tw="flex-grow space-y-1">
          <div tw="h-4 bg-gray-800 rounded-xl"></div>
          <div tw="h-4 bg-gray-800 rounded-xl"></div>
        </div>
        <div tw="flex-none flex -space-x-2">
          <div tw="h-10 w-10 rounded-full bg-gray-800"></div>
          <div tw="h-10 w-10 rounded-full bg-gray-800"></div>
        </div>
      </div>
      <div tw="h-12 bg-gray-800 rounded-xl"></div>
    </InnerContainer>
  );
};
