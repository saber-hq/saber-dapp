import darken from "polished/lib/color/darken";
import desaturate from "polished/lib/color/desaturate";
import tw, { styled, theme } from "twin.macro";

interface IProps {
  color?: string;
}

export const InfoCard = styled.div<IProps>`
  ${tw`p-4 grid gap-2`}
  border-radius: 12px;
  h2 {
    font-weight: 600;
    font-size: 16px;
  }
  a {
    color: #fff;
    text-decoration: underline;
    :hover {
      text-decoration: none;
    }
    display: inline-flex;
    align-items: center;
    span {
      margin-right: 8px;
    }
  }
  color: #fff;
  background: radial-gradient(
    100% 100% at 10% 25%,
    ${(props: IProps) => darken(0.1, desaturate(0.3, props.color ?? "#6966fb"))}
      0%,
    ${theme`colors.saberGray.400`} 100%
  );
  box-shadow: 0px 4px 12px rgba(0, 0, 0, 0.5);
`;
