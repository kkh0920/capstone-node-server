import express from 'express';
const router = express.Router();

import contract from '../src/contract.js';
import safe from '../src/safe.js';

// 그룹 조회 API
router.get('/api/group', async function (req, res, next) {
    try {
        const memberAddress = req.query.memberAddress
        const groupAddress = await contract.getGroup(memberAddress);

        console.log('-------------- Group Info --------------');
        console.log("Your Address: ", memberAddress);
        console.log("Group Address: ", groupAddress);

        const owners = await contract.getOwners(groupAddress); // 1. 그룹 구성원
        const tickets = await contract.getTickets(groupAddress);  // 2. 그룹 티켓 (tokenId, ipfsUri)

        console.log('Owners: ', owners);
        console.log('Tickets: ', tickets);
        console.log('----------------------------------------\n');

        res.status(200).send({
            groupAddress: groupAddress,
            owners: owners,
            tokens: tickets
        });
    } catch (error) {
        console.log(error);
        console.log('----------------------------------------\n');
        res.status(500).send('failed to get group');
    }
});

// 그룹 생성 API
router.post('/api/group', async function (req, res, next) {
    try {
        const memberAddress = req.body.memberAddress;

        console.log("-------------- Group Create --------------");
        console.log("Member address: " + memberAddress);

        // 그룹 유무 체크
        if (await contract.isGroupMember(memberAddress)) {
            console.log("Already group member");
            res.status(400).send('Already group member');
            return;
        }
        // 그룹 생성 (Safe Wallet 트랜잭션) & 블록체인에 그룹 정보 저장
        const groupAddress = await safe.createGroup();
        const transactionHash = await contract.createGroup(memberAddress, groupAddress);

        console.log('Group Address: ' + groupAddress);
        console.log('----------------------------------------\n');

        res.status(200).send({
            groupAddress: groupAddress,
            transactionHash: transactionHash
        });
    } catch (error) {
        console.log(error);
        console.log('----------------------------------------\n');
        res.status(500).send('failed to create group');
    }
});

// 그룹 탈퇴 API
router.post('/api/group/leave', async function (req, res, next) {
    try {
        const memberAddress = req.body.memberAddress;

        console.log("-------------- Group Leave --------------");
        console.log("Member address: " + memberAddress);
        console.log('----------------------------------------\n');

        await contract.leaveGroup(memberAddress);

        res.status(200).send('Group left successfully');
    } catch (error) {
        console.log(error);
        res.status(500).send('failed to leave group');
    }
})

/* -------------------------------- 그룹 초대 관련 API -------------------------------- */

// 그룹 초대 요청 조회 API (memberAddress)
router.get('/api/group/invite', async function (req, res, next) {
    try {
        const memberAddress = req.query.memberAddress;

        console.log("-------------- Group Invite Request --------------");
        console.log("Member address: " + memberAddress);

        const invites = await contract.getInvites(memberAddress);

        console.log('Invites: ', invites); // 초대 받은 그룹 주소 목록
        console.log('--------------------------------------------------\n');

        res.status(200).send({
            invites: invites
        });
    } catch (error) {
        console.log(error);
        console.log('--------------------------------------------------\n');
        res.status(500).send('failed to get group invite request');
    }
})

// 그룹 초대 요청 API (from, to)
router.post('/api/group/invite', async function (req, res, next) {
    try {
        const from = req.body.from;
        const to = req.body.to;

        console.log("-------------- Group Invite Request --------------");
        console.log("From: " + from);
        console.log("To: " + to);
        console.log('--------------------------------------------------\n');

        await contract.inviteToGroup(from, to);

        res.status(200).send('Invite request sent successfully');
    } catch (error) {
        console.log(error);
        res.status(500).send('failed to send group invite request');
    }
});

// 그룹 초대 요청 수락 API (groupAddress, memberAddress 필요)
router.post('/api/group/invite/accept', async function (req, res, next) {
    try {
        const groupAddress = req.body.groupAddress;
        const memberAddress = req.body.memberAddress;

        console.log("-------------- Group Join --------------");
        console.log("Group address: " + groupAddress);
        console.log("Member address: " + memberAddress);
        console.log('----------------------------------------\n');

        await contract.acceptInvite(memberAddress, groupAddress);

        res.status(200).send("Group joined successfully");
    } catch (error) {
        console.log(error);
        res.status(500).send('failed to add owner');
    }
});

// 그룹 초대 요청 거절 API (groupAddress, memberAddress 필요)
router.post('/api/group/invite/reject', async function (req, res, next) {
    try {
        const groupAddress = req.body.groupAddress;
        const memberAddress = req.body.memberAddress;

        console.log("-------------- Group Reject --------------");
        console.log("Group address: " + groupAddress);
        console.log("Member address: " + memberAddress);
        console.log('------------------------------------------\n');

        await contract.rejectInvite(memberAddress, groupAddress);

        res.status(200).send("Group invite rejected successfully");
    } catch (error) {
        console.log(error);
        res.status(500).send('failed to reject group invite');
    }
});

/* -------------------------------- 그룹 티켓 사용 권한 관련 API -------------------------------- */

// 티켓 사용 허가 API (from, to, tokenId)
router.post('/api/group/ticket/allow', async function (req, res, next) {
    try {
        const from = req.body.from;
        const to = req.body.to;
        const tokenId = req.body.tokenId;

        console.log('--------- Allow Ticket Use --------')
        console.log('From: ' + from);
        console.log('To: ' + to);
        console.log('Token ID: ' + tokenId);
        console.log('------------------------------------\n');

        await contract.allowTicketUse(from, to, tokenId);

        res.status(200).send('ticket use allowed successfully');
    } catch (error) {
        console.log(error);
        res.status(500).send('failed to allow ticket use');
    }
});

// 티켓 사용 허가 철회 API (from, to, tokenId)
router.post('/api/group/ticket/disallow', async function (req, res, next) {
    try {
        const from = req.body.from;
        const to = req.body.to;
        const tokenId = req.body.tokenId;

        console.log('--------- Disallow Ticket Use --------');
        console.log('From: ' + from);
        console.log('To: ' + to);
        console.log('Token ID: ' + tokenId);
        console.log('---------------------------------------\n');

        await contract.disallowTicketUse(from, to, tokenId);

        res.status(200).send('ticket use disallowed successfully');
    } catch (error) {
        console.log(error);
        res.status(500).send('failed to disallow ticket use');
    }
});

export default router;