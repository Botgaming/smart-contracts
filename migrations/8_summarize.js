var BotCoin = artifacts.require("./contracts/BotCoin.sol");
var Bankroll = artifacts.require("./contracts/Bankroll.sol");
var SlotGame = artifacts.require("./contracts/SlotGame.sol");

module.exports = function(deployer) {
  console.log("Token = %s , Bankroll = %s , SlotGame = %s", BotCoin.address, Bankroll.address, SlotGame.address);
};
