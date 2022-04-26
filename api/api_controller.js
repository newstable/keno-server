const axios = require("axios");
const rand = require("random-seed").create();
require("dotenv").config();

// Users List

const usersPoints = {};
var rewardInfos = {
    2: [1, 9, 0, 0, 0, 0, 0, 0, 0, 0],
    3: [0, 2, 47, 0, 0, 0, 0, 0, 0, 0],
    4: [0, 2, 5, 91, 0, 0, 0, 0, 0, 0],
    5: [0, 0, 3, 12, 820, 0, 0, 0, 0, 0],
    6: [0, 0, 3, 4, 70, 1600, 0, 0, 0, 0],
    7: [0, 0, 1, 2, 21, 400, 7000, 0, 0, 0],
    8: [0, 0, 0, 2, 12, 100, 1650, 10000, 0, 0],
    9: [0, 0, 0, 1, 6, 44, 335, 4700, 10000, 0],
    10: [0, 0, 0, 0, 5, 24, 142, 1000, 4500, 10000],
}

const GetBallRandom = async (user) => {
    for (var i = 0; i < 20;) {
        var rNum = rand.intBetween(1, 80);
        if (user.BallRandomNum.indexOf(rNum) !== -1) {
            continue;
        }
        user.BallRandomNum[i] = rNum;
        i++;
    }
}

const WinCheck = async (user) => {
    user.WinNumber = [];
    user.winCount = 0;
    for (var i = 0; i < user.Clicknumber; i++) {
        var num = user.RandomArray[i] * 1;
        if (user.BallRandomNum.indexOf(num) !== -1) {
            user.winCount++;
        }
    }
}

const winMoney = async (user) => {
    user.MyWinmoney = user.betBalance * user.ListArray[user.winCount - 1];
}

module.exports = {
    StartSignal: async (req, res) => {
        try {
            const { token, betValue, ChooseNumbers, ClickNumber } = req.body;
            try {
                var result = await axios.post(
                    process.env.PLATFORM_SERVER + "api/games/bet",
                    {
                        token: token,
                        amount: betValue,
                    }
                );
            } catch (err) {
                throw new Error("Bet Error")
            }

            let user = usersPoints[token];

            if (user === undefined) {
                usersPoints[token] = {
                    RandomArray: [],
                    MyWinmoney: 0,
                    BallRandomNum: [],
                    betBalance: 0,
                    winCount: 0,
                    Clicknumber: 0,
                    ListArray: []
                }
                user = usersPoints[token];
            }
            user.betBalance = betValue;
            user.RandomArray = ChooseNumbers.split(",");
            user.Clicknumber = ClickNumber;
            user.ListArray = rewardInfos[user.Clicknumber];
            await GetBallRandom(user);
            await WinCheck(user);
            await winMoney(user);
            try {
                await axios.post(
                    process.env.PLATFORM_SERVER + "api/games/winlose",
                    {
                        token: token,
                        amount: user.MyWinmoney,
                        winState: user.MyWinmoney != 0 ? true : false,
                    }
                );
            } catch {
                throw new Error("Server Error");
            }
            try {
                res.json({
                    BallNumbers: user.BallRandomNum,
                    WinMoney: user.MyWinmoney,
                    Message: "Success"
                })
            } catch {
                throw new Error("Front end is killed");
            }
        } catch (err) {
            res.json({
                BallNumbers: [],
                WinMoney: 0,
                Message: err.message
            });
        }
    },
};
