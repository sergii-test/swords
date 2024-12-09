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
      swords.connect(minter).mint(0, { value: mintPrice})
    ).to.be.revertedWith("Must mint at least one NFT");
  });
  it("Minting should fail when not enough Ether passed", async function () {
    const [owner, minter] = await ethers.getSigners();
    const Swords = await ethers.getContractFactory("Swords");
    const swords = await Swords.deploy();
    await swords.deployed();
    
    const mintPrice = await swords.mintPrice();
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
    
    const mintPrice = await swords.mintPrice();
    const tx = await swords.connect(minter).mint(1, { value: mintPrice });
    await tx.wait();

    expect( (await swords.balanceOf(minter.address)).toNumber()).equal(1);
  });
    it("Minting many NFT with correct parameters should succeed", async function () {
   
    const howMany = 21;
    
    const [owner, minter] = await ethers.getSigners();
    const Swords = await ethers.getContractFactory("Swords");
    const swords = await Swords.deploy();
    await swords.deployed();
    
    const mintPrice = await swords.mintPrice();
    let totalValue = mintPrice.mul(howMany);
    const tx = await swords.connect(minter).mint(howMany, { value: totalValue });
    await tx.wait();

    expect( (await swords.balanceOf(minter.address)).toNumber()).equal(howMany);
  });
  it("Non-owner should not be able to withdraw", async function () {
    const [owner, minter] = await ethers.getSigners();
    const Swords = await ethers.getContractFactory("Swords");
    const swords = await Swords.deploy();
    await swords.deployed();

    await expect(
        swords.connect(minter).withdraw()
    ).to.be.revertedWith("Only owner can withdraw");
  });
  it("Owner should be able to withdraw", async function () {
    const [owner, minter] = await ethers.getSigners();
    const Swords = await ethers.getContractFactory("Swords");
    const swords = await Swords.deploy();
    await swords.deployed();

    await expect(
        swords.connect(owner).withdraw({gasLimit: 3000000}) //some ethers bug made me configuure gas 
    ).not.to.be.reverted;
  });
  it("Merging less than two NFTs should fail", async function () {
    const [owner, minter] = await ethers.getSigners();
    const Swords = await ethers.getContractFactory("Swords");
    const swords = await Swords.deploy();
    await swords.deployed();
    
    const mintPrice = await swords.mintPrice();
    const tx = await swords.connect(minter).mint(1, { value: mintPrice });
    await tx.wait();

    const tokenID = await swords.tokenOfOwnerByIndex(minter.address, 0);
    
    await expect(
      swords.connect(minter).mergeNFTs([tokenID])
    ).to.be.revertedWith("Need at least two NFTs to merge");
  });
  it("Merging exactly two NFTs should work", async function () {
    const [owner, minter] = await ethers.getSigners();
    const Swords = await ethers.getContractFactory("Swords");
    const swords = await Swords.deploy();
    await swords.deployed();
    
    const mintPrice = await swords.mintPrice();
    let totalValue = mintPrice.mul(2);
    const tx = await swords.connect(minter).mint(2, { value: totalValue });
    await tx.wait();

    const tokenOne = await swords.tokenOfOwnerByIndex(minter.address, 0);
    const tokenTwo = await swords.tokenOfOwnerByIndex(minter.address, 1);
    
    //checks needed
    // 1. not reverted
    // 2. IDs tokenOne and tokenTwo burned
    // 3. New token minted (not checking for radomness yet so ignore entropy)
    // 4. Balance increased by mergeReward
    //const minterBalance = await provider.getBalance(minter.address);
    await expect(
      swords.connect(minter).mergeNFTs([tokenOne, tokenTwo])
    ).not.to.be.reverted;
    expect(await swords.checkNoneExist([tokenOne, tokenTwo])).to.be.true;

    //const minterBalanceNew = await provider.getBalance(minter.address);
  });


});
