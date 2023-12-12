import type { Token } from "@saberhq/token-utils";
import React, { useState } from "react";
import { FaChevronRight } from "react-icons/fa";
import { css, styled } from "twin.macro";

import { breakpoints } from "../../../theme/breakpoints";
import { AsyncButton } from "../../common/AsyncButton";
import { Button } from "../../common/Button";
import type { ModalProps as IModalProps } from "../../common/Modal";
import { Modal } from "../../common/Modal";
import { ReactComponent as TwitterIcon } from "../../layout/MainLayout/TopBar/icons/Twitter.svg";
import { useHandleSPLAirdrop } from "./useHandleSPLAirdrop";

type IProps = Omit<IModalProps, "children" | "title"> & {
  token?: Token;
};

const isValidTweetURL = (raw: string): boolean => {
  try {
    const url = new URL(raw);
    const parts = url.pathname.split("/");
    return (
      url.hostname === "twitter.com" &&
      parts[parts.length - 2] === "status" &&
      !Number.isNaN(parseInt(parts[parts.length - 1] ?? ""))
    );
  } catch (e) {
    return false;
  }
};

export const TwitterModal: React.FC<IProps> = ({
  token,
  ...modalProps
}: IProps) => {
  const handleSplAirdrop = useHandleSPLAirdrop(token, modalProps.onDismiss);
  const [tweetURL, setTweetURL] = useState<string>("");

  const { claimID, link, regen } = useGenerateLink();

  return (
    <Modal title="Thanks for helping test Saber!" {...modalProps}>
      <p
        css={css`
          font-weight: normal;
          font-size: 16px;
          line-height: 19px;
          margin-bottom: 36px;
        `}
      >
        In order to prevent spam, we require users to verify their transaction
        via Twitter.
      </p>
      <TwitterButtonWrapper
        href={link}
        target="_blank"
        rel="noreferrer noopener"
      >
        <TwitterButton size="large" variant="secondary">
          <div
            css={css`
              display: flex;
              align-items: center;
            `}
          >
            <TwitterIcon />
            <span
              css={css`
                margin-left: 12px;
              `}
            >
              Verify on Twitter
            </span>
          </div>
          <FaChevronRight />
        </TwitterButton>
      </TwitterButtonWrapper>
      <TweetForm>
        <label htmlFor="verificationTweet">URL of Verification Tweet</label>
        <TweetInput
          id="verificationTweet"
          value={tweetURL}
          onChange={(e) => setTweetURL(e.target.value)}
          placeholder="e.g. twitter.com/saber_hq/status/234989234230"
        />
      </TweetForm>
      <AsyncButton
        size="large"
        disabled={!isValidTweetURL(tweetURL) || !token}
        loadingMessage="Validating tweet"
        onClick={async () => {
          await handleSplAirdrop(tweetURL, claimID);
          setTweetURL("");
          regen();
          modalProps.onDismiss();
        }}
      >
        Continue
      </AsyncButton>
    </Modal>
  );
};

const TwitterButtonWrapper = styled.a`
  display: block;
`;

const TweetForm = styled.fieldset`
  font-weight: 500;
  font-size: 14px;
  line-height: 16px;
  & > label {
    color: ${({ theme }) => theme.colors.text.bold};
  }

  display: grid;
  grid-auto-flow: row;
  grid-row-gap: 12px;

  margin: 36px 0;
`;

const TweetInput = styled.input`
  border: 1px solid ${({ theme }) => theme.colors.divider.primary};
  outline: none;
  border-radius: 8px;
  background: transparent;
  height: 40px;
  padding: 0 12px;

  font-weight: 500;
  font-size: 14px;
  ${breakpoints.mobile} {
    /* iOS won't zoom if 16px */
    font-size: 16px;
  }
  line-height: 16px;
  &::placeholder {
    color: ${({ theme }) => theme.colors.text.muted};
  }
`;

const TwitterButton = styled(Button)`
  display: flex;
  align-items: center;
  height: 44px;
  justify-content: space-between;

  font-weight: 500;
  font-size: 14px;
  line-height: 16px;
  padding: 0 12px;
`;

const nextClaimID = (): string =>
  Math.floor(Math.random() * 1000000000000).toString();

const useGenerateLink = (): {
  link: string;
  claimID: string;
  regen: () => void;
} => {
  const [claimID, setClaimID] = useState<string>(nextClaimID());
  const link = [
    `https://twitter.com/intent/tweet?text=`,
    encodeURIComponent(
      [
        `Verifying my transaction for @Saber_HQ on @Solana.\n\n`,
        `🔄☀️ https://saber.so\n\n`,
        `Trial tokens claim id: ${claimID}\n\n`,
        `$SOL`,
      ].join(""),
    ),
  ].join("");
  return { link, claimID, regen: () => setClaimID(nextClaimID()) };
};
