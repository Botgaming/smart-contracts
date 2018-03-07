var BotCoin = artifacts.require("./contracts/BotCoin.sol");

module.exports = function(deployer) {
  deployer.deploy(BotCoin);
};
