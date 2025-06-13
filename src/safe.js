import config from "./config.js";
import crypto from "crypto";
import { ethers } from 'ethers';
import Safe from '@safe-global/protocol-kit';

const safeVersion = '1.4.1' // optional parameter

const provider = new ethers.JsonRpcProvider(config.RPC_URL);
const client = new ethers.Wallet(config.SIGNER_PRIVATE_KEY, provider);

async function getOwners(safeAddress) {
    const protocolKit = await Safe.default.init({
        provider: config.RPC_URL,
        safeAddress: safeAddress
    });
    let owners = await protocolKit.getOwners();
    return owners.filter(owner => owner !== config.SIGNER_ADDRESS);
}

async function createGroup() {
    const safeAccountConfig = {
        owners: [config.SIGNER_ADDRESS],
        threshold: 1
    }
    const predictSafe = {
        safeAccountConfig,
        safeDeploymentConfig: {
            saltNonce: BigInt('0x' + crypto.randomBytes(8).toString('hex')),
            safeVersion: safeVersion
        }
    }
    const protocolKit = await Safe.default.init({
        provider: config.RPC_URL,
        predictedSafe: predictSafe
    })

    const deploymentTransaction = await protocolKit.createSafeDeploymentTransaction()
    const txResponse = await client.sendTransaction({
        to: deploymentTransaction.to,
        value: BigInt(deploymentTransaction.value),
        data: deploymentTransaction.data
    });
    const tx = await txResponse.getTransaction();
    const receipt = await tx.wait();

    console.log('safe transaction hash:', txResponse.hash);
    console.log('safe transaction receipt:', receipt);

    return await protocolKit.getAddress();
}

async function addOwner(memberAddress, groupAddress) {
    const protocolKit = await Safe.default.init({
        provider: config.RPC_URL,
        signer: config.SIGNER_PRIVATE_KEY, // executeTransaction을 통해 트랜잭션을 수행하기 위해서 signer가 필요함.
        safeAddress: groupAddress
    });
    const addOwnerTransaction = await protocolKit.createAddOwnerTx({
        ownerAddress: memberAddress,
        threshold: 1
    });
    await protocolKit.signTransaction(addOwnerTransaction);
    await protocolKit.executeTransaction(addOwnerTransaction);
}

export default {
    createGroup,
    getOwners,
    addOwner
}