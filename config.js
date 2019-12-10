var config = {}
config.keen = {};
config.escape = {}
config.mongo = 'mongodb://shubham:shubham92i@ds353738.mlab.com:53738/escape-the-game-2'

config.keen.projectId = "5de4f752c9e77c000170a5a8";
config.keen.writeKey = "1FE3BFCE8AD0456F30DAC272F5FF42FFF43063E253DFF5FCA4D3408F2D845B4C6830F9FEE146FBF44237BB2CF3E9FBB6A140B894377FE434839292EA085DE3EADF6C0399887C5F3AB5DE2EE1C2A09E3A137843A5DE27BA121F315D9E660D5587";

config.escape.privateKey = "3kjh2kj31h2dasljkasdlasj";
config.escape.port = process.env.PORT;
    config.escape.baseUrl = "http://escape.apidays.io"
    config.escape.host = "escape.apidays.io";

config.escape.riddles = [
    '379642',
    '523',
    'keyboard',
    '128',
    '445',
    '19',
    'abatylamij'
]
config.escape.token = config.escape.riddles.reduce((p, c) => p + '-' + c)


module.exports = config;
