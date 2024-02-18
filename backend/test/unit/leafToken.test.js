const {expect} = require('chai');
const {ethers} = require('hardhat');

describe('LeafToken deployment', function () {
  let leafToken;
  let owner;


  beforeEach(async function () {
    const LeafToken = await ethers.getContractFactory("LeafToken");
    leafToken = await LeafToken.deploy(ethers.parseEther("1000000"));
    leafToken = leafToken.target;
  });

    it('Should deploy', async function () {
        expect(leafToken.address).to.not.equal(0);
    });


});