import { SubLayout } from "./layout/SubLayout";

interface Props {
  title: string;
  children?: React.ReactNode;
}

export const ErrorPage: React.FC<Props> = ({ title, children }: Props) => {
  return <SubLayout title={title}>{children}</SubLayout>;
};
