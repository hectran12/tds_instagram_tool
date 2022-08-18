const rq = require('./request.js');
const fs = require('fs');
const {
    Console
} = require('console');
class encrypassword {
    async encrypt(password) {
        return '#PWD_INSTAGRAM_BROWSER:0:1589682409:' + password;
    }
}
class Instagram extends encrypassword {
    // Constructor instagram
    constructor(...args) {
        super(...args);
        this.isLogin = args[0];
        if (this.isLogin) {
            this.username = args[1];
            this.password = args[2];
        } else {
            this.cookie = args[1];
        }
        this.headerSet = (crToken, cookie) => {
            var headers = {}
            headers["authority"] = "www.instagram.com"
            headers["accept"] = "*/*"
            headers["accept-language"] = "vi,en;q=0.9,en-US;q=0.8"
            headers["content-type"] = "application/x-www-form-urlencoded"
            headers["origin"] = "https://www.instagram.com"
            headers["referer"] = "https://www.instagram.com/"
            headers["sec-ch-prefers-color-scheme"] = "dark"
            headers["user-agent"] = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/103.0.5060.134 Safari/537.36 Edg/103.0.1264.77"
            if (crToken) {
                headers["x-csrftoken"] = crToken;
            } else {
                headers['cookie'] = cookie;
            }
            headers["x-requested-with"] = "XMLHttpRequest"
            return headers;
        }
    }

    // get cookie with request to main page
    async getCookie() {
        return new Promise(function(resolve, reject) {
            rq.requestGET('https://www.instagram.com/', '', {}).then((data) => {
                resolve(data);
            }).catch((data) => {
                reject(data);
            })
        });
    }

    // to sstring cookie
    async toStringCookie(cookies) {
        let cookie = '';
        cookies.forEach(function(item) {
            cookie += item.split(';')[0] + ';';
        });
        return cookie;
    }

    // get public key
    async getDataShared(type = false, cookie = '') {
        var header = this.headerSet('', cookie);
        return new Promise(function(resolve, reject) {
            rq.requestGET('https://www.instagram.com/data/shared_data/', '', header).then((data) => {
                resolve(data);
            }).catch((data) => {
                reject(data);
            })
        });
    }

    // save cookie
    async saveCookie(cookie) {
        try {
            var text = cookie.join("\n");
            fs.writeFileSync('./lib/cookie.hex', text);
        } catch {
            fs.writeFileSync('./lib/cookie.hex', cookie);
        }


    }

    // login instagram
    async login() {
        var data = await this.getCookie();
        let headers, cookies;
        headers = data.headers;
        this.header = headers
        const getData = await this.getDataShared();
        const crToken = getData.data.config.csrf_token;
        var pass = await this.encrypt(this.password);
        var params = new URLSearchParams({
            enc_password: pass,
            username: this.username,
            queryParams: '{}',
            optIntoOneTap: false,
            stopDeletionNonce: '',
            trustedDeviceRecords: '{}'

        });
        var headerSet = this.headerSet(crToken);
        //headerSet['cookie'] = await this.toStringCookie(data.headers['set-cookie']);
        return new Promise(function(resolve, reject) {
            rq.requestPOST('https://www.instagram.com/accounts/login/ajax/', params, headerSet).then(data => {
                if (data.data.authenticated == true) {
                    resolve(data);
                } else {
                    reject(data);
                }
            }).catch((data) => {
                reject(data);
            })
        });
    }

    // loads cookie
    async LoadCookie() {
        var body = await this.getDataShared(true, this.cookie);

        var result = body.data.config.viewer;
        if (result != null) {
            var cookie_str = '';
            var sp = this.cookie.split(';');
            sp.forEach(function(item) {
                cookie_str += item + '; Domain=.instagram.com; expires=' + new Date().toUTCString() + '; Max-Age=31449600; Path=/; Secure' + "\n";
            });
            this.saveCookie(cookie_str);
        }
        return result == null ? false : body;
    }

}

class insta_function extends Instagram {
    constructor() {
        super(...arguments);
        var data = fs.readFileSync('./lib/cookie.hex', 'utf8');
        var toS = (cookie) => {
            var sp = cookie.split("\n")
            var cookie_str = '';
            sp.forEach(function(item) {
                if (item != ' ' || item != '')
                    cookie_str += item.split(';')[0] + '; ';
            });
            return cookie_str.split('; ;')[0].replace(' ', '');
        }
        this.cookie = toS(data);
    }

    async head() {
        var json = await this.getDataShared(true, this.cookie);
        var headers = this.headerSet(json.data.config.csrf_token);
        headers['cookie'] = this.cookie;
        headers["x-instagram-ajax"] = "1005951515";
        return headers;
    }

    async action(url, params = {}) {
        var headers = await this.head();
        return new Promise(function(resolve, reject) {
            rq.requestPOST(url, params, headers).then(data => {
                resolve(data);
            }).catch(data => {
                reject(data);
            })
        })
    }

    async follow(id) {
        return this.action("https://www.instagram.com/web/friendships/" + id + "/follow/")
    }

    async unfollow(id) {
        return this.action("https://www.instagram.com/web/friendships/" + id + "/unfollow/")
    }

    async getIDPost(code) {
        var headers = await this.head();
        return new Promise(function(resolve, reject) {
            rq.requestGET("https://www.instagram.com/p/" + code + "/", '', {
                'cookie': headers['cookie']
            }).then(data => {
                var idPost = data.data.split('{"media_id":"')[1].split('"')[0];
                resolve(idPost);
            }).catch(data => {
                reject(data);
            })
        });
    }

    async hearthPost(id) {
        return this.action("https://www.instagram.com/web/likes/" + id + "/like/");
    }

    async unhearthPost(id) {
        return this.action("https://www.instagram.com/web/likes/" + id + "/unlike/");
    }

    async comment(id, text) {
        var params = new URLSearchParams({
            comment_text: text,
            replied_to_comment_id: ''
        });
        return this.action("https://www.instagram.com/web/comments/" + id + "/add/", params);
    }

    async removeComment(idPost, idComment) {
        return this.action("https://www.instagram.com/web/comments/" + idPost + "/delete/" + idComment + "/");
    }

    async hearthComment(idComment) {
        return this.action('https://www.instagram.com/web/comments/like/' + idComment + '/');
    }

    async unhearthComment(idComment) {
        return this.action('https://www.instagram.com/web/comments/unlike/' + idComment + '/');
    }
}



module.exports = {
    encrypassword,
    Instagram,
    insta_function
}