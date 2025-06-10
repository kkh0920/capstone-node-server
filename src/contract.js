const config = require("./config");
const { Web3 } = require("web3");

const web3 = new Web3(new Web3.providers.HttpProvider(config.RPC_URL));
const contract = new web3.eth.Contract(config.CONTRACT_ABI, config.CONTRACT_ADDRESS);

/* ---------------------------- Ticket method ---------------------------- */

async function getTickets(walletAddress) {
    return await contract.methods.getTickets(walletAddress).call();
}

async function mintTicket(from, to, tokenUri) {
    const tx = contract.methods.mintTicket(from, to, tokenUri);
    return await sendSignedTransaction(tx);
}

async function useTickets(memberAddress, tokenId) {
    const tx = contract.methods.useTickets(memberAddress, tokenId);
    return await sendSignedTransaction(tx);
}

async function allowTicketUse(from, to, tokenId) {
    const tx = contract.methods.allowTicketUse(from, to, tokenId);
    return await sendSignedTransaction(tx);
}

async function disallowTicketUse(from, to, tokenId) {
    const tx = contract.methods.disallowTicketUse(from, to, tokenId);
    return await sendSignedTransaction(tx);
}

async function shareTicket(memberAddress, tokenId) {
    const tx = contract.methods.shareTicket(memberAddress, tokenId);
    return await sendSignedTransaction(tx);
}

async function cancelShareTicket(memberAddress, tokenId) {
    const tx = contract.methods.cancelShareTicket(memberAddress, tokenId);
    return await sendSignedTransaction(tx);
}

async function burnTicket(IssuerAddress, tokenId) {
    const tx = contract.methods.cancelShareTicket(IssuerAddress, tokenId);
    return await sendSignedTransaction(tx);
}

/* ---------------------------- Group method ---------------------------- */

async function joinGroup(memberAddress, groupAddress) {
    const tx = contract.methods.joinGroup(memberAddress,  groupAddress);
    return await sendSignedTransaction(tx);
}

async function leaveGroup(memberAddress) {
    const tx = contract.methods.leaveGroup(memberAddress);
    return await sendSignedTransaction(tx);
}

async function getGroup(memberAddress) {
    return await contract.methods.getGroup(memberAddress).call();
}

async function getOwners(groupAddress) {
    return await contract.methods.getOwners(groupAddress).call();
}

async function isGroupMember(memberAddress) {
    return await contract.methods.isGroupMember(memberAddress).call();
}

/* ------------------------------------------------------------------------------------ */

async function sendSignedTransaction(tx) {
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
}

module.exports = {
    // Ticket methods
    getTickets,
    mintTicket, useTickets, allowTicketUse, disallowTicketUse, // 상태 변경: gas 비용 발생
    shareTicket, cancelShareTicket, burnTicket, // 상태 변경: gas 비용 발생

    // Group methods
    getGroup, getOwners, isGroupMember,
    joinGroup, leaveGroup, // 상태 변경: gas 비용 발생
}