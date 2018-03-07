'use strict';

import expectThrow from './helpers/expectThrow';

const BotTCoin = artifacts.require("../contracts/BotTCoin.sol");
const Bankroll = artifacts.require("../contracts/Bankroll.sol");

const BigNumber = web3.BigNumber;

contract('Bankroll', function(accounts) {

	let bankroll;
	let token;
	let confidentInvoker;

	before(async function () {
		token = await BotTCoin.new();
	});

	it("should has a correct metadata", async function () {
		bankroll = await Bankroll.new(token.address);
		let tokenAddress = await bankroll.tokenAddress();
		assert.equal(tokenAddress, token.address, "incorrect token address");
	});

	it("should get minted tokens", async function () {
		let bankrollBalanceBefore = await token.balanceOf.call(bankroll.address);
		assert.equal(bankrollBalanceBefore, 0, "can't have token now");

		let mintAmount = 10000;
		await token.mint(bankroll.address, mintAmount);

		let bankrollBalanceAfter = await token.balanceOf.call(bankroll.address);
		let bankrollBalanceExpected = new BigNumber(bankrollBalanceBefore).plus(mintAmount);
		assert.isOk(bankrollBalanceExpected.equals(bankrollBalanceAfter), "incorrect token amount");
	});

	it("should change the list of confident addresses", async function () {
		confidentInvoker = accounts[0];
		let isConfident = await bankroll.isConfident(confidentInvoker);
		assert.isNotOk(isConfident, "No one address can be 'confident' after bankroll init");

		await bankroll.addConfident(confidentInvoker);
		isConfident = await bankroll.isConfident(confidentInvoker);
		assert.isOk(isConfident, "An address must be 'confident' after 'add confident' operation");

		await bankroll.removeConfident(confidentInvoker);
		isConfident = await bankroll.isConfident(confidentInvoker);
		assert.isNotOk(isConfident, "An address can't be 'confident' after 'remove confident' operation");

		await bankroll.addConfident(confidentInvoker);
		isConfident = await bankroll.isConfident(confidentInvoker);
		assert.isOk(isConfident, "An address must become 'confident' again after 'add confident' operation");
	});

	it("should transfer tokens to address", async function () {
		let bankrollBalanceBefore = await token.balanceOf.call(bankroll.address);
		let recipient = accounts[1];
		let recipientBalanceBefore = await token.balanceOf.call(recipient);
		let transferAmount = 50;
		assert.isOk(new BigNumber(bankrollBalanceBefore).comparedTo(transferAmount) >= 0, "Not enough tokens on bankroll balance");

		await bankroll.transferWin(recipient, transferAmount, {from : confidentInvoker});

		let bankrollBalanceAfter = await token.balanceOf.call(bankroll.address);
		let recipientBalanceAfter = await token.balanceOf.call(recipient);

		let bankrollBalanceExpected = new BigNumber(bankrollBalanceBefore).sub(transferAmount);
		let recipientBalanceExpected = new BigNumber(recipientBalanceBefore).plus(transferAmount);

		assert.isOk(bankrollBalanceExpected.equals(bankrollBalanceAfter), "token transfer doesn't affect to the bankroll balance");
		assert.isOk(recipientBalanceExpected.equals(recipientBalanceAfter), "token transfer doesn't affect to the recipient balance");
	});

	it("should reject a transfer win called from unknown sender", async function() {
		await expectThrow(
			bankroll.transferWin(accounts[2], 100, {from : accounts[3]})
		);
		await expectThrow(
			bankroll.transferWin(accounts[2], 100, {from : accounts[4]})
		);
		await expectThrow(
			bankroll.transferWin(accounts[2], 100, {from : accounts[5]})
		);
		await bankroll.transferWin(accounts[2], 100, {from : confidentInvoker})
	});
});
