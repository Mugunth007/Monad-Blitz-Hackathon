// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Test.sol";

contract MyTest is Test {
    uint256 public value;

    function setUp() public {
        value = 42;
    }

    function testValue() public {
        assertEq(value, 42);
    }
}
