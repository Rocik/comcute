function WW(javaScriptFunction) {
    'use strict';

    this.onProgressChanged = function(progressPercentage) {};

    const workers = []; // extenstions to Worker: isBusy, callback
    const includes = [];
    const jobQueue = []; // { input, callback }
    const workerCode = __workerLogic.toString();

    let workerFunction;
    let usedWorkers = 0;
    let totalProgress = 0;
    let progressGoal = 1;


    function constructor() {
        if (typeof javaScriptFunction === 'function')
            workerFunction = javaScriptFunction.toString();
        else
            workerFunction = javaScriptFunction;

        let logicalProcessors = window.navigator.hardwareConcurrency;
        if (logicalProcessors > 1)
            logicalProcessors--;

        for (let i = 0; i < logicalProcessors; ++i)
            spawnWorker();
    }


    this.setWorkersAmount = function(amount) {
        if (usedWorkers > 0)
            throw new Error("Changing workers amount while some of them are running is not allowed.");

        usedWorkers = 0;
        progressGoal = amount;

        if (workers.length < amount) {
            const workersToAdd = amount - workers.length;
            for (let i = 0; i < workersToAdd; ++i)
                spawnWorker();
        } else if (workers.length > amount) {
            const workersToRemove = workers.length - amount;
            removeWorkers(workersToRemove);
        }
    };


    this.import = function() {
        const baseUrl = getBaseDomainUrl();

        for (var argument of arguments) {
            let argUrl = new URL(argument, baseUrl);
            let fullPath = argUrl.href;
            includes.push(fullPath);

            if (Array.isArray(workers) && workers.length) {
                for (const worker of workers)
                    worker.postMessage({
                        type: 'import',
                        includes: fullPath,
                        // self.location inside Worker does not include subdirectory
                        location: getStringifiedLocation()
                    });
            }
        }
    };


    this.getFreeWorkers = function() {
        return workers.length - usedWorkers;
    };


    this.getUsedWorkers = function() {
        return usedWorkers;
    };


    this.run = function(input, callback) {
        if (callback === undefined) {
            return new Promise((resolve, reject) => {
                this.run(input, resolve);
            });
        }

        if (!runOnUnoccupiedWorker(input, callback))
            jobQueue.push({ input, callback });
    };


    this.dispose = function() {
        for (let worker of workers)
            worker.terminate();
    };


    function createBlob(javaScriptText) {
        const blobParts = [
            '(', workerCode, ')();',
            'function doWork(workerInputData) {',
                'return (', javaScriptText, ')(workerInputData)',
            '};'
        ];
        const workerBlob = new Blob(blobParts, { type:'text/javascript' });
        return URL.createObjectURL(workerBlob);
    }


    function spawnWorker() {
        const workerUrl = createBlob(workerFunction);
        const worker = new Worker(workerUrl);
        worker.addEventListener('message', handleMessageFromWorker);
        worker.postMessage({type: 'import', data: includes});
        worker.isBusy = false;
        workers.push(worker);
    }


    function runOnUnoccupiedWorker(input, callback) {
        for (let i = 0; i < workers.length; ++i) {
            if (workers[i].isBusy === false) {
                workers[i].callback = callback;
                startWorker(i, input);
                return true;
            }
        }

        return false;
    }


    function startWorker(workerIndex, input) {
        workers[workerIndex].postMessage({
            type: 'start',
            data: input,
            index: workerIndex
        });
        workers[workerIndex].isBusy = true;
        usedWorkers++;
    }


    function removeWorkers(amount) {
        for (let i = 0; i < amount; ++i) {
            let removed = false;

            for (let j = 0; j < workers.length; ++j) {
                if (workers[j].isBusy === false) {
                    workers[j].terminate();
                    workers.splice(j, 1);
                    removed = true;
                    break;
                }
            }

            if (!removed) {
                workers[workers.length - 1].terminate();
                workers.pop();
            }
        }
    }


    function getBaseDomainUrl() {
        const url = window.location.origin;
        if (url.slice(-1) === '/')
            return url;
        return url + '/';
    }


    const getStringifiedLocation = () => {
        if (this.testLocation !== undefined)
            return this.testLocation;
        return window.location.toString();
    };


    const handleMessageFromWorker = (msg) => {
        switch (msg.data.type) {
            case 'import':
                var index = includes.indexOf(msg.data.oldFilename);
                if (index !== -1)
                    includes[index] = msg.data.newFilename;
                break;
            case 'progress':
                const valueChanged = msg.data.difference;
                const extraData = msg.data.extra;
                parseProgressUpdate(valueChanged, extraData);
                break;
            case 'finished':
                usedWorkers--;

                const wid = msg.data.index;
                parseFinishedWorker(wid, msg.data.result);
                break;
            default:
                throw 'Unknown worker message type';
        }
    };


    const parseProgressUpdate = (valueChanged, extraData) => {
        if (typeof this.onProgressChanged === 'function') {
            totalProgress += valueChanged;
            if (totalProgress > 100 * progressGoal) {
                totalProgress -= 100 * progressGoal;
                progressGoal = usedWorkers;
            }
            this.onProgressChanged(totalProgress / progressGoal, extraData);
        }
    };


    const parseFinishedWorker = (wid, result) => {
        const worker = workers[wid];
        worker.isBusy = false;
        if (typeof worker.callback === 'function')
            worker.callback(result);

        if (worker.isBusy === false) {
            if (jobQueue.length > 0) {
                const job = jobQueue.shift();
                worker.callback = job.callback;
                startWorker(wid, job.input);
            }
        }
    };


    // This function CANNOT direcly access anything outside it
    function __workerLogic() {
        if (self.document !== undefined) {
            console.error("Executing web worker code outside worker is not allowed.");
            return;
        }

        let workerIndex = -1;
        let previousProgress = 0;

        self.updateProgress = function(value, outOf, extraData) {
            const percent = (arguments.length === 1) ?
                value : value / outOf * 100;

            const difference = percent - previousProgress;
            previousProgress = percent;

            self.postMessage({
                type: 'progress',
                difference: difference,
                extra: extraData
            });
        };

        self.onmessage = function (msg) {
            switch (msg.data.type) {
                case "import":
                    importScripts(msg.data);
                    break;
                case "start":
                    workerIndex = msg.data.index;
                    previousProgress = 0;
                    const result = doWork(msg.data.data);
                    self.postMessage({
                        type: 'finished',
                        result: result,
                        index: workerIndex
                    });
                    break;
                default:
                    throw "";
            }
        };


        function importScripts(data) {
            const includes = data.includes;
            if (Array.isArray(includes) && includes.length)
                self.importScripts(includes);
            else if (typeof includes === 'string') {
                try {
                    self.importScripts(includes);
                } catch (e) {
                    const url = new URL(includes);
                    const selfUrl = new URL(data.location);
                    if (!loadScriptOnSubdomainFolder(url, selfUrl))
                        throw e;
                }
            }
        }


        function loadScriptOnSubdomainFolder(url, selfUrl) {
            if (url.origin == selfUrl.origin) {
                const subdir = selfUrl.pathname.split('/', 2)[1];

                if (subdir != url.pathname.split('/', 2)[1]) {
                    const rootDir = url.origin + '/' + subdir;
                    const newPath = rootDir + url.pathname;

                    try {
                        self.importScripts(newPath);
                    } catch (e) {
                        return false;
                    }

                    console.warn("Imported scripts are on a different root location: " + rootDir + "/");
                    self.postMessage({
                        type: 'import',
                        oldFilename: url.toString(),
                        newFilename: newPath
                    });
                    return true;
                }
            }

            return false;
        }
    }


    constructor();
}
