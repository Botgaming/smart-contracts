'use strict';

const EventTest = artifacts.require('../contracts/EventTest.sol');
const SlotGame = artifacts.require('../contracts/SlotGame.sol');
const BotCoin = artifacts.require("../contracts/BotCoin.sol");
const Bankroll = artifacts.require("../contracts/Bankroll.sol");
const BigNumber = web3.BigNumber;

contract('EventTest', function(accounts) {

	it("should event", async function () {
		let contract = await EventTest.new();
		let result = await contract.emmit("blabla");

		assert.equal(result.logs[0].event, 'Event');
		assert.equal(result.logs[0].args.id.valueOf(), "1");
		//assert.equal(result.logs[0].args.payload.valueOf(), "blabla");
	});

	it("should have correct metadata", async function () {
		let game = await SlotGame.new(BotCoin.address, Bankroll.address);
		let result = await game.createGame(accounts[0], 10, "adsfdasfdfas");
		assert.equal(result.logs[0].event, 'GameCreated');
		assert.equal(result.logs[0].args.gameId.valueOf(), 1);

		result = await game.cashIn(1, 10);
		assert.equal(result.logs[0].event, 'CashIn');
		assert.equal(result.logs[0].args.gameId.valueOf(), 1);
	});
});
