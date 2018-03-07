var BotCoin = artifacts.require("./contracts/BotCoin.sol");
var Bankroll = artifacts.require("./contracts/Bankroll.sol");

module.exports = function (deployer) {
  deployer.deploy(Bankroll, BotCoin.address);
};
