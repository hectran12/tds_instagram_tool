const rq = require('./request.js');
const fs = require('fs');
const {
    Console
} = require('console');

class TDS_JOB {
    constructor(token) {
        this.url = 'https://traodoisub.com/api/';
        this.token_tds = token;
    }
    async actionGET(params) {
        var url = this.url;
        var token_tds = this.token_tds;
        return new Promise(function(resolve, reject) {
            rq.requestGET(url, params + '&access_token=' + token_tds, {}).then(data => {
                resolve(data);
            }).catch(data => {
                reject(data);
            })
        });
    }

    async getInfoTDS() {
        return this.actionGET('?fields=profile');
    }

    async datCauhinh(id) {
        return this.actionGET('?fields=instagram_run&id=' + id);
    }

    async getJob(type) {
        return this.actionGET('?fields=' + type);
    }

    async guiDuyetID(type, id) {
        return this.actionGET('coin/?type=' + type + '&id=' + id);
    }
}

module.exports = {
    TDS_JOB
}