import { styled } from "twin.macro";

export const Row = styled.div`
  :not(:last-child) {
    border-bottom: 1px solid ${({ theme }) => theme.colors.divider.secondary};
  }
  align-items: center;
  padding: 12px 0;
  & > span {
    font-size: 16px;
    font-weight: 500;
    color: ${({ theme }) => theme.colors.text.bold};
  }
`;

export const ErrorMessage = styled.span`
  color: red;
`;

export const LabelWrapper = styled.div`
  :not(:last-child) {
    border-bottom: 1px solid ${({ theme }) => theme.colors.divider.secondary};
  }
  display: grid;
  grid-template-columns: 50% 50%;
  align-items: center;
  padding: 12px 0;
  grid-column-gap: 12px;

  & > span {
    font-size: 16px;
    font-weight: 500;
    color: ${({ theme }) => theme.colors.text.bold};
  }

  & > textarea {
    border: none;
    outline: none;
    padding: 8px;
    border-radius: 4px;
    background: ${({ theme }) => theme.colors.base.tertiary};
  }
`;
