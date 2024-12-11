# Vulnerability injection task
## 1. How To
### Getting code
Open the Remix IDE at [https://remix.ethereum.org](https://remix.ethereum.org)  
I will explain in details so even a new user will be able to reproduce the work. If this is your first login, accept cookies and press Next Next.. when it shows its features.  

Click Git icon on the leftmost panel, it will bring you to the Git tab. Login with GitHub (if you not logged in already). Once connected, go from the GitHub setup section up to Clone section. 
Press "Load from GitHub" and select sergii-test/swords, branch main, and press "clone..".  

Once cloning is complete, press "File explorer" icon, you should see folders there. Go to the "contracts" folder, it has two contracts, **innocence.sol** and **swords.sol**. The former is the exploit sample, DO NOT look inside yet. 
The latter is my vulnerable contract.  

Its overall context is an imaginable gaming project, with NFTs representing in-game swords. Each swords have different capabilities. But only ordinary swords can be minted. 
While swords with advanced capabilities can only be obtained by merging from 2 to 20 other swords. 
Internally the capabilities are mapped from "entropy", the higher it is, the more capable is the sword. With merging, a new sword is produced, with random chances for entropy (and so capabilities) boosting or nerfing.

Try to find out what's wrong with the **swords.sol** code.  

### Compiling
While still in "File explorer" tab, right click on first **.sol**, compile, and do the same with the other.
Ignore **innocence.sol** compilation warnings, no one cares about good code quality in exploits.

### Testing
You don't need to Deploy the contracts, the test harness used will do it itself. If this is not your first use of Remix, make sure to check the Environment is "Remix VM (Cancun)". Otherwise it is selected as default, do not worry.  

In File Explorer tab, go to "tests" folder, you will find there a single file **swords.test.js**. Right-click on it and press "Run" to run the test suite. Be patient, last two tests take a rather long time. All 13 tests should pass.

## 2. Vulnerabilities description

The very first vulnerability is quite obvious:
```
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
```
Randomness obtained in such a way can be easily manipulated by block proposers. This vulnerability is here with sole purpose to be a red rag and distract the inexperienced auditor. A proper way to fix is to obtain randomness from some good oracle.

The second vulnerability is real one. It works in a wider in-game context, because obtaining swords with advanced capabilities is to a large extent a game of chance, we predict advanced swords will trade at high prices. 
With the game becoming popular, this economics, in turn, can create economical sense for owner(s) of rare, and so highly priced, swords, to invest into preventing others from minting. 

Such a possibility is illustrated by the `Innocence` smart contract. It uses the fact that whenever NFT reciever is not EOA but smart contract, ERC721 implementation requires it to implement `IERC721Receiver` interface. 
And invokes the `onERC721Received()` callback on NFT status changes (minting, transfers, burn). My contract `Innocence` has an infinite loop in the callback implementation. 
An attacker, willing to invest into preventing others from obtaining high-value NFTs, can implement a DoS attack by repeatedly calling `mergeNFTs()` from `Innocence`, with the sole purpose for these transactions to fail with "out of gas".
This will make it much harder, if not impossible, for others to use this functionality.

Interestingly, such attacks are [quite popular](https://owasp.org/www-project-smart-contract-top-10/).

To fix the vulnerability, one needs to limit gas passed to `Swords.mergeNFTs()`
