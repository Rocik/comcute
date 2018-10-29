/**
 *  Controls data flow: fetching data, running tasks, sending results
 */
var Runner = function(userSettings) {
    const self = this;

    let server;

    let running = true;
    let computeModule;
    let statusTexts = {};
    let ww;
    let previousProgress;
    let totalThreads;

    const canvases = document.getElementById('sim-canvas');
    const selectedCanvas = canvases.getElementsByClassName("selected")[0];
    const canvasDelayTimeouts = [];
    const canvasDelayMs = 500;

    const textStatus = document.getElementById('text-status');
    const computingStatus = document.getElementById('computing-status');

    let inputTaskIndex;
    let inputTaskGoal;
    let results;


    this.errorCallback = () => {};


    this.startComputing = function(server, comcuteModule) {
        self.server = server;
        computeModule = comcuteModule;

        createWW();
        
        running = true;
        statusTexts = {};

        populateWorkers();
    };


    this.stop = function() {
        if (ww !== undefined) {
            running = false;

            ww.dispose();
            ww = undefined;
        }
    };


    function populateWorkers() {
        if (computeModule.parallelTaskJobs === true) {
            totalThreads = ww.getFreeWorkers();
            for (let i = 0; i < totalThreads; ++i) {
                fetchInputData();
            }
        } else {
            totalThreads = 0;
            fetchInputData();
        }
    }


    function fetchInputData() {
        self.server.getDataPackage()
        .then(runJob)
        .catch(function(err) {
            console.log(err);
            if (err === 404) {
                if (ww.getUsedWorkers() === 0) {
                    self.errorCallback("ENDED");
                    return;
                }
                
                while(textStatus.lastChild.classList.contains("awaiting")) {
                    textStatus.removeChild(textStatus.lastChild);
                }             
            } else {
                self.errorCallback(err);
            }
        });
    };


    function runJob(data) {
        if (!running) {
            return;
        }

        if (data.input === null) {
            return;
        }

        console.info("Testing (" + data.UUID + "): " + data.input);

        updateStatusbar(data.input, data.UUID);

        const threadsAmount = ww.getFreeWorkers();
        for (let i = 0; i < threadsAmount; ++i) {
            canvasDelayTimeouts[i] = false;
        }

        inputTaskIndex = 0;
        if (typeof computeModule.getInputTasksAmount === 'function') {
            inputTaskGoal = computeModule.getInputTasksAmount(data.input);
            results = [];
        } else {
            inputTaskGoal = 0;
        }

        const onRunFinished = function(result) {
            if (inputTaskGoal > 0) {
                results.push(result);
                if (inputTaskIndex == inputTaskGoal) {
                    if (ww.getUsedWorkers() > 0) {
                        return;
                    }

                    if (typeof computeModule.getInputTasksAmount === 'function') {
                        result = computeModule.setResponse(results);
                    } else {
                        result = results;
                    }
                } else {
                    startTask(data.input, onRunFinished);
                    return;
                }
            }

            console.log("Results (" + data.UUID + "): " + result);

            self.server.setResults(data.UUID, [
                result,
                navigator.userAgent
            ])
            .catch(function(err) {
                self.errorCallback(err);
            });
            
            if (inputTaskGoal === 0) {
                fetchInputData();
            }

            delete statusTexts[data.UUID];
        }

        if (inputTaskGoal > 0) {
            for (let i = 0; i < threadsAmount; ++i) {
                startTask(data.input, onRunFinished);
            }
        } else {
            startTask(data.input, onRunFinished);
        }
    };


    function startTask(dataObject, onRunFinished) {
        const prepare = typeof computeModule.prepare === 'function';

        let inputData;
        if (inputTaskGoal > 0) {
            inputData = {
                data: dataObject,
                inputTaskIndex: inputTaskIndex,
            }
            inputTaskIndex++;
        } else if (prepare) {
            inputData = {
                data: dataObject
            }
        } else {
            inputData = dataObject;
        }

        if (prepare) {
            startPrepared(inputData, onRunFinished);
        } else {
            ww.run(inputData, onRunFinished);
        }
    }


    function startPrepared(inputData, onRunFinished) {
        (new Promise((resolve, reject) => {
            computeModule.prepare(inputData.data, resolve);
            setTimeout(reject, 1000);
        }))
        .then((preparedData) => {
            inputData.preparedData = preparedData;
            ww.run(inputData, onRunFinished);
        }, self.errorCallback);
    }


    function createWW() {
        ww = new WW(computeModule.task);
        ww.setWorkersAmount(userSettings.workersCount);
        ww.import('/js/jsbn.js', 'js/jsbn2.js');
        ww.onProgressChanged = handleProgressChanged;
        previousProgress = 0;

        if (typeof computeModule.drawCanvas === 'function') {
            let newCanvas = makeWorkerCanvas(0);
            newCanvas.setAttribute("class", "canvas");
            selectedCanvas.appendChild(newCanvas);

            const threadsAmount = ww.getFreeWorkers();
            const canvasList = canvases.getElementsByClassName("all")[0];

            for (let i = 1; i < threadsAmount; ++i) {
                newCanvas = makeWorkerCanvas(i);
                newCanvas.setAttribute("class", "thumbnail");
                canvasList.appendChild(newCanvas);
            }

            for (let i = 0; i < threadsAmount; ++i) {
                canvasDelayTimeouts.push(false);
            }
        }
    }


    function makeWorkerCanvas(id) {
        const canvas = document.createElement("canvas");
        canvas.setAttribute("id", "canvas" + id);
        canvas.onclick = selectCanvas;
        return canvas;
    }


    function handleProgressChanged(p, workerIndex, extraData) {
        updateProgress(p);
        if (computeModule.getStatus === undefined) {
            textStatus.style.display = "none";
        }
        updateCanvas(workerIndex, extraData);
    }


    function updateProgress(p) {
        p = Number(p.toFixed(2));
        if (Math.abs(previousProgress - p) >= 0.01) {
            document.getElementsByClassName('progress')[0].style.width = p + "%";
            previousProgress = p;
        }
    }


    function updateCanvas(workerIndex, extraData) {
        if (typeof extraData !== 'undefined'
         && typeof computeModule.drawCanvas === 'function') {
            const current = selectedCanvas.getElementsByTagName("canvas")[0];
            const canvas = document.getElementById("canvas" + workerIndex);
            if (!canvas.isEqualNode(current)) {
                if (!canvasDelayTimeouts[workerIndex]) {
                    canvasDelayTimeouts[workerIndex] = setTimeout(() => {
                        canvasDelayTimeouts[workerIndex] = null;
                    }, canvasDelayMs);
                } else {
                    return;
                }
            }
            computeModule.drawCanvas(canvas, extraData);
            canvases.removeAttribute('style');
        }
    }


    function updateStatusbar(dataObject, dataID) {
        computingStatus.classList.replace('hidden', 'visible');
        textStatus.removeAttribute("style");

        if (computeModule.getStatus !== undefined) {
            const moduleStatus = computeModule.getStatus(dataObject, Comcute.currentLanguage);
            statusTexts[dataID] = moduleStatus.taskStatus;
            let statusText = "";
            let paragraphs = totalThreads;
            
            for (const id in statusTexts) {
                if (typeof statusTexts[id] === 'string') {
                    statusText += "<p>" + statusTexts[id] + "</p>";
                    paragraphs--;
                }
            }
            
            for (let i = 0; i < paragraphs; ++i) {
                statusText += "<p class='awaiting'>" + Comcute.messages.awaitingData + "</p>";
            }

            const moduleDescription = moduleStatus.description || "";
            textStatus.innerHTML = moduleDescription + statusText;
        } else if (willDrawCanvas()) {
            textStatus.innerHTML = Comcute.messages.awaitingData;
        } else {
            textStatus.innerHTML = Comcute.messages.computingStart;
        }
    }


    function willDrawCanvas() {
        return typeof computeModule.drawCanvas === 'function'
            && canvases.attr("style").includes("display: none");
    }


    function selectCanvas() {
        if (this.parentNode.getAttribute("class") == "all") {
            const current = selectedCanvas.getElementsByTagName("canvas")[0];
            const newCanvas = this;
            newCanvas.replaceWith(current);
            selectedCanvas.append(newCanvas);

            current.classList.add("thumbnail");
            newCanvas.classList.remove("thumbnail");
            current.onclick = selectCanvas;
        }
    }
};
