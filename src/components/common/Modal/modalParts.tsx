import { styled } from "twin.macro";

export const ModalBody = styled.div`
  display: grid;
  grid-template-columns: 100%;
  grid-auto-flow: row;
  grid-row-gap: 12px;
  margin: 72px 0;
`;

export const ModalBottom = styled.div`
  display: grid;
  grid-auto-flow: row;
  align-items: center;
  justify-content: center;
  grid-row-gap: 24px;

  font-size: 16px;
  line-height: 19px;
  color: ${({ theme }) => theme.colors.text.default};

  text-align: center;
  span {
    display: inline-block;
  }
`;
