function convertToken(ticketDetails) {
    let tokens = [];
    for (let i = 0; i < ticketDetails[0].length; i++) {
        tokens[i] = {
            tokenId: parseInt(ticketDetails[0][i]), // tokenId를 정수로 변환
            tokenUri: ticketDetails[1][i], // IPFS URI
            issuer: ticketDetails[2][i], // 이벤트 주최자 주소
            buyer: ticketDetails[3][i], // 구매자 주소
            allowedUser: ticketDetails[4][i], // 티켓 사용 가능한 사용자 주소
            isUsed: ticketDetails[5][i] // 티켓 사용 여부
        }
    }
    return tokens;
}

module.exports = {
    convertToken
};