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
    
    const mintPrice = await swords.mintPrice();

    await expect(
      swords.connect(minter).mint(0, { value: mintPrice })
    ).to.be.revertedWith("Must mint at least one NFT");
  });
  it("Minting should fail when not enough Ether passed", async function () {
    const [owner, minter] = await ethers.getSigners();
    
    const Swords = await ethers.getContractFactory("Swords");
    const swords = await Swords.deploy();
    await swords.deployed();
    
    mintPrice = await swords.mintPrice();
    let decrementedPrice = mintPrice.sub(1);

    await expect(
        swords.connect(minter).mint(1, { value: decrementedPrice })
    ).to.be.revertedWith("Insufficient Ether amount");
  });
  it("Minting one NFT with correct parameters should succeed", async function () {
    const [owner, minter] = await ethers.getSigners();
    
    const Swords = await ethers.getContractFactory("Swords");
    const swords = await Swords.deploy();
    await swords.deployed();
    
    mintPrice = await swords.mintPrice();
    const tx = await swords.connect(minter).mint(1, { value: mintPrice });
    await tx.wait();

    expect( (await swords.balanceOf(minter.address)).toNumber()).equal(1);
  });
    it("Minting many NFT with correct parameters should succeed", async function () {
    const [owner, minter] = await ethers.getSigners();
    
    const Swords = await ethers.getContractFactory("Swords");
    const swords = await Swords.deploy();
    await swords.deployed();
    
    mintPrice = await swords.mintPrice();
    const howMany = 21;
    let totalValue = mintPrice.mul(howMany);
    const tx = await swords.connect(minter).mint(howMany, { value: totalValue });
    await tx.wait();

    expect( (await swords.balanceOf(minter.address)).toNumber()).equal(howMany);
  });
});
