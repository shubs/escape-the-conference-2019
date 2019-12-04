const axios = require('axios');
const instance = axios.create({
    baseURL: 'http://127.0.0.1:3000/',
    timeout: 1000,
    responseType: 'json',
    headers: { 'X-Custom-Header': 'foobar' }
});

const VisitedCell = []

const startCellId = 'gj5GG0kHrvPaEobk'

function processCell(cellId) {
    instance.get('/cell/' + cellId)
        .then(function (response) {
            cellData = response.data
            checkCell(cellData)
        })
        .catch(function (error) {
            // handle error
            console.log(error);
        })
        .finally(function () {
            VisitedCell.push(cellData.id)
        });
}

function checkCell(cellData) {
    if (!VisitedCell.includes(cellData.id)) {
        console.log('visiting => ', cellData.name)
        if (cellData.content)
            console.log('\t\t\t=========>', cellData.content)
        if (cellData.south.id)
            processCell(cellData.south.id)
        if (cellData.north.id)
            processCell(cellData.north.id)
        if (cellData.west.id)
            processCell(cellData.west.id)
        if (cellData.east.id)
            processCell(cellData.east.id)
    }
}

processCell(startCellId)