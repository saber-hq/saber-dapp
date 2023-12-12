import { SBR_REWARDER } from "@saberhq/saber-periphery";
import { Token } from "@saberhq/token-utils";
import { PublicKey } from "@solana/web3.js";

/**
 * When lockups, farming, etc all start.
 */
export const GENESIS_BLOCK = new Date("2021-07-15T22:00:00Z");

export const K_ADDRESS = new PublicKey(
  "DGxLmyupucbHAtP9SUJSz3HpBbLqUNHYnSK1LCuz9z7k",
);

export const K_START_TIME = new Date("2021-08-01T00:00:00.000Z");

export const ALDRIN_LINK = "https://dex.aldrin.com/chart/spot/SBR_USDC";

export const SENCHA_LINK =
  "https://sencha.so/#/pool/Saber2gLauYim4Mvftnrasomsv6NvAuncvMEZwcLpD1/Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB";

export const SBR_SERUM_MARKET_ADDR = new PublicKey(
  "HXBi8YBwbh4TXF6PjVw81m8Z3Cc4WBofvauj5SBFdgUs",
);
export const SERUM_LINK = `https://dex.projectserum.com/#/market/${SBR_SERUM_MARKET_ADDR.toString()}`;

export const SERUM_DEX_PROGRAM_ID = new PublicKey(
  "9xQeWvG816bUx9EPjHmaT23yvVM2ZWbrrpZb9PusVFin",
);

export const TX_REFETCH_TIME = 1_000;

export const COINGECKO_LINK = "https://www.coingecko.com/en/coins/saber";

export const API_BASE = `${
  process.env.REACT_APP_API_BASE ?? "https://api.saber.so"
}/api/v1`;

export const ADMIN_ACCOUNT = new PublicKey(
  "H9XuKqszWYirDmXDQ12TZXGtxqUYYn4oi7FKzAm7RHGc",
);

export { SABER_REDEEMER_KEY as REDEEMER_KEY } from "@saberhq/saber-periphery";

export const AIRDROP_MERKLE_DISTRIBUTOR_KEY = new PublicKey(
  "9ZKcpLVfGenBifaw2K6riceimohiY5eERQiWvgjzBdsP",
);

export const AIRDROP_IOU_MINT = new PublicKey(
  "DRPbE5nPjEFHC7xwv98ZiJU4QNMtdVjWUm9dr2nrNFhn",
);

export const AIRDROP_REDEEMER = new PublicKey(
  "3pgqyLSjFXoEw8tMJMXqGmVzFnvx9gMxQEPtNotCFXPn",
);

export const FTT_MIGRATION_PAGE =
  "https://wormholebridge.com/#/migrate/Solana/AGFEad2et2ZJif9jaGpdMixQqvW5i81aBdvKe7PHNfz3/5g2cNTWughS68CWSFo3hwdusNUqp9suByEwGB2n81Soy";

export const SABER_QUARRY_LINK = `https://app.quarry.so/#/rewarders/${SBR_REWARDER.toString()}/quarries`;

export const DUMMY_TOKEN = new Token({
  chainId: -1,
  address: "11111111111111111111111111111111",
  name: "",
  decimals: 0,
  symbol: "",
});

export const POOL_MANAGER_BASE = new PublicKey(
  "pmg787inn7nrxK4wChtzdxAJaKejGQuHtnpcPak8k4e",
);
export const POOL_MANAGER_KEY = new PublicKey(
  "XD5s9eMuSibXzczBysd8VmG6nVe7DjqMQK1iZMQjANd",
);

export const SABER_DAO_EXECUTIVE_COUNCIL_OWNER_INVOKER_0 = new PublicKey(
  "2a3mWszftJ9xkpSmmqZEjhNCjTgCMnXuRcJQHFUJXT9x",
);
