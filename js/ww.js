"use strict";

// TODO: parameters verification (types)

function WW(javaScriptFunction) {
    const workers = [];
    const includes = [];

    this.onProgressChanged = function(p) {;};


    function construct() {
        if (typeof javaScriptFunction === 'function')
            var workerUrl = createBlob(javaScriptFunction.toString());
        else
            var workerUrl = createBlob(javaScriptFunction);

        console.info(workerUrl); // TODO: remove later
        createWorker(workerUrl);
    }


    this.import = function() {
        const url = getDomainUrl();

        for (var argument of arguments) {
            const script = url + argument;
            includes.push(script);
            if (Array.isArray(workers) && workers.length)
                workers[0].postMessage({type: 'import', data: script});
        }
    }


    this.run = function(input, callback) {
        workers[0].callback = callback;
        startWorker(workers[0], input);
    }


    this.dispose = function() {
        for (let worker of workers)
            worker.terminate();
    }


    function createBlob(javaScriptText) {
        const workerCode = _workerCode.toString();
        const blobParts = [
            '(', workerCode, ')();',
            'function doWork(workerInputData) {',
                'return (', javaScriptText, ')(workerInputData)',
            '};'
        ];
        const workerBlob = new Blob(blobParts, { type:'text/javascript' });
        return URL.createObjectURL(workerBlob);
    }


    function createWorker(workerUrl) {
        const worker = new Worker(workerUrl);
        worker.addEventListener('message', handleMessageFromWorker);
        worker.postMessage({type: 'import', data: includes});
        worker.isBusy = false;
        workers.push(worker);
    }


    function startWorker(worker, input) {
        worker.postMessage({type: 'start', data: input});
        worker.isBusy = true;
    }


    function getDomainUrl() {
        const url = window.location.href;
        if (url.slice(-1) === '/')
            return url;
        return url + '/';
    }


    const handleMessageFromWorker = (msg) => {
        switch (msg.data.type) {
            case 'progress':
                if (typeof this.onProgressChanged === 'function')
                    this.onProgressChanged(msg.data.data);
                break;
            case 'finished':
                workers[0].callback(msg.data.data);
                workers[0].isBusy = false;
                break;
            default:
                throw 'Unknown worker message type';
        }
    }


    // This function CANNOT direcly access anything outside it
    function _workerCode() {
        if (self.document !== undefined) {
            console.error("Executing web worker code outside worker is not allowed.");
            return;
        }

        self.updateProgress = function(value, outOf) {
            if (arguments.length === 1)
                var percent = value;
            else
                var percent = value / outOf * 100;

            self.postMessage({type: 'progress', data: percent});
        }

        self.onmessage = function (msg) {
            switch (msg.data.type) {
                case "start":
                    const result = doWork(msg.data.data);
                    self.postMessage({type: 'finished', data: result});
                    break;
                case "import":
                    const includes = msg.data.data;
                    if (Array.isArray(includes) && includes.length)
                        self.importScripts(includes);
                    else if (typeof includes === 'string')
                        self.importScripts(includes);
                    break;
                default:
                    throw "";
            }
        }
    }

    construct();
}
