import type { Token } from "@saberhq/token-utils";
import invariant from "tiny-invariant";

import type { CurrencyMarket } from "./currencies";

export class TokenGroups {
  private readonly _groups: Record<
    string,
    {
      [address: string]: Token;
    }
  > = {};
  private readonly _groupsByAsset: Record<string, string> = {};

  add(tag: CurrencyMarket, asset: Token): void {
    let tagStr: string = tag;
    if ((asset.info.extensions as Record<string, string>)?.source === "port") {
      tagStr = `port_${tag}`;
    }
    const group = this._groups[tagStr];
    if (!group) {
      this._groups[tagStr] = { [asset.address]: asset };
    } else {
      group[asset.address] = asset;
    }
    invariant(
      !this._groupsByAsset[asset.address],
      "asset is already in a group",
    );
    this._groupsByAsset[asset.address] = tagStr;
  }

  getGroup(asset: Token): string | undefined {
    return this._groupsByAsset[asset.address];
  }

  getTradeableAssets(asset: Token): Token[] | null {
    const grp = this.getGroup(asset);
    if (!grp) {
      return null;
    }
    const values = this._groups[grp];
    return values ? Object.values(values) : [];
  }

  canTradeWith(asset: Token, other: Token): boolean {
    const myGrp = this.getGroup(asset);
    const otherGrp = this.getGroup(other);
    return myGrp === otherGrp;
  }
}
