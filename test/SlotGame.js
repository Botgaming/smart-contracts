'use strict';

import expectThrow from './helpers/expectThrow';

const BotTCoin = artifacts.require("../contracts/BotTCoin.sol");
const Bankroll = artifacts.require("../contracts/Bankroll.sol");
const Game = artifacts.require('../contracts/SlotGame.sol');

const BigNumber = web3.BigNumber;

contract('SlotGame', function(accounts) {

	const accountZ = accounts[accounts.length - 1];
	let players = accounts;

	const firstGame = {
		id: 1,
		player: players[0],
		startCashin: 500,
		additionalCashins: [100, 500],
		publicKey: "the_first_public_key",
		secretKey: "the_first_secret_key",
		bankrollWin: 650,
		playerWin: 450
	};

	const nonexistentGamesId = [10, 55, 100, 1000];
	const getGameInfo_ResponseLength = 8;

	let game;
	let token;
	let bankroll;

	before(async function () {
		token = await BotTCoin.new();
		bankroll = await Bankroll.new(token.address);

		await token.mint(players[0], 3000);
		let balance1 = await token.balanceOf.call(players[0], {from: accountZ});
		assert.equal(balance1, 3000, "3000 wasn't on the first player account");

		await token.mint(bankroll.address, 10000);
		let bankrollBalance = await token.balanceOf.call(bankroll.address, {from: accountZ});
		assert.equal(bankrollBalance, 10000, "10000 wasn't on the bankroll's account");

	});

	it("should have correct metadata", async function () {
		game = await Game.new(token.address, bankroll.address);
		let bankrollAddress = await game.bankrollAddress();
		let tokenAddress = await game.tokenAddress();
		assert.equal(bankrollAddress, bankroll.address, "Bankroll address is incorrect");
		assert.equal(tokenAddress, token.address, "Token address is incorrect");
	});

	it("should have tokens from player transfers", async function () {
		let gameBalanceBefore = await token.balanceOf.call(game.address, {from: accountZ});
		await token.transfer(game.address, firstGame.startCashin, {from: firstGame.player});
		let gameBalanceAfter = await token.balanceOf.call(game.address, {from: accountZ});
		let expectedGameBalance = new BigNumber(gameBalanceBefore).plus(firstGame.startCashin);
		assert.isOk(expectedGameBalance.equals(gameBalanceAfter), "incorrect game balance");
	});

	it("should create a new game with 'GameCreated' event and successive id", async function () {
		let result = await game.createGame(firstGame.player, firstGame.startCashin, firstGame.publicKey);
		assert.equal(result.logs[0].event, 'GameCreated');
		assert.equal(result.logs[0].args.gameId.valueOf(), firstGame.id);
	});

	it("should extend the confident list of the bankroll contract with game contact address", async function () {
		await bankroll.addConfident(game.address);
		let isGameConfident = await bankroll.isConfident(game.address);
		assert.isOk(isGameConfident, "An address must be 'confident' after 'add confident' operation");
	});

	it("should reject new game creating when player isn't defined", async function() {
		let wrongInitParams = {
			player: "",
			startCashin: 100,
			publicKey: "correct_public_key"
		};
		await gameCreatingFail(wrongInitParams);

		wrongInitParams.player = "0";
		await gameCreatingFail(wrongInitParams);

		// wrongInitParams.player = "0x";
		// await gameCreatingFail(wrongInitParams);
		//todo: //BigNumber Error: new BigNumber() not a base 16 number:

		wrongInitParams.player = "0x0";
		await gameCreatingFail(wrongInitParams);

		// wrongInitParams.player = "it_is_not_an_address";
		// await gameCreatingFail(wrongInitParams);
		//todo: //BigNumber Error: new BigNumber() not a number: it_is_not_an_address
	});

	it("should reject new game creating when player cashin equal zero", async function() {
		let wrongInitParams = {
			player: players[0],
			startCashin: 0,
			publicKey: "correct_public_key"
		};
		await gameCreatingFail(wrongInitParams);
	});

	it("!!!! TODO how to avoid new game creating when player cashin is negative", async function() {
		let wrongInitParams = {
			player: players[0],
			startCashin: -10,
			publicKey: "correct_public_key"
		};
		let result = await game.createGame(wrongInitParams.player, wrongInitParams.startCashin, wrongInitParams.publicKey);
		assert.equal(result.logs[0].event, 'GameCreated');
		assert.equal(result.logs[0].args.gameId.valueOf(), 2);

		let gameInfo = await game.getGameInfo(2);
		assert.isOk(gameInfo[5][0].toString().includes("1.15792089237316195423570985008687907853269984665640564039457584007913129639926e+77"));
		// todo: its cast from signted int to unsigned uing result
		// http://solidity.readthedocs.io/en/latest/types.html#explicit-conversions
	});

	it("should reject new game creating when public key isn't defined", async function() {
		let wrongInitParams = {
			player: players[0],
			startCashin: 100,
			publicKey: ""
		};
		await gameCreatingFail(wrongInitParams);
		/*wrongInitParams.publicKey = undefined;
		await gameCreatingFail(wrongInitParams);
		// todo: Error: Invalid number of arguments to Solidity function*/
	});

	it("should return a correct open game info", async function() {
		let gameInfo = await game.getGameInfo(firstGame.id);

		assert.equal(gameInfo.length, getGameInfo_ResponseLength);

		assert.equal(gameInfo[0], 1);
		assert.equal(gameInfo[1], false);
		assert.equal(gameInfo[2], firstGame.publicKey);
		assert.equal(gameInfo[3], "");
		assert.equal(gameInfo[4], firstGame.player);
		assert.equal(gameInfo[5].length, 1);
		assert.equal(gameInfo[5][0], firstGame.startCashin);
		assert.equal(gameInfo[6], 0);
		assert.equal(gameInfo[7], 0);
	});

	it("should have tokens from player additional cashins", async function () {
		let gameBalanceBefore = await token.balanceOf.call(game.address);

		await token.transfer(game.address, firstGame.additionalCashins[0], {from: firstGame.player});
		let gameBalanceAfter = await token.balanceOf.call(game.address, {from: accountZ});
		let expectedGameBalance = new BigNumber(gameBalanceBefore).plus(firstGame.additionalCashins[0]);
		assert.isOk(expectedGameBalance.equals(gameBalanceAfter), "Game balance is incorrect");

		gameBalanceBefore = await token.balanceOf.call(game.address, {from: accountZ});
		await token.transfer(game.address, firstGame.additionalCashins[1], {from: firstGame.player});
		gameBalanceAfter = await token.balanceOf.call(game.address, {from: accountZ});
		expectedGameBalance = new BigNumber(gameBalanceBefore).plus(firstGame.additionalCashins[1]);

		assert.isOk(expectedGameBalance.equals(gameBalanceAfter), "Game balance is incorrect");
	});

	it("should reject an additional cashin with zero amount", async function () {
		await expectThrow(
			game.cashIn(firstGame.id, 0)
		);
	});

	it("should reject an additional cashin to nonexistent game", async function () {
		let tryMakeCashin = async function (nonexistentGameId) {
			await expectThrow(
				game.cashIn(nonexistentGameId, firstGame.additionalCashins[0])
			)
		};
		nonexistentGamesId.forEach(nonexistentGameId => tryMakeCashin(nonexistentGameId));
	});

	it("should make additional cashins", async function () {
		let firstCashin = firstGame.additionalCashins[0];
		let result = await game.cashIn(firstGame.id, firstCashin);
		assert.equal(result.logs[0].event, 'CashIn');
		assert.equal(result.logs[0].args.gameId.valueOf(), firstGame.id);
		// TODO : assert.equal(result.logs[0].args.player.valueOf(), firstGame.player);
		assert.equal(result.logs[0].args.amount.valueOf(), firstCashin);

		let secondCashin = firstGame.additionalCashins[1];
		result = await game.cashIn(firstGame.id, secondCashin);
		assert.equal(result.logs[0].event, 'CashIn');
		assert.equal(result.logs[0].args.gameId.valueOf(), firstGame.id);
		// TODO : assert.equal(result.logs[0].args.player.valueOf(), firstGame.player);
		assert.equal(result.logs[0].args.amount.valueOf(), secondCashin);
	});

	it("should return a correct open game info after additional cashins", async function() {
		let gameInfo = await game.getGameInfo(firstGame.id);
		assert.equal(gameInfo.length, getGameInfo_ResponseLength);

		let fullCashinList = getFullCashinList(firstGame);

		assert.equal(gameInfo[0], 1);
		assert.equal(gameInfo[1], false);
		assert.equal(gameInfo[2], firstGame.publicKey);
		assert.equal(gameInfo[3], "");
		assert.equal(gameInfo[4], firstGame.player);
		assert.equal(gameInfo[5].toString(), fullCashinList.toString());
		assert.equal(gameInfo[6], 0);
		assert.equal(gameInfo[7], 0);
	});

	it("should reject nonexistent game closing", async function () {
		let tryCloseGame = async function (nonexistentGameId) {
			await expectThrow(
				game.close(nonexistentGameId, firstGame.playerWin, firstGame.secretKey, firstGame.bankrollWin)
			)
		};
		nonexistentGamesId.forEach(nonexistentGameId => tryCloseGame(nonexistentGameId));
	});

	it("should close a game", async function () {
		let bankrollBalanceBefore = await token.balanceOf.call(bankroll.address);
		let gameBalanceBefore = await token.balanceOf.call(game.address);
		let playerBalanceBefore = await token.balanceOf.call(firstGame.player);

		const result = await game.close(firstGame.id, firstGame.playerWin, firstGame.secretKey, firstGame.bankrollWin);

		assert.notEqual(result.logs[0].event, 'Transfer', "Transfer token event fired in token contract, passed to game contract invoke transaction");
		assert.equal(result.logs[1], undefined, "Unexpected event fired");

		assert.equal(result.logs[0].event, 'GameClosed');
		assert.equal(result.logs[0].args.gameId.valueOf(), firstGame.id);

		let bankrollBalanceAfter = await token.balanceOf.call(bankroll.address);
		let expextedBankrollBalance =
			new BigNumber(bankrollBalanceBefore)
				.plus(getCashinAmount(firstGame))
				.sub(firstGame.playerWin);
		assert.equal(expextedBankrollBalance.toString(), bankrollBalanceAfter.toString(), "Bankroll balance is incorrect");

		let playerBalanceAfter = await token.balanceOf.call(firstGame.player);
		let expextedPlayerBalance =
			new BigNumber(playerBalanceBefore)
				.plus(firstGame.playerWin);
		assert.equal(expextedPlayerBalance.toString(), playerBalanceAfter.toString(), "Player balance is incorrect");

		let gameBalanceAfter = await token.balanceOf.call(game.address);
		let expextedGameBalance = new BigNumber(gameBalanceBefore).sub(getCashinAmount(firstGame));
		assert.equal(expextedGameBalance.toString(), gameBalanceAfter.toString(), "Game balance is incorrect");
	});

	it("should return a correct closed game info", async function() {
		let gameInfo = await game.getGameInfo(firstGame.id);
		assert.equal(gameInfo.length, getGameInfo_ResponseLength);

		let fullCashinList = getFullCashinList(firstGame);

		assert.equal(gameInfo[0], 1);
		assert.equal(gameInfo[1], true);
		assert.equal(gameInfo[2], firstGame.publicKey);
		assert.equal(gameInfo[3], firstGame.secretKey);
		assert.equal(gameInfo[4], firstGame.player);
		assert.equal(gameInfo[5].toString(), fullCashinList.toString());
		assert.equal(gameInfo[6], firstGame.playerWin);
		assert.equal(gameInfo[7], firstGame.bankrollWin);
	});

	it("should reject a additional cashin to a closed game", async function () {
		await expectThrow(
			game.cashIn(firstGame.id, firstGame.additionalCashins[0])
		);
	});

	it("should reject closing of a closed game", async function () {
		await expectThrow(
			game.close(firstGame.id, firstGame.playerWin, firstGame.secretKey, firstGame.bankrollWin)
		);
	});

	let gameCreatingFail = async (wrongInitParams) => {
		await expectThrow(
			game.createGame(wrongInitParams.player, wrongInitParams.startCashin, wrongInitParams.publicKey)
		)
	};

	let getFullCashinList = (gameDescription) => {
		let fullCashinList = [];
		fullCashinList.push(gameDescription.startCashin);
		gameDescription.additionalCashins.forEach((item) => {
			fullCashinList.push(item);
		});
		return fullCashinList;
	};

	let getCashinAmount = (gameDescription) => {
		let result = 0;
		getFullCashinList(gameDescription).forEach((item) => {
			result += item;
		});
		return result;
	};

});
