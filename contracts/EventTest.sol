pragma solidity ^0.4.18;

contract EventTest {

	event Event(uint id, string payload);
	uint sequence;

	function EventTest() public {
	}

	function emmit(string payload) public {
		sequence = sequence + 1;
		Event(sequence, payload);
	}
}
