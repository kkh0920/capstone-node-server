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
        const transactionHash = await contract.joinGroup(memberAddress, groupAddress);

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

// 그룹 구성원 가입 API (groupAddress, otherAddress 필요)
router.post('/api/group/join', async function (req, res, next) {
    try {
        const groupAddress = req.body.groupAddress;
        const memberAddress = req.body.memberAddress;
        console.log("Group address: " + groupAddress + '\n' + "Your address: " + memberAddress);

        // TODO: Spring DB의 그룹 초대 요청 테이블에 있는 초대 요청 데이터를 제거한다. (요청 데이터: groupAddress, memberAddress)
        // TODO: "요청이 없으면" 에러 리턴

        await contract.joinGroup(memberAddress, groupAddress);

        res.status(200).send("Group joined successfully");
    } catch (error) {
        console.log(error);
        res.status(500).send('failed to add owner');
    }
});

// 그룹 초대 요청 조회 API (memberAddress)
router.get('/api/group/request', async function (req, res, next) {
    const memberAddress = req.query.memberAddress;

    // TODO: 1. Spring Database에 접근하여 회원 체크: memberAddress
    // TODO: 2. memberAddress로 그룹 초대 요청 테이블 값을 가져오고 프론트에 전달
})

// 그룹 초대 요청 API (memberAddress, otherAddress)
router.post('/api/group/request', async function (req, res, next) {
    const memberAddress = req.body.memberAddress;
    const otherAddress = req.body.otherAddress;
    console.log("Member address: " + memberAddress + '\n' + "Other address: " + otherAddress);

    if (await contract.isGroupMember(otherAddress)) {
        console.log(otherAddress + "is already group member");
        res.status(400).send("This member is already group member");
        return;
    }

    const groupAddress = await contract.getGroup(memberAddress);
    console.log("Group address: " + groupAddress);

    // TODO: Spring Database에 접근 (요청 데이터: memberAddress, otherAddress, groupAddress)
    // TODO:    1. 그룹 초대 요청 테이블 저장: (groupAddress, otherAddress)
    // TODO:    2. 이미 요청이 있으면 에러 리턴

    // 이후, 사용자가 초대 수락을 누르면 그룹 구성원 가입 API를 호출
    res.status(200).send('Request sent successfully');
});

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