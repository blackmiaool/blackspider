var http = require('http');
const { URL } = require('url');
const images = require('./test2');
const fs = require('fs-extra');
const getIp = require('./getip');

const port = 33326;
const nginxPort = 33327;
function download(source, path) {
    return new Promise((resolve) => {
        const file = fs.createWriteStream(path);
        let url = new URL(source);
        const options = Object.assign({
            headers: {
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
                'Accept-Encoding': 'gzip, deflate, sdch',
                'Accept-Language': 'en,zh-CN;q=0.8,zh;q=0.6,zh-TW;q=0.4',
                'Cache-Control': 'no-cache',
                'Upgrade-Insecure-Requests': '1',
                'Pragma': 'no-cache',
                'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/58.0.3029.96 Safari/537.36',

            }
        }, { hostname: url.hostname, port: 80, path: url.pathname, 'protocol': 'http:' });
        const request = http.get(options, function (response) {
            response.pipe(file);
            file.on('finish', function () {
                resolve();
            });
        });
    });

}
let i = 0;
function padding(num, width) {
    num += '';
    if (num.length < width) {
        return '0'.repeat(width - num.length) + num;
    } else {
        return num;
    }
}
async function task() {
    for (let i = 0; i < images.length; i++) {
        await download(images[i], `result/${i + 1}.jpg`);
        console.log(i);
    }
}

var finalhandler = require('finalhandler')
var serveStatic = require('serve-static')

// Serve up public/ftp folder
var serve = serveStatic('./result', { 'index': ['index.html', 'index.htm'] })

// Create server
var server = http.createServer(function onRequest(req, res) {
    serve(req, res, finalhandler(req, res))
})

// Listen
server.listen(nginxPort)
function createPDF(sourcePath, length, targetPath) {
    const PDFDocument = require('pdfkit')
    doc = new PDFDocument();
    doc.pipe(fs.createWriteStream(targetPath));

    const option = {
        fit: [612, 792],
        align: 'center',
        valign: 'center',
    };

    for (let i = 1; i <= length; i++) {
        let ref = doc;
        if (i !== 1) {
            ref = doc.addPage();
        }
        ref.image(`${sourcePath}/${i}.jpg`, 0, 0, option);
    }
    doc.end()
}
// createPDF('result/1514797855093',217,'result/1514797855093/1514797855093.pdf');

// const io = require('blacksocket.io/server')(port, {
//     path: '/test'
// });
// io.on('connection', function (socket) {
//     socket.on('task', async (list) => {
//         const time = Date.now();
//         const targetFolder = `result/${time}`;

//         await fs.ensureDir(targetFolder);
//         for (let i = 0; i < list.length; i++) {
//             await download(list[i], `${targetFolder}/${i + 1}.jpg`);
//             socket.emit('progress', i + '');
//         }
//         const target = `${targetFolder}.pdf`;
//         createPDF(targetFolder, list.length, target);
//         return `http://${getIp()[0]}:${nginxPort}/${target}`;
//     });
// });
// process.on('uncaughtException', (err) => {
//     console.error(err.stack);
//     console.log('Node NOT Exiting...');
// });
// process.on('unhandledRejection', (reason, p) => {
//     console.log('Unhandled Rejection at:', p, 'reason:', reason);
//     // application specific logging, throwing an error, or other logic here
// });
console.log(getIp());


const Koa = require('koa');
const app = new Koa();
var bodyParser = require('koa-bodyparser');
var exec = require('child_process').exec;
var sys = require('util')

app.use(bodyParser());
// response
let progressMap = {};
app.use(async ctx => {
    const params = ctx.request.body;
    console.log(params);
    console.log(ctx.path)
    ctx.set('Access-Control-Allow-Origin', ctx.request.header.origin);

    if (ctx.path === "/task") {
        console.log(1);
        const time = Date.now();
        const targetFolder = `result/${time}`;
        const { list, id } = params;
        async function doDownload() {
            await fs.ensureDir(targetFolder);
            for (let i = 0; i < list.length; i++) {
                console.log(list[i], `${targetFolder}/${i + 1}.jpg`);
                await download(list[i], `${targetFolder}/${i + 1}.jpg`);
                progressMap[id] = `${i}/${list.length}`;
            }
            const target = `${targetFolder}.pdf`;
            createPDF(targetFolder, list.length, target);
            const finalUrl = `http://${getIp()[0]}:${nginxPort}/${target}`;
            progressMap[id] = finalUrl;
        }
        if (!progressMap[id]) {
            progressMap[id] = `0/${list.length}`;
            doDownload();
        }
        ctx.body = JSON.stringify({ code: 0 });

    } else if (ctx.path === '/progress') {
        const { id } = params;
        ctx.body = progressMap[id];
    }
});

app.listen(25334);