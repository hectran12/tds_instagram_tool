const axios = require('axios');
const fs = require('fs');
const rq = require('./request.js')

const readFile = (path) => {
    return fs.readFileSync(path, 'utf-8');
}


async function checkFileConfig() {
    return fs.existsSync('./config.json');
}
async function getInfoTDS() {
    var json = JSON.parse(readFile('./config.json'))
    let token_tds, cookie_ins;
    token_tds = json.token_tds
    cookie_ins = json.cookie_ins
    return rq.requestGET('https://traodoisub.com/api/', '?fields=profile&access_token=' + token_tds, {});
}


module.exports = {
    getInfoTDS,
    checkFileConfig
}