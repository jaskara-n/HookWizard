// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {BaseHook} from "../utils/BaseHook.sol";
import {Hooks} from "@uniswap/v4-core/src/libraries/Hooks.sol";
import {IPoolManager} from "@uniswap/v4-core/src/interfaces/IPoolManager.sol";
import {PoolKey} from "@uniswap/v4-core/src/types/PoolKey.sol";
import {PoolId, PoolIdLibrary} from "@uniswap/v4-core/src/types/PoolId.sol";
import {Currency} from "@uniswap/v4-core/src/types/Currency.sol";
import {BeforeSwapDelta} from "@uniswap/v4-core/src/types/BeforeSwapDelta.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";

/// @title ArcUSDCOnlyHook
/// @notice Enforces a USDC-only pool policy and emits settlement events for Arc.
contract ArcUSDCOnlyHook is BaseHook {
    using PoolIdLibrary for PoolKey;

    IERC20 public immutable usdc;
    address public immutable settlementReceiver;

    mapping(bytes32 => uint256) public arcSettlementRequests;

    error AddressCannotBeZero();
    error InvalidStablecoin();

    event ArcPoolRegistered(bytes32 indexed poolId, address currency0, address currency1);
    event ArcSettlementRequested(bytes32 indexed poolId, address indexed provider, int256 liquidityDelta);

    constructor(IPoolManager _manager, IERC20 _usdc, address _settlementReceiver) BaseHook(_manager) {
        if (address(_usdc) == address(0) || _settlementReceiver == address(0)) revert AddressCannotBeZero();
        usdc = _usdc;
        settlementReceiver = _settlementReceiver;
    }

    function getHookPermissions() public pure override returns (Hooks.Permissions memory) {
        return Hooks.Permissions({
            beforeInitialize: true,
            afterInitialize: false,
            beforeAddLiquidity: true,
            afterAddLiquidity: false,
            beforeRemoveLiquidity: false,
            afterRemoveLiquidity: false,
            beforeSwap: true,
            afterSwap: false,
            beforeDonate: false,
            afterDonate: false,
            beforeSwapReturnDelta: false,
            afterSwapReturnDelta: false,
            afterAddLiquidityReturnDelta: false,
            afterRemoveLiquidityReturnDelta: false
        });
    }

    function beforeInitialize(address, PoolKey calldata key, uint160) external override returns (bytes4) {
        _onlyPoolManager();
        _ensureUsdc(key);
        emit ArcPoolRegistered(_poolId(key), Currency.unwrap(key.currency0), Currency.unwrap(key.currency1));
        return BaseHook.beforeInitialize.selector;
    }

    function beforeAddLiquidity(
        address provider,
        PoolKey calldata key,
        IPoolManager.ModifyLiquidityParams calldata params,
        bytes calldata
    ) external override returns (bytes4) {
        _onlyPoolManager();
        _ensureUsdc(key);
        bytes32 poolId = _poolId(key);
        arcSettlementRequests[poolId] += 1;
        emit ArcSettlementRequested(poolId, provider, params.liquidityDelta);
        return BaseHook.beforeAddLiquidity.selector;
    }

    function beforeSwap(address, PoolKey calldata key, IPoolManager.SwapParams calldata, bytes calldata)
        external
        override
        returns (bytes4, BeforeSwapDelta, uint24)
    {
        _onlyPoolManager();
        _ensureUsdc(key);
        return (BaseHook.beforeSwap.selector, BeforeSwapDelta.wrap(0), 0);
    }

    function _ensureUsdc(PoolKey calldata key) internal view {
        if (Currency.unwrap(key.currency0) != address(usdc) && Currency.unwrap(key.currency1) != address(usdc)) {
            revert InvalidStablecoin();
        }
    }

    function _poolId(PoolKey calldata key) internal pure returns (bytes32) {
        PoolId id = key.toId();
        return PoolId.unwrap(id);
    }
}
