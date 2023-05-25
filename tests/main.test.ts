import BN from "../src/utils/BN";
import { TOKENS_BY_SYMBOL } from "../src/constants";
import { LimitOrderPredicateAbi__factory } from "../src/predicates";
import { Predicate, Provider, Wallet } from "fuels";
import { nodeUrl, privateKey } from "../src/config";

(async () => {
  const token0 = TOKENS_BY_SYMBOL.USDC;
  const amount0 = BN.parseUnits(20, token0.decimals);
  const token1 = TOKENS_BY_SYMBOL.BTC;
  const amount1 = BN.parseUnits(0.001, token1.decimals);
  const exp = BN.parseUnits(1, 9 + token0.decimals - token1.decimals);
  let price = amount1.times(exp).div(amount0);

  const wallet = Wallet.fromPrivateKey(privateKey, nodeUrl);

  // console.log(price.toString());
  const configurableConstants = {
    ASSET0: token0.assetId,
    ASSET1: token1.assetId,
    MAKER: wallet.address.toB256(),
    PRICE: price.toFixed(0),
    ASSET0_DECINALS: token0.decimals,
    ASSET1_DECINALS: token1.decimals,
  };
  console.log(configurableConstants);
  const predicate = new Predicate(
    LimitOrderPredicateAbi__factory.bin,
    LimitOrderPredicateAbi__factory.abi,
    new Provider(nodeUrl),
    configurableConstants
  );

  console.log(predicate.address.toB256());

  const initialPredicateBalance = await predicate.getBalance(token0.assetId);
  console.log("initialPredicateBalance", initialPredicateBalance.toString());

  const tx1 = await wallet
    .transfer(predicate.address, amount0.toFixed(0), token0.assetId, { gasPrice: 1 })
    .catch((e) => console.error(`tx1 ${e}`));
  await tx1?.waitForResult();
  //
  const feetx = await wallet
    .transfer(predicate.address, 1, TOKENS_BY_SYMBOL.ETH.assetId, { gasPrice: 1 })
    .catch((e) => console.error(`feetx ${e}`));
  await feetx?.waitForResult();

  const predicateBalances = await predicate.getBalances();
  console.log(
    "predicateBalances",
    predicateBalances.map((v) => v.amount.toString())
  );
  //---------------------
  const tx2 = await predicate.transfer(wallet.address, amount0.toFixed(0), token0.assetId, {
    gasPrice: 1,
  });
  await tx2.waitForResult();

  const finalPredicateBalance = await predicate.getBalances();
  console.log(
    "finalPredicateBalance",
    finalPredicateBalance.map((v) => v.amount.toString())
  );
})();
