self.onmessage = (e) => {
    // console.log('------------ onmessage cachDict',e, e.data.cacheDict,e.data.instances.length)
    let cachedImageLength = 0;
    if( e.data.instances && e.data.instances.length === 0) return ;
    let cacheDict = e.data.cacheDict;
    let instances = e.data.instances;
    for (let i = 0; i < cacheDict.length; i++) {
        let cachedImage = cacheDict[i];
        if (instances.indexOf(cachedImage.replace('wadouri:', '')) !== -1) {
            cachedImageLength++;
        }
    }
    postMessage({cachedImageLength});
}
