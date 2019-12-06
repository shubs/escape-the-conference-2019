const fetch = require('node-fetch')
var randomString = () => Math.random().toString(36).substring(7);
const config = require('./config')
const _ = require('lodash')
async function asyncForEach(array, callback) {
    for (let index = 0; index < array.length; index++) {
        await callback(array[index], index, array);
    }
}
const waitFor = (ms) => new Promise(r => setTimeout(r, ms));
const start = async () => {
    fetch('https://randomuser.me/api/?results=20')
    .then(response => response.json())
    .then(json => json.results)
        .then(async (json) => {
            console.log(json.legnth)
            await asyncForEach(json, async (u) => {
                await waitFor(1000);
                await asyncForEach(([0, 1, 2, 3, 4, 5, 12]), async level => {
                    await waitFor(1000);
                    console.log(config.escape.riddles)
                    const validationChance = _.random(0, 1, true)
                    const hasGoodAnswer = validationChance < 0.75
                    const answer = hasGoodAnswer ? config.escape.riddles[level] : randomString()
                    try {
                        fetch(`http://localhost:3000/validate/${u.email}/${level}/${answer  }`).then(r => {
                            console.log(r.url, r.status)
                        })
                    }
                    catch(error) {
                        console.log(error)
                    }
                });

            });
            console.log('Done');
        }

        )
}
start()