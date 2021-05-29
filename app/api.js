import md5 from 'md5';

const server = "http://dev.eldereal.me:23106";

export async function validate(deviceId, deviceSecret) {
    const ts = Math.floor(Date.now() / 1000);
    const str = `${deviceId}${deviceSecret}${ts}`;
    const sig = md5(str).toLowerCase();

    const r = await fetch(`${server}/validate?device=${deviceId}&ts=${ts}&sig=${sig}`, {
        method: 'POST'
    });
    if (r.status !== 200) {
        if (r.status === 401) {
            throw new Error('设备编号或密码错误');
        } else {
            throw new Error('网络错误，请稍后重试');
        }
        
    }
}

export async function action(deviceId, deviceSecret, cycles) {
    const ts = Math.floor(Date.now() / 1000);
    const sig = md5(`${deviceId}${deviceSecret}${cycles}${ts}`).toLowerCase();
    const url = `${server}/action?device=${deviceId}&ts=${ts}&action=${cycles}&sig=${sig}`;
    console.log("POST", url);
    const r = await fetch(url, {
        method: 'POST'
    });
    if (r.status !== 200) {
        if (r.status === 401) {
            throw new Error('设备编号或密码错误');
        } else {
            throw new Error('网络错误，请稍后重试');
        }
    }
}

