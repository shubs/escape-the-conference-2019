var config = {}
config.keen = {};
config.escape = {}
config.mongo = 'XXX'

config.keen.projectId = "XX";
config.keen.writeKey = "xx";

config.escape.privateKey = "xx";
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
