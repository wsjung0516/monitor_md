/* 2021.2.14
function ajax(url) {
    let prom = new Promise(function (resolve, reject) {
        if (!!XMLHttpRequest) {
            let xhttp = new XMLHttpRequest();
            xhttp.timeout = 5000;

            xhttp.onload = function () {
                //console.log('DONE', this.status, this.readyState, this.responseText);
                if (this.readyState == 4 && (this.status == 200)) {
                    resolve(this.responseText);
                }
                reject({
                    readyState: this.readyState,
                    status: this.status
                });
            };

            xhttp.timeout = function () {
                //console.log('DONE', this.status, this.readyState, this.responseText);
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
*/
var cachedInstance;
async function getInstanceImage(seriesId, instanceUrlPrefix, instances) {
    let ajaxArr = [];
    // console.log('--------------- cornerstone')
    for (let i = 0; i < instances.length; i++) {
        try {
            var url = instanceUrlPrefix + instances[i];
/* 2021.2.14
            console.log('-------- [ct-image-downloader.js] url: '+url, i);
            let res = await ajax(url).catch(function (e) {
                throw new Error(e);
            });
*/
            var updateProgress;
            if (i % 20 === 0 || (instances.length - i) === 1) {
                updateProgress = true;
            } else {
                updateProgress = false;
            }

            ajaxArr[i] = {
                msg: 'instance',
                seriesId: seriesId,
                body: url,
                // body: res,
                imageId: instances[i],
                index: i,
                updateProgress: updateProgress
            }
        } catch (e) {
            ajaxArr[i] = {
                msg: 'error',
                seriesId: seriesId,
                body: e.stack || 'Error',
                imageId: instances[i],
                index: i,
                err: true,
                updateProgress: updateProgress
            }
        }

        //console.log('[ct-image-downloader.js] return: '+JSON.stringify(ajaxArr[i]));
        postMessage(ajaxArr[i]);
        /**
         * Check if image is cached, which is related with func. of onInstanceReceive(ct-viewer.service).
         * Cached status is from onInstanceReceive.
         * After checking the status, then send next image info to image loader( cornerstoneWADOImageLoader)
         * variable cachedInstance is sent from onInstanceReceive(ct-viewer.service) by postMessage of webWorker.
         *
         * Process of confirming if image is cashed completely.
         * startDownload(webworker.service)--> postMessage(ct-image-downloader.js) --> onmessage(webworker.service) -->
         *   <-- onInstanceReceive(ct-viewer.service) <-- onInstanceReceivedLister( webworker.service )
         * makeCacheImageByWebWorker(oc-viewer.js) -->postMessage(ct-viewer.service)--> onmessage(ct-image-downloader.js)
         * 2021.3.16 wsjung
         * */
        await checkIfImageCached(instances, i);


        if (stop === true) {
            console.log('[worker][getInstanceImage] stop downloading...');
            break;
        }

        // await sleep(30); // PACS 부하를 줄이기 위해 sleep 추가
    }
    
    var msg = {
        msg: 'complete',
        seriesId: seriesId
    }

    // postMessage(msg);

    return ajaxArr;
};

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}
/**
 * Check if caching work is completed by image loader( CornerstoneWADOImageLoader)
 * based on the image id of instances[].
 * And if this job is completed then next image id is sent again.
 * The reason for this job is to start new processing of selected study again if user
 * select other study in the middle of processing of current study.
 * 2021.08.17 wsjung
 * */
function checkIfImageCached(instances, i){
    return new Promise(resolve => {
        for( let j=0; j <= 1500;j++  ) {
            setTimeout(()=>{
                if( instances[i] === cachedInstance) {
                    // console.log('-----*****-- cachedInstance 1',instances[i], i,j, cachedInstance)
                    cachedInstance = '';
                    resolve(j)
                    j = 1500;
                }
            },j * 10)
        }
    })
}
onmessage = async function (e) {
    let actionResult;
    // trigger activity based on action
    // console.log('[ct-image-downloader.js] e.data: ', e.data);
    if (e.data.msg === 'download') {
        var instances = e.data.data;
        if (instances.length > 0) {
            actionResult = await getInstanceImage(e.data.seriesId, e.data.instanceUrlPrefix, instances, {});
            // 2021.2.14 actionResult = await downloadCtImages(e.data.seriesId, e.data.instanceUrlPrefix, instances);
        };
    } else if (e.data.msg === 'stop') {
        stop = true;
    } else if (e.data.msg === 'cachedInstance') {
        // console.log('-----------onmessage --- cached Instance 1', e.data.data);
        cachedInstance = e.data.data;
    }
};

stop = false;
