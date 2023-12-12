import { styled } from "twin.macro";

interface IProps {
  message: string;
}

export const Banner = ({ message }: IProps) => (
  <Wrapper>
    <p>{message}</p>
  </Wrapper>
);

const Wrapper = styled.div`
  min-height: 25px;
  width: 100%;
  background-color: #ffdc00;
  display: flex;
  align-items: center;
  flex-direction: column;
  justify-content: center;
  margin-bottom: 10px;
  & > p {
    color: black;
    text-align: center;
    width: 100%;
    margin: 0;
  }
`;
