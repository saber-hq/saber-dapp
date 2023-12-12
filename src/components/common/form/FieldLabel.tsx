import { styled } from "twin.macro";

interface Props {
  label: string;
  description?: React.ReactNode;
}

export const FieldLabel: React.FC<Props> = ({ label, description }: Props) => {
  return (
    <Wrapper>
      <LabelName>{label}</LabelName>
      {description && <LabelDescription>{description}</LabelDescription>}
    </Wrapper>
  );
};

const Wrapper = styled.div``;

const LabelName = styled.span`
  font-size: 16px;
  font-weight: 500;
  color: ${({ theme }) => theme.colors.text.bold};
`;

const LabelDescription = styled.div`
  margin-top: 8px;
  font-size: 12px;
  font-weight: 300;
`;
