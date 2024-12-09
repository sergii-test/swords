// SPDX-License-Identifier: MIT
pragma solidity ^0.8.16;

import "@openzeppelin/contracts/utils/Counters.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";

// Swords is a smart contract handling logic for valuable artefacts in a game.
contract Swords is ERC721Enumerable, ReentrancyGuard {
    using Counters for Counters.Counter;
    Counters.Counter private _tokenIds;

    // Event declarations
    event NFTsMerged(address indexed owner, uint256[] tokenIds, uint256 reward);
    event Withdrawal(address indexed owner, uint256 amount);

    uint256 public mintPrice = 0.01 ether;
    uint256 public mergeReward = 0.005 ether;
    address public contractOwner;

    // entropyMap contains entropy values assigned to NFTs. This value is used to generate an NFT's unique traits.
    mapping(uint256 => uint256) public entropyMap;

    constructor() ERC721("Swords", "SWRD") {
        contractOwner = msg.sender;
    }

    /**
     * @dev Testing-only function, returns true only if all tokens exist. Must be removed in prod, just in case.
     */
    function checkNoneExist(uint256[] calldata Ids) public view returns (bool) {
        for (uint i = 0; i < Ids.length; i++)
            if (_ownerOf(Ids[i]) != address(0)) return false; //external ownerOf requires token to exist
        return true;
    }

    /**
     * @dev getEntropy is used to produce random numbers to be used in swords' traits
     */
    function getRandom() internal view returns(uint256) {
        return uint256(
                keccak256(
                    abi.encodePacked(
                        block.timestamp,
                        blockhash(block.number - 1),
                        msg.sender
                    )   
                )
        );
    }
    /**
     * @dev mint is used to mint one or multiple NFTs for a predefined price.
     */
    function mint(uint256 numberOfTokens) external payable nonReentrant {
        require(numberOfTokens > 0, "Must mint at least one NFT");
        require(msg.value >= mintPrice * numberOfTokens, "Insufficient Ether amount");

        for (uint256 i = 0; i < numberOfTokens; i++) {
            _tokenIds.increment();
            uint256 newItemId = _tokenIds.current();

            uint256 entropy = getRandom() % 10000; // 10 000 different mintable NFTs
            // NFTs with entropy from 0 to 9999 are considered as "ordinary" swords

            entropyMap[newItemId] = entropy;

            _safeMint(msg.sender, newItemId);
        }
    }

    /**
     * @dev Function to merge multiple NFTs and receive a reward.
     */
    function mergeNFTs(uint256[] calldata tokenIds) external nonReentrant {
        require(tokenIds.length >= 2, "Need at least two NFTs to merge");
        require(tokenIds.length <= 20, "Cannot merge more than 20 NFTs in one call");
        require(mergeReward * tokenIds.length <= address(this).balance, "Not enough balance for merge rewards");

        uint256 entropy = 0;

        // Verify ownership of NFTs, calculate entropy, and burn them
        for (uint256 i = 0; i < tokenIds.length; i++) {
            require(ownerOf(tokenIds[i]) == msg.sender, "Not the owner of all NFTs");
            
            // Add the entropy of the current token to the total
            entropy += entropyMap[tokenIds[i]];

            _burn(tokenIds[i]);
            delete entropyMap[tokenIds[i]];
        }

        // Get a random value between 0 and 99
        uint256 randomFactor = getRandom() % 100; 

        if (randomFactor < 25) {
            // 25% chance to get +25%
            entropy = (entropy * 125) / 100;
        } else if (randomFactor < 35) {
            // 10% chance to get -10%
            entropy = (entropy * 90) / 100;
        }

        // Create a new NFT with the resulting entropy.
        _tokenIds.increment();
        uint256 newItemId = _tokenIds.current();
        entropyMap[newItemId] = entropy;

        _safeMint(msg.sender, newItemId);

        // Calculate total reward and reward the user
        uint256 totalReward = mergeReward * tokenIds.length;
        (bool success, ) = msg.sender.call{value: totalReward}("");
        require(success, "Reward transfer failed");

        emit NFTsMerged(msg.sender, tokenIds, totalReward);
    }


    /**
     * @dev Withdraw function that allows the contract owner to withdraw accumulated Ether.
     */
    function withdraw() external nonReentrant {
        require(msg.sender == contractOwner, "Only owner can withdraw");
        uint256 amount = address(this).balance;
        require(amount > 0, "No Ether to withdraw");

        (bool success, ) = msg.sender.call{value: amount}("");
        require(success, "Withdrawal failed");

        emit Withdrawal(msg.sender, amount);
    }

    receive() external payable {}
}
