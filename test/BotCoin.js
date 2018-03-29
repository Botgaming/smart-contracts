import expectThrow from './helpers/expectThrow';
import decodeLogs from './helpers/decodeLogs';

const BotCoin = artifacts.require('BotCoin');

const BOT_DECIMALS = 9;
const INITIAL_SUPPLY = 3625000000 * (10 ** BOT_DECIMALS);

const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000';

contract('BotCoin', function(accounts) {

  let token;
  const creator = accounts[0];

  beforeEach(async function() {
    token = await BotCoin.new({ from: creator });
  });

  it('should have rigth metadata', async function () {
    const name = await token.name();
    const symbol = await token.symbol();
    const decimals = await token.decimals();

    assert.equal(name, "BotCoin");
    assert.equal(symbol, "BOT");
    assert.equal(decimals, BOT_DECIMALS);
  });

  it('should return the correct totalSupply after construction', async function () {
    const totalSupply = await token.totalSupply();
    const creatorBalance = await token.balanceOf(creator);

    assert.equal(totalSupply, INITIAL_SUPPLY);
    assert.equal(creatorBalance, INITIAL_SUPPLY);

    const receipt = web3.eth.getTransactionReceipt(token.transactionHash);
    const logs = decodeLogs(receipt.logs, BotCoin, token.address);
    assert.equal(logs.length, 1);
    assert.equal(logs[0].event, 'Transfer');
    assert.equal(logs[0].args.from, ZERO_ADDRESS);
    assert.equal(logs[0].args.to, creator);
    assert.equal(logs[0].args.value.valueOf(), totalSupply);
  });

  it('should return correct balances after transfer', async function () {
    await token.transfer(accounts[1], 100);

    assert.equal(await token.balanceOf(creator), INITIAL_SUPPLY - 100);

    assert.equal(await token.balanceOf(accounts[1]), 100);
  });

  it('should return correct balances after multiple transfer', async function () {
    const start = 3;
    const count = 3;

    let recipients = [];
    let amounts = [];
    let total = 0;

    for (var i = 0; i < count; i++) {
      var n = i + start;
      recipients.push(accounts[n]);
      var amount = n * 10;
      amounts.push(amount);
      total += amount;
    }

    const { logs } = await token.transferMultiple(recipients, amounts);

    assert.equal(await token.balanceOf(creator), INITIAL_SUPPLY - total);

    assert.equal(logs.length, count);

    for (var i = 0; i < count; i++) {
      var n = i + start;
      assert.equal(await token.balanceOf(accounts[n]), n * 10);

      assert.equal(logs[i].event, 'Transfer');
      assert.equal(logs[i].args.from, creator);
      assert.equal(logs[i].args.to, accounts[n]);
      assert.equal(logs[i].args.value.valueOf(), n * 10);
    }

  });

});
