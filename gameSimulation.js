const fetch = require('node-fetch')
var randomString = () => Math.random().toString(36).substring(7);

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
            await asyncForEach(json, async (u) => {
                await waitFor(70);
                await asyncForEach(([0, 1, 2, 3, 4, 5, 12]), async level => {
                    await waitFor(70);
                    fetch(`http://localhost:3000/validate/${u.email}/${level}/${randomString()}`).then(r => {
                        console.log(r.url, r.status)
                    })
                });

            });
            console.log('Done');
        }

        )
}
start()