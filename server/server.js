const App = require('koa');
const md5 = require('md5');

const app = new App();

const devices = {
    '1000': '3I4BVzh78jdo&iv%'
}

const actions = {

}

app.use(async (ctx) => {
    console.log("REQUEST", ctx.method, ctx.path);
    if (ctx.method === "GET" && ctx.path == "/time") {
        ctx.body = Math.floor(Date.now() / 1000);
    } else if (ctx.method === 'POST' && ctx.path == "/action") {
        const device = ctx.query.device;
        const action = ctx.query.action;
        if (!device || !action || typeof device !== 'string' || typeof action !== 'string') {
            ctx.throw(400);
        }
        if (!ctx.query.ts) {
            ctx.throw(400);
        }
        const ts = Number(ctx.query.ts);
        if (!Number.isSafeInteger(ts)) {
            ctx.throw(400);
        }
        if (Math.abs(ts - (Date.now()/1000)) > 120) {
            console.log("timeout", ts, (Date.now()/1000), Math.abs(ts - (Date.now()/1000)));
            ctx.throw(401);
        }
        const key = devices[device];
        if (!key) {
            ctx.throw(401);
        }
        const sig = md5(`${device}${key}${action}${ts}`).toLowerCase();
        if (sig != ctx.query.sig) {
            console.log('valid sig', sig);
            ctx.throw(401);
        }
        actions[device] = action;
        ctx.body = "ok";
    } else if (ctx.method === 'POST' && ctx.path == "/fetch") {
        const device = ctx.query.device;
        if (!device || typeof device !== 'string') {
            ctx.throw(400);
        }
        if (!ctx.query.ts) {
            ctx.throw(400);
        }
        const ts = Number(ctx.query.ts);
        if (!Number.isSafeInteger(ts)) {
            ctx.throw(400);
        }
        if (Math.abs(ts - (Date.now()/1000)) > 120) {
            console.log("timeout", ts, (Date.now()/1000), Math.abs(ts - (Date.now()/1000)));
            ctx.throw(401);
        }
        const key = devices[device];
        if (!key) {
            ctx.throw(401);
        }
        const sig = md5(`${device}${key}${ts}`).toLowerCase();
        if (sig != ctx.query.sig) {
            console.log('valid sig', sig);
            ctx.throw(401);
        }
        ctx.body = actions[device] || "0";
        actions[device] = "0";
    }
});

app.listen(process.env.PORT || 23106);
