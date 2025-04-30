const config = require("./config");
const { Web3 } = require("web3");

const web3 = new Web3(new Web3.providers.HttpProvider(config.RPC_URL));
const contract = new web3.eth.Contract(config.CONTRACT_ABI, config.CONTRACT_ADDRESS);

/* ---------------------------- Ticket method ---------------------------- */

async function getTickets(walletAddress) {
    return await contract.methods.getTickets(walletAddress).call();
}

async function mintTicket(from, to, tokenUri) {
    try {
        const tx = contract.methods.mintTicket(from, to, tokenUri);
        return await sendSignedTransaction(tx);
    } catch (error) {
        throw error;
    }
}

async function shareTicket(memberAddress, tokenId) {
    try {
        const tx = contract.methods.shareTicket(memberAddress, tokenId);
        return await sendSignedTransaction(tx);
    } catch (error) {
        throw error;
    }
}

async function cancelShareTicket(memberAddress, tokenId) {
    try {
        const tx = contract.methods.cancelShareTicket(memberAddress, tokenId);
        return await sendSignedTransaction(tx);
    } catch (error) {
        throw error;
    }
}

async function burnTicket(IssuerAddress, tokenId) {
    try {
        const tx = contract.methods.cancelShareTicket(IssuerAddress, tokenId);
        return await sendSignedTransaction(tx);
    } catch (error) {
        throw error;
    }
}

/* ---------------------------- Group method ---------------------------- */

async function joinGroup(memberAddress, groupAddress) {
    try {
        const tx = contract.methods.joinGroup(memberAddress,  groupAddress);
        return await sendSignedTransaction(tx);
    } catch (error) {
        throw error;
    }
}

async function leaveGroup(memberAddress) {
    try {
        const tx = contract.methods.leaveGroup(memberAddress);
        return await sendSignedTransaction(tx);
    } catch (error) {
        throw error;
    }
}

async function getGroup(memberAddress) {
    try {
        return await contract.methods.getGroup(memberAddress).call();
    } catch (error) {
        throw error;
    }
}

async function isGroupMember(memberAddress) {
    try {
        return await contract.methods.isGroupMember(memberAddress).call();
    } catch (error) {
        throw error;
    }
}

/* ------------------------------------------------------------------------------------ */

async function sendSignedTransaction(tx) {
    try {
        const feeData = await web3.eth.getBlock("latest");

        const data = tx.encodeABI();
        const gas = await tx.estimateGas({from: config.SIGNER_ADDRESS});
        const maxPriority = web3.utils.toWei('2', 'gwei');
        const maxFee = Number(feeData.baseFeePerGas) + Number(maxPriority);
        const nonce = await web3.eth.getTransactionCount(config.SIGNER_ADDRESS);

        const signedTx = await web3.eth.accounts.signTransaction(
            {
                to: config.CONTRACT_ADDRESS,
                data: data,
                gas: gas,
                maxPriorityFeePerGas: maxPriority,
                maxFeePerGas: maxFee,
                nonce: nonce,
                chainId: config.CHAIN_ID,
            },
            config.SIGNER_PRIVATE_KEY
        );

        const receipt = await web3.eth.sendSignedTransaction(signedTx.rawTransaction);
        return receipt.transactionHash;
    } catch (error) {
        throw error;
    }
}

module.exports = {
    // Ticket methods
    getTickets,
    mintTicket, shareTicket, cancelShareTicket, burnTicket, // 상태 변경: gas 비용 발생

    // Group methods
    getGroup, isGroupMember,
    joinGroup, leaveGroup, // 상태 변경: gas 비용 발생
}