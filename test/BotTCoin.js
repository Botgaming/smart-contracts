var BotTCoin = artifacts.require("../contracts/BotTCoin.sol");
var Bankroll = artifacts.require("../contracts/Bankroll.sol");

contract('BotTCoin', function(accounts) {
	let firstAccount = accounts[0];
	let secondAccount = accounts[1];

	let token;

	before(async function () {
		token = await BotTCoin.new();
	});

	it("should has no tokens of new instance", async function() {

		let firstBalance = await token.balanceOf.call(firstAccount);
		let secondBalance = await token.balanceOf.call(secondAccount);

		assert.equal(firstBalance, 0, "initial account balance wasn't 0");
		assert.equal(secondBalance, 0, "initial account balance wasn't 0");
	});

	it("should mint 1000 BotTCoin for account", async function() {
		await token.mint(firstAccount, 1000);
		await token.mint(secondAccount, 3000);

		let firstBalance = await token.balanceOf.call(firstAccount);
		let secondBalance = await token.balanceOf.call(secondAccount);

		assert.equal(firstBalance, 1000, "1000 wasn't on the first account after minting");
		assert.equal(secondBalance, 3000, "1000 wasn't on the first account after minting");
	});
});
