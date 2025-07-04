import config from "./config.js";
import { Web3 } from "web3";

const web3 = new Web3(new Web3.providers.HttpProvider(config.RPC_URL));
const contract = new web3.eth.Contract(config.CONTRACT_ABI, config.CONTRACT_ADDRESS);

/* ---------------------------- Ticket method ---------------------------- */

async function tokenURI(tokenId) {
    return await contract.methods.tokenURI(tokenId).call();
}

async function getTickets(walletAddress) {
    const ticketDetails = await contract.methods.getTickets(walletAddress).call();

    let tickets = [];
    for (let i = 0; i < ticketDetails[0].length; i++) {
        const res = await fetch(ticketDetails[1][i]);
        const details = await res.json();
        tickets[i] = {
            tokenId: parseInt(ticketDetails[0][i]), // tokenId를 정수로 변환
            tokenUri: ticketDetails[1][i], // URI
            details: details, // URI에 존재하는 티켓 정보
            issuer: ticketDetails[2][i], // 이벤트 주최자 주소
            buyer: ticketDetails[3][i], // 구매자 주소
            allowedUser: ticketDetails[4][i], // 티켓 사용 가능한 사용자 주소
            isUsed: ticketDetails[5][i] // 티켓 사용 여부
        }
    }

    return tickets;
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
    const tx = contract.methods.burnTicket(IssuerAddress, tokenId);
    return await sendSignedTransaction(tx);
}

/* ---------------------------- Group method ---------------------------- */

async function createGroup(memberAddress, groupAddress) {
    const tx = contract.methods.createGroup(memberAddress, groupAddress);
    return await sendSignedTransaction(tx);
}

async function inviteToGroup(from, to) {
    const tx = contract.methods.inviteToGroup(from, to);
    return await sendSignedTransaction(tx);
}

async function getInvites(memberAddress) {
    return await contract.methods.getInvites(memberAddress).call();
}

async function rejectInvite(memberAddress, groupAddress) {
    const tx = contract.methods.rejectInvite(memberAddress, groupAddress);
    return await sendSignedTransaction(tx);
}

async function acceptInvite(memberAddress, groupAddress) {
    const tx = contract.methods.acceptInvite(memberAddress,  groupAddress);
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

export default {
    // Ticket methods
    tokenURI, getTickets,
    mintTicket, useTickets, allowTicketUse, disallowTicketUse,
    shareTicket, cancelShareTicket, burnTicket,
    // Group methods
    getGroup, getOwners, isGroupMember, getInvites,
    createGroup, inviteToGroup, rejectInvite, acceptInvite, leaveGroup,
}