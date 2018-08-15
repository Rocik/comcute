/**
 * Web Workers wrapper.
 * @param  {string|Function} javaScriptFunction Script to run in the workers.
 * @constructor
 */
function WW(javaScriptFunction) {
    'use strict';

    /**
     * Event handler executed when any worker changes their progress.
     * @param  {number} progressPercentage - Amount of work done from 0 to 100.
     * @param  {number} workerIndex - Internal worker id.
     * @param  {*} [extraData] - Anything passed from worker.
     */
    this.onProgressChanged = function(progressPercentage, workerIndex, extraData) {};

    /**
     * Pool of all Web Workers extended with:
     * isBusy - task is running
     * callback - function execetured on finish
     * @type {Array.<Worker>}
     */
    const workers = [];
    /**
     * List of scripts to include in each worker.
     * @type {Array.<string>}
     */
    const includes = [];
    /**
     * Tasks queue used when no workers are free to store future jobs.
     * @type {Array.<{input: *, callback: Function}>}
     */
    const jobQueue = [];
    /**
     * Worker controller function.
     * @type {string}
     */
    const workerCode = __workerLogic.toString();

    /**
     * Worker user's function.
     * @type {string}
     */
    let workerFunction;
    let usedWorkers = 0;
    let totalProgress = 0;
    let progressGoal = 1;


    /**
     * @constructor
     */
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


    /**
     * Sets maximum amount of Web Workers (threads) in the pool.
     * Works on any point of execution when no tasks are running.
     * By default the pool has size of logical processors - 1.
     * @param  {number} amount - desired workers count.
     */
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


    /**
     * Sends script files to all workers.
     * @param  {...string} filename_args - Relative or absolute filenames to scripts.
     */
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


    /**
     * @return {number}
     */
    this.getFreeWorkers = function() {
        return workers.length - usedWorkers;
    };


    /**
     * @return {number}
     */
    this.getUsedWorkers = function() {
        return usedWorkers;
    };


    /**
     * Start task on first first unoccupied worker.
     * @param  {*} input - Any data direcly sent to the worker.
     * @param  {Function} [callback] - Executed after the task is done.
     * @return {Promise} When callback is null Promise is returned.
     */
    this.run = function(input, callback) {
        if (callback === undefined) {
            return new Promise((resolve, reject) => {
                this.run(input, resolve);
            });
        }

        if (!runOnUnoccupiedWorker(input, callback))
            jobQueue.push({ input, callback });
    };


    /**
     * Terminate all workers.
     */
    this.dispose = function() {
        for (let worker of workers)
            worker.terminate();
    };


    /**
     * Create blob "file" with merged controller and user's function that runs at the start.
     * @param  {string} javaScriptText - The user's script to attach.
     * @return {URL} Blob location.
     */
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


    /**
     * Creates initalized Worker object.
     */
    function spawnWorker() {
        const workerUrl = createBlob(workerFunction);
        const worker = new Worker(workerUrl);
        worker.addEventListener('message', handleMessageFromWorker);
        worker.postMessage({type: 'import', data: includes});
        worker.isBusy = false;
        workers.push(worker);
    }


    /**
     * Start a task on the first unoccupied Worker.
     * @param  {*} input - Any data direcly sent to the worker.
     * @param  {Function} [callback] - Executed after the task is done.
     * @return {boolean}  True if found free worker.
     */
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


    /**
     * Command Worker to start processing data.
     * @param  {number} workerIndex
     * @param  {*} input - Any data direcly sent to the worker.
     */
    function startWorker(workerIndex, input) {
        workers[workerIndex].postMessage({
            type: 'start',
            data: input,
            index: workerIndex
        });
        workers[workerIndex].isBusy = true;
        usedWorkers++;
    }


    /**
     * Remove desired amount of Workers from the pool.
     * Prioritize unoccupied Workers.
     * @param  {number} amount - How many workers will be removed.
     */
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


    /**
     * @return {string} - Domain without subdirectory.
     */
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


    /**
     * Parses all messages from Workers.
     * @param  {Object.data.{type: string, ...*}} msg - Worker message.
     */
    const handleMessageFromWorker = (msg) => {
        switch (msg.data.type) {
            case 'import': {
                var index = includes.indexOf(msg.data.oldFilename);
                if (index !== -1)
                    includes[index] = msg.data.newFilename;
                break;
            }
            case 'progress': {
                const valueChanged = msg.data.difference;
                const wid = msg.data.index;
                const extraData = msg.data.extra;
                parseProgressUpdate(valueChanged, wid, extraData);
                break;
            }
            case 'finished': {
                usedWorkers--;

                const wid = msg.data.index;
                parseFinishedWorker(wid, msg.data.result);
                break;
            }
            default:
                throw 'Unknown worker message type';
        }
    };


    /**
     * @param  {[type]} valueChanged - How much progress has changed.
     * @param  {[type]} workerId
     * @param  {[type]} [extraData]
     */
    const parseProgressUpdate = (valueChanged, workerId, extraData) => {
        if (typeof this.onProgressChanged === 'function') {
            totalProgress += valueChanged;
            if (totalProgress > 100 * progressGoal) {
                totalProgress -= 100 * progressGoal;
                progressGoal = usedWorkers;
            }
            this.onProgressChanged(totalProgress / progressGoal, workerId, extraData);
        }
    };


    /**
     * @param  {number} wid - Worker index / id.
     * @param  {*} result - Task results from Worker.
     */
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


    /**
     * !!!  This function CANNOT direcly access anything outside it  !!!
     *
     * Insides of this function are script which controls data flow within Worker.
     */
    function __workerLogic() {
        if (self.document !== undefined) {
            console.error("Executing web worker code outside worker is not allowed.");
            return;
        }

        let workerIndex = -1;
        let previousProgress = 0;
        let progressGoal = -1;


        /**
         * Sets value that represents 100% of progress.
         * @param  {number} [goal=100]
         */
        self.setProgressGoal = function(goal) {
            progressGoal = goal;
        }


        /**
         * @param  {number} value - Current progress value.
         * @param  {*} extraData
         */
        self.updateProgress = function(value, extraData) {
            const percent = (progressGoal > 0) ?
                value / progressGoal * 100 : value;

            const difference = percent - previousProgress;
            previousProgress = percent;

            self.postMessage({
                type: 'progress',
                difference: difference,
                index: workerIndex,
                extra: extraData
            });
        };


        /**
         * Parses message from main thread.
         * @param  {Object.data.{type: string, ...*}} msg - Main thread message.
         */
        self.onmessage = function(msg) {
            switch (msg.data.type) {
                case "import":
                    importScripts(msg.data);
                    break;
                case "start":
                    workerIndex = msg.data.index;
                    previousProgress = 0;
                    progressGoal = -1;
                    const result = doWork(msg.data.data);
                    self.postMessage({
                        type: 'finished',
                        result: result,
                        index: workerIndex
                    });
                    break;
                default:
                    throw 'Unknown main thread message type';
            }
        };


        /**
         * Loads additional script files.
         * With relative paths tries finding them on subdirectories.
         * @param  {string[]} data List of script filenames.
         */
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


        /**
         * @param  {URL} url     - Script file location.
         * @param  {URL} selfUrl - Worker blob location.
         * @return {boolean}     - True if loaded something.
         */
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
