/* eslint-disable no-undef */
// Right click on the script name and hit "Run" to execute
const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("Swords", function () {
  it("Minting zero number of NFTs should fail", async function () {
    const [owner, minter] = await ethers.getSigners();
    
    const Swords = await ethers.getContractFactory("Swords");
    const swords = await Swords.deploy();
    await swords.deployed();
    console.log("Contract \"Swords\" deployed at:" + swords.address);

    await expect(
        swords.connect(owner).mint(0, { value: ethers.utils.parseEther ("0.01") })
    ).to.be.revertedWith("Must mint at least one NFT");
  });
    
});
