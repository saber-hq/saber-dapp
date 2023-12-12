import { Switch } from "@headlessui/react";
import { Percent } from "@saberhq/token-utils";
import React, { useState } from "react";
import { Route } from "react-router-dom";
import tw, { styled } from "twin.macro";

import { IWithdrawalMode, useSettings } from "../../../contexts/settings";
import { SentryRoutes } from "../../../utils/useAnalytics";
import type { ModalProps as IModalProps } from "../Modal";
import { Modal } from "../Modal";
import { ButtonGroup } from "./ButtonGroup";

const SLIPPAGE_PRESETS = ["0.1", "0.5", "1.0"];

type IProps = Omit<IModalProps, "children" | "title">;

export const AdvancedSettingsModal: React.FC<IProps> = ({
  ...modalProps
}: IProps) => {
  const {
    maxSlippagePercent,
    setMaxSlippagePercent,
    withdrawalMode,
    setWithdrawalMode,
    includeWrapped,
    setIncludeWrapped,
  } = useSettings();
  const [slippage, setSlippage] = useState<string>(
    maxSlippagePercent.toFixed(1),
  );

  const onSelect = (slippage: string) => {
    setSlippage(slippage);
    try {
      setMaxSlippagePercent(new Percent(parseFloat(slippage) * 100, 10_000));
      // eslint-disable-next-line no-empty
    } catch (e) {}
  };

  return (
    <Modal title="Settings" {...modalProps} darkenOverlay={false}>
      <Settings>
        <Setting>
          <OptionLabel>Max Price Impact</OptionLabel>
          <ButtonGroup
            value={slippage}
            onSelect={onSelect}
            options={[
              ...SLIPPAGE_PRESETS.map((s) => ({
                key: s,
                label: `${s}%`,
              })),
            ]}
            hasCustomFallback
          />
        </Setting>
        <SentryRoutes>
          <Route
            path="/pools/:poolID/withdraw"
            element={
              <Setting>
                <OptionLabel>Withdrawal Currency</OptionLabel>
                <ButtonGroup
                  value={withdrawalMode}
                  onSelect={setWithdrawalMode}
                  options={[
                    {
                      key: IWithdrawalMode.ALL,
                      label: "All Currencies",
                    },
                    {
                      key: IWithdrawalMode.ONE,
                      label: "One Currency",
                    },
                  ]}
                  optionPadding={35}
                />
              </Setting>
            }
          ></Route>
        </SentryRoutes>
        <Setting>
          <Switch.Group>
            <div tw="flex items-center text-sm">
              <Switch.Label tw="font-medium text-[#868f97]">
                Always include decimal wrapped tokens in list?
              </Switch.Label>
              <Switch<"button">
                checked={includeWrapped}
                onChange={setIncludeWrapped}
                css={[
                  includeWrapped
                    ? tw`background-color[#5754da]`
                    : tw`background-color[#868f97]`,
                  tw`ml-3 relative inline-flex items-center h-6 rounded-full w-11 transition-colors`,
                ]}
              >
                <span
                  css={[
                    includeWrapped ? tw`translate-x-6` : tw`translate-x-1`,
                    tw`inline-block w-4 h-4 transform bg-white rounded-full transition-transform`,
                  ]}
                />
              </Switch>
            </div>
          </Switch.Group>
        </Setting>
      </Settings>
    </Modal>
  );
};

const Settings = styled.div`
  display: grid;
  grid-row-gap: 18px;
  grid-auto-flow: row;
`;

const Setting = styled.div``;

const OptionLabel = styled.label`
  font-weight: 500;
  font-size: 14px;
  line-height: 16px;
  display: block;
  margin-bottom: 12px;
`;

export default AdvancedSettingsModal;
