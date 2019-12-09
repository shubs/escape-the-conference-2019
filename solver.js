const axios = require('axios');
const instance = axios.create({
    baseURL: 'http://127.0.0.1:3000/',
    timeout: 1000,
    responseType: 'json',
    headers: { 'X-Custom-Header': 'foobar' }
});

const VisitedCell = []
var map = {}

const startCellId = process.argv[2] || 'By6NPNtyuRvSW97K'

console.log('------------->' + startCellId)

function processCell(cellId, x, y) {
    instance.get('/cell/' + cellId)
        .then(function (response) {
            cellData = response.data
            checkCell(cellData, x, y)
        })
        .catch(function (error) {
            // handle error
            console.log(error);
        })
        .finally(function () {
            VisitedCell.push(cellData.id)

            // for (let i = -6; i < 6; i++) {
            //     for (let j = -6; j < 6; j++) {
            //         var index = i.toString() + ',' + j.toString()
            //         if (!map[index]){
            //             process.stdout.write(' . ');
            //         }
            //         else{ 
            //             if (map[index] > 10)
            //                 process.stdout.write(' '+ map[index] +'');
            //             else 
            //                 process.stdout.write(' '+ map[index] +' ');
            //         }
            //     }
            //     console.log('')
            // }
            // console.log('-------------------------------------')
        });
}

function checkCell(cellData, x, y) {
    if (!VisitedCell.includes(cellData.id)) {
        var index = x.toString() + ',' + y.toString()
        //map[index] = cellData.readableId
        console.log('visiting => ', cellData.name)
        if (cellData.content)
            console.log('\t\t\t=========>', cellData.content)
        if (cellData.south.id)
            processCell(cellData.south.id, x, y - 1)
        if (cellData.north.id)
            processCell(cellData.north.id, x + 1, y)
        if (cellData.west.id)
            processCell(cellData.west.id, x - 1, y)
        if (cellData.east.id)
            processCell(cellData.east.id, x, y + 1)
    }
}

processCell(startCellId, 0, 0)
