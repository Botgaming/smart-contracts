var BotCoin = artifacts.require("./contracts/BotCoin.sol");
var Bankroll = artifacts.require("./contracts/Bankroll.sol");
var SlotGame = artifacts.require("./contracts/SlotGame.sol");

module.exports = function (deployer) {
  deployer.deploy(SlotGame, BotCoin.address, Bankroll.address);
};
