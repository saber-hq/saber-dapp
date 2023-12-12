import { fetchNullableWithSessionCache } from "@saberhq/sail";
import { useQuery } from "react-query";

export interface SourceInfo {
  auditors: string[];
  name: string;
  description: string;
  website: string;
  /**
   * Source code URL.
   */
  sourceURL?: string;
  risksURL: string;
  iconURL: string;
}

export const useSourcesInfo = () => {
  return useQuery(["sourcesInfo"], async () => {
    return await fetchNullableWithSessionCache<Record<string, SourceInfo>>(
      "https://raw.githubusercontent.com/saber-hq/registry/master/sources.json",
    );
  });
};
