import { styled } from "twin.macro";

interface Props {
  message?: string;
  action?: React.ReactNode;
}

export const EmptyState: React.FC<Props> = ({
  message = "The data was not found.",
  action,
}: Props) => {
  return (
    <Wrapper>
      <Shrug>🤷‍♂️</Shrug>
      <p>{message}</p>
      {action}
    </Wrapper>
  );
};

const Wrapper = styled.div`
  width: 100%;
  padding: 20px;
  display: flex;
  flex-direction: column;
  align-items: center;

  p {
    color: ${({ theme }) => theme.colors.text.bold};
    margin-bottom: 32px;
  }
`;

const Shrug = styled.div`
  font-size: 96px;

  animation: flip 2s both infinite;
  animation-timing-function: linear;

  @keyframes flip {
    0% {
      transform: rotateY(0);
    }
    50% {
      transform: rotateY(180deg);
    }
    100% {
      transform: rotateY(0deg);
    }
  }
`;
