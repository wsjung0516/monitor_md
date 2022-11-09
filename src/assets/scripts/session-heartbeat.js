function ajax(url) {
    let prom = new Promise(function (resolve, reject) {
        if (!!XMLHttpRequest) {
            let xhttp = new XMLHttpRequest();
            xhttp.timeout = 5000;

            xhttp.onload = function () {
                if (this.readyState == 4 && (this.status == 200)) {
                    resolve(this.responseText);
                }
                reject({
                    readyState: this.readyState,
                    status: this.status
                });
            };

            xhttp.timeout = function () {
                reject({
                    readyState: this.readyState,
                    status: this.status
                });
            };

            xhttp.open("GET", url, true);
            xhttp.send();
        }
    });
    return prom;
};

async function startHeartBeat(url, session_uuid) {
    var msg;

    while (1) {
        try {
            console.log('--- 1-- [SessionHeartBeatService:session-heartbeat.js] url: '+url);
            let res = await ajax(url).catch(function (e) {
                console.error('--- SessionHeartBeatService error ', error)

                throw new Error(e);
            });

            msg = {
                msg: 'result',
                url: url,
                session_uuid: session_uuid,
                body: JSON.parse(res)
            }
        } catch (e) {
            // msg[i] = {
            //     msg: 'error',
            //     seriesId: seriesId,
            //     body: e.stack || 'Error',
            //     imageId: instances[i],
            //     err: true,
            //     updateProgress: updateProgress
            // }
            console.error('--- SessionHeartBeatService error ', error)
        }
        console.log('--- 3-- [SessionHeartBeatService:session-heartbeat.js] url: '+url);

        postMessage(msg);

        if (stop == true) {
            console.log('--- 2 -- [SessionHeartBeatService:session-heartbeat.js] stop heartbeat, session_uuid: '+session_uuid);
            break;
        }

        await sleep(5000); // 5초에 한번씩 Heart Beat를 날리고 Session이 유효한지 확인한다.
    }

    var msg = {
        msg: 'complete',
        url: url,
        session_uuid: session_uuid
    }

    postMessage(msg);

    return;
};

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

onmessage = async function (e) {
    console.log('--- 0 -- [SessionHeartBeatService:session-heartbeat.js] message: '+JSON.stringify(e.data));

    if (e.data.msg == 'start') {
        var url = e.data.url;
        var session_uuid = e.data.session_uuid;
        await startHeartBeat(url, session_uuid);
    } else if (e.data.msg == 'stop') {
        stop = true;
    }
    return false;
};

stop = false;
