var config = {}
config.keen = {};
config.escape = {}
config.mongo = 'mongodb://escape-me:escape92i@ds057857.mlab.com:57857/escape-the-game'

config.keen.projectId = "5de4f752c9e77c000170a5a8";
config.keen.writeKey = "1FE3BFCE8AD0456F30DAC272F5FF42FFF43063E253DFF5FCA4D3408F2D845B4C6830F9FEE146FBF44237BB2CF3E9FBB6A140B894377FE434839292EA085DE3EADF6C0399887C5F3AB5DE2EE1C2A09E3A137843A5DE27BA121F315D9E660D5587";

config.escape.privateKey = "SADSAHDICXBADSADISAD";
config.escape.host = "localhost";
config.escape.port = 3000;
config.escape.baseUrl = "http://127.0.0.1:3000";

config.escape.riddles = [
    '000',
    '111',
    '222',
    '333',
    '444',
    '555',
    '666'
]
config.escape.token = config.escape.riddles.reduce((p,c) => p+'-'+c)


module.exports = config;