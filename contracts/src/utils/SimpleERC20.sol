// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";

/// @title SimpleERC20
/// @notice Minimal fixed-supply ERC20 for quick testing. Mints total supply to deployer.
contract SimpleERC20 is ERC20 {
    uint8 private immutable _customDecimals;

    constructor(string memory name_, string memory symbol_, uint8 decimals_, uint256 totalSupply_)
        ERC20(name_, symbol_)
    {
        _customDecimals = decimals_;
        _mint(msg.sender, totalSupply_);
    }

    function decimals() public view override returns (uint8) {
        return _customDecimals;
    }
}
