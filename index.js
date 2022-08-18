const insta = require('./lib/instagram.js')
const fs = require('fs');
const { METHODS } = require('http');
const { runInContext } = require('vm');
const prompt = require('prompt-sync')({
    sigint: true
});

const dir =  require('./lib/dir.js');
const job = require('./lib/tds_job.js');
const { exit } = require('process');
const { isBuffer } = require('util');
const print = (...args) => console.log(...args)
const support = new insta.Instagram(false,'');
const menuJob = {
    "Like": 1,
    "follow": 2,
    "comment": 3,
    "like_comment": 4,
}
const bar = (length) => {
    var i = 0;
    var result = '';
    while (i <= length) { result += '='; i++; }
    return result;
}
async function MenuRUN () {
    const MenuRuns = [
        '[1] Chay',
        '[2] Đăng nhập instagram để export cookie'
    ]
    printList(MenuRuns);
    return prompt('Chọn: ');
}

async function printList (list) {
    for (let x in list) {
        print(list[x])
    }
}

async function printDict (dict) {
    for (let x in dict) {
        print(dict[x], '=>', x);
    }
}
// mất chuột r wtf, help me
async function config () {
    
    path = './config.json'
    let createNewConfig = () => {
        let json = {}
        json.token_tds = prompt("Nhap token tds: ")
        print('Bạn muốn sài cookie hay login insta?: ')
        choice = parseInt(prompt('Nhập 1 = sài ck, 2 = login: '))
        switch (choice) {
            case 1:
                json.isLogin = false;
                json.cookies = prompt('Nhập cookie: ');
                break;
            case 2:
                json.isLogin = true;
                json.username = prompt('Nhập username: ');
                json.password = prompt('Nhập password: ');
                break;
            case 3:
                print("Alo pri?");
        }
        print(bar(20) + 'JOB SETTING' + bar(20));
        printDict(menuJob);
        print(bar(18) + 'END JOB SETTING' + bar(18));
        let job, temp, jobExtra;
        job = prompt('Nhập job (ex: 1,2,3): ');
        temp = job.split(',');
        jobExtra = [];
        for (let x in temp) {
            num = temp[x];
            for (let x in menuJob) {
                if (num == menuJob[x]) {
                    jobExtra.push(x);
                }
            }
        }
        json.job_setting = {};
        print(json)
        for (let x in jobExtra) {
            var name = jobExtra[x];
            json.job_setting[name] = {}
            json.job_setting[name]['active'] = true;
            json.job_setting[name]["delay"] = parseInt(prompt('Nhập delay ' + name +': '));
            print(json)
        }
        // save
        fs.writeFileSync(path, JSON.stringify(json, null, 4), 'utf-8');
        print('Đã tạo file config.json, chúc mừng pri');
    }

    let oldConfig = () => {
        var json = JSON.parse(fs.readFileSync(path, 'utf-8'))
        return json;
    }
    try {
        if (dir.checkFileConfig()) {
            try {
                json = oldConfig();
                print(bar(40));
                print('Config trước đó');
                print(bar(40));
                for (let name in json) {
                    if (name == 'job_setting') {
                        print(bar(20)+'Job setting'+bar(20));
                        for (let n in json[name]) {
                            print(bar(20)+n+bar(20));
                            for (let m in json[name][n]) {
                                print(m, '=>', json[name][n][m]);
                            }
                            print(bar(20) + bar(n.length) + bar(20));
                        }
                    } else {
                        print(name,'=>',json[name]);
                    }
                }
               change = prompt('Bạn có muốn thay đổi (y/n): ').toUpperCase() == 'Y' ? true : false;
               if (change) {
                    createNewConfig();
               } else {
                    print('Okay pri');
               }
            } catch (err) {
                print('Gặp sự cố: ' + err);
                print('Mời bạn config lại');
                createNewConfig();
            }
           
        } else {
           createNewConfig(); 
        }
    } catch (err) {
        print(err);
    }
    
}

async function login_ins () {
    var json = JSON.parse(fs.readFileSync('./config.json', 'utf-8'));
    let username, password;
    if (json.isLogin) {
        username = json.username;
        password = json.password;
    }
    print('=> Dang dang nhap instagram')
    var instagram = new insta.Instagram(true, username, password);
    instagram.login().then(data=>{
        print('=> Dang nhap thanh cong, xin chuc mung!');
        instagram.saveCookie(data.headers['set-cookie']);
        print('=> Export thanh cong cookie')
    }).catch(err=>{
        print(err);
    });
}

async function run_start () {
    var cookies = fs.readFileSync('./lib/cookie.hex', 'utf-8');
    let json = JSON.parse(fs.readFileSync('./config.json', 'utf-8'));
    if (cookies) {
        
            var cookie = support.toStringCookie(json.isLogin == true ? cookies.split("\n") : json.cookies.split(';')).then(async data=>{
            var instagram = new insta.Instagram(false, data);
            var user_name;
            await instagram.LoadCookie().then(data=>{
                if (data == false) {
                    print('=> Cookie khong hop le, xin vui long config lai');
                } else {
                    print('=> Dang nhap thanh cong, xin chuc mung!');
                    print(bar(20) + 'TRANG THAI TAI KHOAN INSTAGRAM' + bar(20));
                    var info = data.data.config.viewer;
                    print('=> Full name: ', info.full_name);
                    print('=> FBID: ' + info.fbid);
                    print(bar(71));
                    user_name = info.username;
                }
            }).catch(err=>{
                print(err);
            }).finally(data=>{
                
                const tds = new job.TDS_JOB(json.token_tds);
                var check = tds.getInfoTDS().then(data=>{
                    if (data.data.success == 200) {
                        console.log('Dang nhap thanh cong tai khoan tds');
                        for (let x in data.data.data) {
                            var name = x[0].toUpperCase()+x.slice(1,x.length);
                            console.log(name,'=>',data.data.data[x]);
                        }
                        print(bar(71));
                        tds.datCauhinh(user_name).then(data=>{
                            const datas = data.data;
                            if (datas.success == 200) {
                                print('=> Dat cau hinh thanh cong');
                            } else {
                                print('=> Dat cau hinh that bai');
                                // exit
                                exit();
                            }
                        }).catch(err=>{
                            print(err);
                            exit();
                        }).finally(async data=>{
                            var locTags = () => {
                                var result = {}
                                for (let x in json.job_setting) {
                                    switch (x) {
                                        case 'Like':
                                            result['instagram_like'] = json.job_setting[x].delay;
                                            break;
                                        case 'follow':
                                            result['instagram_follow'] = json.job_setting[x].delay;
                                            break;
                                        case 'like_comment':
                                            result['instagram_likecmt'] = json.job_setting[x].delay;
                                            break;
                                        case 'comment':
                                            result['instagram_comment'] = json.job_setting[x].delay;
                                            break;
                                    }
                                }
                                return result;
                            }
                            // delay funciton
                            var delay = (ms) => {
                                currentDate = new Date().getTime() + ms;
                                while (new Date().getTime() <= currentDate) {
                                }
                            }
                            var action = new insta.insta_function();
                            var stt = 0;
                            while (true) {
                            
                                    var tags = locTags()
                                   
                                    for (let name in tags) {
                                        
                                        try {
                                            await tds.getJob(name).then(async data=>{
                                             
                                                for (let id in data.data.data) {
                                                    var item = data.data.data[id];
                                                    var ids = item.id;
                                                    var id_ = ids.split('_')[0];
                                                    var type = item.type;
                                                    var status = false;
                                                    var tags = '';
                                                    switch (type) {
                                                        case 'like':
                                                            await action.hearthPost(id_).then(data=>{
                                                                if(data.data.status == 'ok') {
                                                                    
                                                                    status = true;
                                                                }
                                                                
                                                            });
                                                            tags = 'INS_LIKE_CACHE';
                                                            break;
                                                        case 'follow':
                                                            await action.follow(id_).then(data=>{
                                                    
                                                                if(data.data.status == 'ok') {
                                                                    status = true;
                                                                }
                                                            });
                                                            tags = 'INS_FOLLOW_CACHE';
                                                            break;
                                                    }
                                                    if (status) {
                                                        await tds.guiDuyetID(tags, ids).then(data=>{
                                                            if(data.data.success == 200) {
                                                                var local = data.data;
                                                                print(stt, '=>', '[', type, ']', 'cache: ', local.data.cache, ' msg: ' + local.data.msg, ' pending: ', local.data.pending);
                                                                stt++;
                                                            }
                                                        });
                                                        await delay(tags[name]*1000);
                                                    } else {
                                                        print('[+] Lam job ' + type + ' that bai!');
                                                    }
                                                }
                                            });
                                        }catch {
                                            print('=> Block tinh nang hoac het job roi, thu lai sau nhe pri!');
                                            await delay(10000);
                                        }
                                        
                                    }
                                
                                
                            }
                           
                            
                        });
                        
                    } else {
                        console.log('Dang nhap that bai tai khoan tds');
                    }
                })

            });
        });
    } else {
        print('Hình như chưa có cookie á pri?');
    }
    
}


async function run() {
    var chRun = await MenuRUN();
    switch (parseInt(chRun)) {
        case 1:
            run_start();
            break;
        case 2:
            login_ins();
            break;
        default:
            print('Nhập cái gì vậy pri?');
    }
}

const Menu = [
    '[1] Config',
    '[2] Run' 
];
print(bar(50))
printList(Menu)
print(bar(50))
var num = parseInt(prompt('Chọn: '));
switch (num) {
    case 1:
        config();
        break;
    case 2:
        run();
        break;
    default:
        print('Alo pri?');
}