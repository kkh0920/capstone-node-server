let express = require('express');
let router = express.Router();
let { ethers } = require('ethers');
const crypto = require('crypto');
const Safe = require('@safe-global/protocol-kit')
const { SigningMethod } = require('@safe-global/protocol-kit')
const config = require('../config');

const safeVersion = '1.4.1' // optional parameter

const provider = new ethers.JsonRpcProvider(config.RPC_URL);
const client = new ethers.Wallet(config.SIGNER_PRIVATE_KEY, provider);

// TODO: 기본적으로 1인 당 1개의 그룹에 속해있을 수 있다.

// 그룹 조회
router.get('/api/users/group', async function (req, res, next) {
    // TODO: Spring Database에 접근해서 address 사용자가 만든 그룹의 주소를 가져온다.
    const address = req.query.address
    console.log(address);

    const protocolKit = await Safe.default.init({
        provider: config.RPC_URL,
        safeAddress: '0xf740D17Ba071e224477095d6718041fa4b72BAE5' // TODO: DB에서 가져온 그룹 주소(Safe wallet)를 넣어주면 됨
    });

    // TODO: 그룹의 정보(가입된 사람들, 해당 지갑에 보유하고 있는 토큰 등)을 가져온 후 프론트에 넘겨준다.
    let owners = await protocolKit.getOwners();
    owners = owners.filter(owner => owner !== config.SIGNER_ADDRESS);
    console.log(owners);

    const result = {
        owners: owners
    }

    res.status(200).send(result);
});

// 그룹 생성 API
router.post('/api/users/group', async function (req, res, next) {
    // TODO: Spring Database에 접근해서 address 사용자가 속한 그룹이 "있으면" 에러 리턴

    const safeAccountConfig = {
        owners: [req.body.address, config.SIGNER_ADDRESS],
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
    await client.sendTransaction({
        to: deploymentTransaction.to,
        value: BigInt(deploymentTransaction.value),
        data: deploymentTransaction.data
    })

    const isDeployed = await protocolKit.isSafeDeployed()
    if(!isDeployed) {
        console.error('Group is not created');
        res.status(500);
        return;
    }

    // TODO: Spring Database에 접근해서 그룹 지갑 주소를 저장한다.
    const safeAddress = await protocolKit.getAddress()
    console.log(safeAddress);

    res.status(200).send(safeAddress);
});

// 그룹 구성원 가입 API
router.post('/api/users/group/add-owner', async function (req, res, next) {
    // TODO: 그룹 초대 요청 테이블에 있는 요청 데이터를 제거한다. "요청이 없으면" 에러 리턴
    // TODO: Spring Database에 접근해서 myAddress 사용자가 만든 그룹의 주소를 가져온다. "없으면" 에러 리턴
    const myAddress = req.body.myAddress;
    const otherAddress = req.body.otherAddress;
    console.log("Your address: " + myAddress + '\n' + "Other address: " + otherAddress);

    const protocolKit = await Safe.default.init({
        provider: config.RPC_URL,
        signer: config.SIGNER_PRIVATE_KEY, // executeTransaction을 통해 트랜잭션을 수행하기 위해서 signer가 필요함.
        safeAddress: '0xf740D17Ba071e224477095d6718041fa4b72BAE5' // TODO: DB에서 가져온 그룹 주소(Safe wallet)를 넣어주면 됨.
    });
    const addOwnerTransaction = await protocolKit.createAddOwnerTx({
        ownerAddress: otherAddress, // 그룹에 추가할 사람의 주소
        threshold: 1
    });
    await protocolKit.signTransaction(addOwnerTransaction);
    await protocolKit.executeTransaction(addOwnerTransaction);

    res.status(200);
});

// 그룹 초대 요청 API
router.post('/api/users/group/request/signature', async function (req, res, next) {
    const myAddress = req.body.myAddress;

    // 1. TODO: Spring Database에 접근해서 myAddress 사용자가 만든 그룹의 주소를 가져온다. "없으면" 에러 리턴
    const safeAddress = "0x123..."

    // 2. TODO: Spring Database에 접근해서 otherAddress 사용자가 속해있는 그룹을 가져온다. "존재하면" 에러 리턴
    const otherAddress = req.body.otherAddress;

    // 3. TODO: Spring Database에 접근해서 PK(myAddress, otherAddress) 값을 그룹 초대 요청 테이블에 저장한다. 이미 요청이 있으면 에러 리턴
    // 사용자가 초대 수락을 누르면 서명 후 그룹 구성원 가입 API를 호출하는 방식
});

router.get('/', function(req, res, next) {
    res.render('index', { title: 'Express' });
});

module.exports = router;