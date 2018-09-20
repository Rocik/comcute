/**
 *  Pobiera dane do zadania, uruchamia obliczenia
 */
var jsRunner = function() {
    'use strict';
    const self = this;

    this.sServiceUrl = ""; // adres URL usługi sieciowej znajdującej się na serwerze S, z którym się komunikujemy
    this.sServiceNamespace = ""; // przestrzeń nazw powyższej usługi
    let taskId = ""; // id rozwiązywanego zadania, zserializowane UUID

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

    let inputTaskIndex;
    let inputTaskGoal;
    let results;


    this.errorCallback = () => {};


    this.startComputing = function(newTaskId, comcuteModule) {
        computeModule = comcuteModule;
        if (ww === undefined)
            createWW();

        taskId = newTaskId;
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
            for (let i = 0; i < totalThreads; ++i)
                fetchInputData();
        } else
            // fetchInputData();
            runJob("<?xml version='1.0' encoding='UTF-8'?><S:Envelope xmlns:S=\"http://schemas.xmlsoap.org/soap/envelope/\"><S:Body><ns2:GetDataResponse xmlns:ns2=\"http://si.webservice/\"><return>[\"c97bb22f-fcb5-4ee0-be6c-b2bde5951e4c\",\"e74c99c1-7f83-4aee-af5c-c4a753ebf709\",\"http://comcute.eti.pg.gda.pl/maps/map_small.png 3 494 11 667 743 958 942 12 2 580 667 602 615 2 151 984 587 94 2 24 662 504 825 3 451 931 351 879 150 913 2 237 819 34 530 4 375 744 712 812 1004 884 125 400 3 874 827 10 423 465 689 3 191 496 531 980 208 978 4 111 532 954 759 474 709 477 780 4 327 786 192 769 693 848 22 576 4 78 268 579 685 409 789 262 763 2 463 869 400 758\"]</return></ns2:GetDataResponse></S:Body></S:Envelope>", "success");
    }


    function fetchInputData() {
        $.webservice({
            url: self.sServiceUrl,
            nameSpace: self.sServiceNamespace,
            methodName: "GetData",
            dataType: "text",
            data: [taskId],
            success: runJob,
            error: self.errorCallback
        });
    };


    function runJob(soapData, serverTextStatus) {
        // sprawdzenie, czy pobranie danych przebiegło poprawnie
        if (serverTextStatus === null || serverTextStatus !== 'success') {
            self.errorCallback("Getting job's data failed");
            return;
        }

        // kontener na dane wejściowe do obliczeń
        let responseText = $(soapData).find("return");
        responseText = responseText[0].innerHTML;

        if (responseText === null || responseText === "NO_DATA_AVAILABLE") {
            if (responseText === "NO_DATA_AVAILABLE")
                self.errorCallback(responseText);
            else
                self.errorCallback("Got empty job");
            return;
        }

        if (!running)
            return;

        // Konwersja odpowiedzi serwera S na zmienne
        const responseJSON = JSON.parse(responseText);
        const dataTaskID = responseJSON[0]; // id zadania, zserializowane UUID
        const dataID     = responseJSON[1]; // id danych, zserializowane UUID
        const dataObject = responseJSON[2];

        if (dataObject !== null) {
            console.info("Testowanie (" + dataID + "): " + dataObject);

            updateStatusbar(dataObject, dataID);

            const threadsAmount = ww.getFreeWorkers();
            for (let i = 0; i < threadsAmount; ++i)
                canvasDelayTimeouts[i] = false;

            inputTaskIndex = 0;
            if (typeof computeModule.getInputTasksAmount === 'function') {
                inputTaskGoal = computeModule.getInputTasksAmount(dataObject);
                results = [];
            } else
                inputTaskGoal = 0;

            const onRunFinished = function(result) {
                if (inputTaskGoal > 0) {
                    results.push(result);
                    if (inputTaskIndex == inputTaskGoal) {
                        if (ww.getUsedWorkers() > 0) {
                            return;
                        }
                        if (typeof computeModule.getInputTasksAmount === 'function')
                            result = computeModule.setResponse(results);
                        else
                            result = results;
                    } else {
                        startTask(dataObject, onRunFinished);
                        return;
                    }
                }

                console.log("Wynik obliczeń (" + dataID + "): " + result);

                const resultArguments = [
                    dataTaskID,
                    dataID,
                    result,
                    navigator.userAgent,
                    "JavaScript" // Informacje o technologii, w której wykonano obliczenia
                ];

                // wysyłanie wyników
                /*$.webservice({
                    url: self.sServiceUrl,
                    nameSpace: self.sServiceNamespace,
                    methodName: "SaveResult",
                    dataType: "text",
                    data: resultArguments,
                    error: self.errorCallback
                });

                if (inputTaskGoal > 0)
                    fetchInputData();*/

                delete statusTexts[dataID];
            }

            if (inputTaskGoal > 0) {
                for (let i = 0; i < threadsAmount; ++i)
                    startTask(dataObject, onRunFinished);
            } else
                startTask(dataObject, onRunFinished);
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
        ww.import('/js/jsbn.js', 'js/jsbn2.js');
        ww.onProgressChanged = handleProgressChanged;
        previousProgress = 0;

        let newCanvas = document.createElement("canvas");
        newCanvas.setAttribute("id", "canvas" + 0);
        newCanvas.setAttribute("class", "canvas");
        newCanvas.onclick = selectCanvas;
        selectedCanvas.appendChild(newCanvas);

        const threadsAmount = ww.getFreeWorkers();
        const canvasList = canvases.getElementsByClassName("all")[0];

        for (let i = 1; i < threadsAmount; ++i) {
            newCanvas = document.createElement("canvas");
            newCanvas.setAttribute("id", "canvas" + i);
            newCanvas.setAttribute("class", "thumbnail");
            newCanvas.onclick = selectCanvas;
            canvasList.appendChild(newCanvas);
        }

        for (let i = 0; i < threadsAmount; ++i) {
            canvasDelayTimeouts.push(false);
        }
    }


    function handleProgressChanged(p, workerIndex, extraData) {
        updateProgress(p);
        if (computeModule.getStatus === undefined) {
            document.getElementById('text-status').style.display = "none";
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
        document.getElementById('computing-status').classList.replace('hidden', 'visible');
        document.getElementById('text-status').removeAttribute("style");

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
                statusText += "<p>" + Comcute.messages.awaitingData + "</p>";
            }

            const moduleDescription = moduleStatus.description || "";
            document.getElementById('text-status').innerHTML = moduleDescription + statusText;
        } else if (willDrawCanvas()) {
            document.getElementById('text-status').innerHTML = Comcute.messages.awaitingData;
        } else {
            document.getElementById('text-status').innerHTML = Comcute.messages.computingStart;
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
