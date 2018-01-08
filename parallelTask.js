module.exports = async function parallelTask(task, shouldEnd, max) {
    let i = 0;
    let runningCnt = 0;
    return new Promise((resolve, reject) => {
        function check() {
            if (shouldEnd(i)) {
                return;
            }
            if (runningCnt > max) {
                return;
            }
            const promise = task(i);
            i++;
            runningCnt++;
            promise.then(() => {
                runningCnt--;
                check();
                if (runningCnt === 0) {
                    resolve();
                }
            }).catch(function (e) {
                reject(e);
            })
            check();
        }
        check();
    });

}