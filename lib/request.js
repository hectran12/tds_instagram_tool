const axios = require('axios');
async function requestGET(url, params, headers) {
    const uri = url + params
    return await axios({
        method: 'GET',
        url: uri,
        headers: headers
    })
}

async function requestPOST(url, params, headers) {
    return await axios({
        method: 'POST',
        url: url,
        data: params,
        headers: headers
    });
}

module.exports = {
    requestGET,
    requestPOST
}