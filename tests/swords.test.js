/* eslint-disable no-undef */
// Right click on the script name and hit "Run" to execute
const { expect } = require("chai");
const { ethers } = require("hardhat");

//So objective is tests to be simple and flat as possible
describe("Swords", function () {
  it("Minting zero number of NFTs should fail", async function () {
    const [owner, minter] = await ethers.getSigners();
    const Swords = await ethers.getContractFactory("Swords");
    const swords = await Swords.deploy();
    await swords.deployed();
    
    const mintPrice = await swords.mintPrice();
    await expect( swords.connect(minter).mint(0, { value: mintPrice })).to.be.revertedWith("Must mint at least one NFT");
  });
  it("Minting should fail when not enough Ether passed", async function () {
    const [owner, minter] = await ethers.getSigners();
    const Swords = await ethers.getContractFactory("Swords");
    const swords = await Swords.deploy();
    await swords.deployed();
    
    const mintPrice = await swords.mintPrice();
    let decrementedPrice = mintPrice.sub(1);

    await expect( swords.connect(minter).mint(1, { value: decrementedPrice} ) ).to.be.revertedWith("Insufficient Ether amount");
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
    const [owner, minter] = await ethers.getSigners();
    const Swords = await ethers.getContractFactory("Swords");
    const swords = await Swords.deploy();
    await swords.deployed();
    
    const howMany = 21;
    const mintPrice = await swords.mintPrice();
    const totalValue = mintPrice.mul(howMany);
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

    const contractBalance = await ethers.provider.getBalance(swords.address);
    await expect(
        swords.connect(owner).withdraw({gasLimit: 3000000}) //some ethers bug made me to configuure gas 
      ).to.emit(swords, "Withdrawal", (receiver, amount) => {
          expect(receiver).to.equal(owner.address);
          expect(amount).to.equal(contractBalance);
        }).and.not.to.be.reverted;
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
    const totalReward = (await swords.mergeReward()).mul(2);

    await expect(
        swords.connect(minter).mergeNFTs([tokenOne, tokenTwo])
      ).to.emit(swords, "NFTsMerged", (receiver, ids, reward) => {
        expect(receiver).to.equal(minter.address);
        expect(reward).to.equal(totalReward);}
      ).and.not.to.be.reverted;

    expect(await swords.checkNoneExist([tokenOne, tokenTwo])).to.be.true;
    expect(await swords.balanceOf(minter.address)).to.be.equal(1);
  });
    it("Merging twenty NFTs should work", async function () {  
    const [owner, minter] = await ethers.getSigners();
    const Swords = await ethers.getContractFactory("Swords");
    const swords = await Swords.deploy();
    await swords.deployed();
    
    const howMany = 20;
    const mintPrice = await swords.mintPrice();
    let totalValue = mintPrice.mul(howMany);
    const tx = await swords.connect(minter).mint(howMany, { value: totalValue });
    await tx.wait();

    const arr = [];
    for (let i=0; i<howMany; i++)
      arr.push(await swords.tokenOfOwnerByIndex(minter.address, i));
    const totalReward = (await swords.mergeReward()).mul(howMany);

    await expect(
        swords.connect(minter).mergeNFTs(arr)
      ).to.emit(swords, "NFTsMerged", (receiver, ids, reward) => {
        expect(receiver).to.equal(minter.address);
        expect(reward).to.equal(totalReward);}
      ).and.not.to.be.reverted;

    expect(await swords.checkNoneExist(arr)).to.be.true;
    expect(await swords.balanceOf(minter.address)).to.be.equal(1);
  });
    it("Merging more than twenty NFTs should NOT work", async function () {  
    const [owner, minter] = await ethers.getSigners();
    const Swords = await ethers.getContractFactory("Swords");
    const swords = await Swords.deploy();
    await swords.deployed();
    
    const howMany = 21;
    const mintPrice = await swords.mintPrice();
    let totalValue = mintPrice.mul(howMany);
    const tx = await swords.connect(minter).mint(howMany, { value: totalValue });
    await tx.wait();

    const arr = [];
    for (let i=0; i<howMany; i++)
      arr.push(await swords.tokenOfOwnerByIndex(minter.address, i));

    await expect(
        swords.connect(minter).mergeNFTs(arr)
      ).to.be.revertedWith("Cannot merge more than 20 NFTs in one call");
  });
  it("Merge should revert if not enough balance", async function () {
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
    const tx1 = await swords.connect(owner).withdraw();
    await tx1.wait();

    await expect(
        swords.connect(minter).mergeNFTs([tokenOne, tokenTwo])
      ).to.be.revertedWith("Not enough balance for merges, wait for mints");
  });
  it("Above is data of always passing \"statistics\" test for swords boosting and nerfing", async function () {
    const [owner, minter] = await ethers.getSigners();
    const Swords = await ethers.getContractFactory("Swords");
    const swords = await Swords.deploy();
    await swords.deployed();
    
    let boosted = 0;
    let nerfed = 0;
    let index = 0; //counts minter NFTs

    for (let i=0; i<100; i+=2)
    {
      // we mint two, get their entropies sum
      const mintPrice = await swords.mintPrice();

      const tx = await swords.connect(minter).mint(1, { value: mintPrice });
      await tx.wait();  // with mint(2,..) these will be in the same block, so we mint separately
      index++;
      const tokenOne = await swords.tokenOfOwnerByIndex(minter.address, index-1);
      const entropy1 = await swords.entropyMap(tokenOne);

      const tx2 = await swords.connect(minter).mint(1, { value: mintPrice });
      await tx2.wait();
      index++;
      const tokenTwo = await swords.tokenOfOwnerByIndex(minter.address, index-1);
      const entropy2 = await swords.entropyMap(tokenTwo);

      const entropySum = entropy1.add(entropy2);
     
      // we merge and check resulting entropy, updating counters
      const tx3 = await swords.connect(minter).mergeNFTs([tokenOne, tokenTwo]);
      tx3.wait();
      index--; // 2 burned, 1 created
      const tokenMerged = await swords.tokenOfOwnerByIndex(minter.address, index-1);
      const entropyMerged = await swords.entropyMap(tokenMerged);

      if (entropyMerged.gt(entropySum)) boosted++;
      if (entropyMerged.lt(entropySum)) nerfed++;
    }
    // results output 
    console.log("     Out of 100 runs "+boosted+" boosted, "+nerfed+" nerfed");
    expect(1);
  });
  it("Vulnerability test with timeout of 3x block time", async function () {
    // appears Remix VM can't handle "out of gas" :(( so to test with timeout
    const [owner, minter] = await ethers.getSigners();
    const Swords = await ethers.getContractFactory("Swords");
    const swords = await Swords.deploy();
    await swords.deployed();
    const Innocence = await ethers.getContractFactory("Innocence");
    const innocence = await Innocence.deploy(swords.address);
    await swords.deployed();

    const mintPrice = await swords.mintPrice();
    const totalValue = mintPrice.mul(2);
    const tx = await innocence.connect(minter).mint(2, {value: totalValue});
    await tx.wait();
    const tx1 = await innocence.connect(minter).turnOn();
    await tx1.wait(); // now we have infinite loop enabled
    
    const tokenOne = await swords.tokenOfOwnerByIndex(innocence.address, 0);
    const tokenTwo = await swords.tokenOfOwnerByIndex(innocence.address, 1);

    const buildAndMinePromise = new Promise(async (resolve, reject) => {
    try {
      const txResponse = await innocence.connect(minter).mergeNFTs([tokenOne, tokenTwo]);
      const txReceipt = await txResponse.wait(); 
      resolve(txReceipt);
    } catch (error) {
        reject(error);
    }});
    try {
      await Promise.race([
        buildAndMinePromise,
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error("Transaction Timeout")), 36000) 
          // 3x block time is big still doesn't crash IDE
        )
      ]);
      expect.fail("Expected a timeout, but the transaction completed.");
    } catch (err) {
      expect(err.message).to.equal("Transaction Timeout"); // Assert the expected timeout message
    }
  });
});