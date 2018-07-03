/**
 *  Pobiera dane do zadania, uruchamia obliczenia
 */
var jsModuleWrapper = function() {
    'use strict';
    const parent = this;

    this.sServiceUrl = ""; // adres URL usługi sieciowej znajdującej się na serwerze S, z którym się komunikujemy
    this.sServiceNamespace = ""; // przestrzeń nazw powyższej usługi
    var taskId = ""; // id rozwiązywanego zadania, zserializowane UUID

    var running = true;
    var computeModule;
    var statusTexts = {};
    var ww;
    var previousProgress;
    var totalThreads;
    var canvas;


    this.errorCallback = () => {};


    this.startComputing = function(newTaskId, comcuteModule) {
        computeModule = comcuteModule;
        if (ww === undefined)
            createWW();

        taskId = newTaskId;
        running = true;
        statusTexts = {};

        if (computeModule.parallelTaskJobs === true) {
            totalThreads = ww.getFreeWorkers();
            for (let i = 0; i < totalThreads; ++i)
                fetchInputData();
        } else
            // fetchInputData();
            runJob("<?xml version='1.0' encoding='UTF-8'?><S:Envelope xmlns:S=\"http://schemas.xmlsoap.org/soap/envelope/\"><S:Body><ns2:GetDataResponse xmlns:ns2=\"http://si.webservice/\"><return>[\"c97bb22f-fcb5-4ee0-be6c-b2bde5951e4c\",\"e74c99c1-7f83-4aee-af5c-c4a753ebf709\",\"http://comcute.eti.pg.gda.pl/maps/map_small.png 3 494 11 667 743 958 942 12 2 580 667 602 615 2 151 984 587 94 2 24 662 504 825 3 451 931 351 879 150 913 2 237 819 34 530 4 375 744 712 812 1004 884 125 400 3 874 827 10 423 465 689 3 191 496 531 980 208 978 4 111 532 954 759 474 709 477 780 4 327 786 192 769 693 848 22 576 4 78 268 579 685 409 789 262 763 2 463 869 400 758\"]</return></ns2:GetDataResponse></S:Body></S:Envelope>", "success");
    };


    this.stop = function() {
        if (ww !== undefined) {
            running = false;

            ww.dispose();
            ww = undefined;
        }
    };


    var fetchInputData = function() {
        $.webservice({
            url: parent.sServiceUrl,
            nameSpace: parent.sServiceNamespace,
            methodName: "GetData",
            dataType: "text",
            data: [taskId],
            success: runJob,
            error: parent.errorCallback
        });
    };


    var runJob = function(soapData, serverTextStatus) {
        // sprawdzenie, czy pobranie danych przebiegło poprawnie
        if (serverTextStatus === null || serverTextStatus !== 'success') {
            parent.errorCallback("Getting job's data failed");
            return;
        }

        // kontener na dane wejściowe do obliczeń
        let responseText = $(soapData).find("return");
        responseText = responseText[0].innerHTML;

        if (responseText === null || responseText === "NO_DATA_AVAILABLE") {
            if (responseText === "NO_DATA_AVAILABLE")
                parent.errorCallback(responseText);
            else
                parent.errorCallback("Got empty job");
            return;
        }

        if (!running)
            return;

        // Konwersja odpowiedzi serwera S na zmienne
        const responseJSON = $.parseJSON(responseText);
        const dataTaskID = responseJSON[0]; // id zadania, zserializowane UUID
        const dataID     = responseJSON[1]; // id danych, zserializowane UUID
        const dataObject = responseJSON[2];

        if (dataObject !== null) {
            console.info("Testowanie (" + dataID + "): " + dataObject);

            updateStatusbar(dataObject, dataID);

            const onRunFinished = function(result) {
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
                    url: parent.sServiceUrl,
                    nameSpace: parent.sServiceNamespace,
                    methodName: "SaveResult",
                    dataType: "text",
                    data: resultArguments,
                    error: parent.errorCallback
                });

                if (running)
                    fetchInputData();*/

                delete statusTexts[dataID];
            }

            if (typeof computeModule.prepare === 'function')
                runPrepared(dataObject, onRunFinished);
            else
                ww.run(dataObject, onRunFinished);
        }
    };


    function runPrepared(dataObject, onRunFinished) {
        (new Promise((resolve, reject) => {
            computeModule.prepare(dataObject, resolve);
            setTimeout(reject, 1000);
        }))
        .then((preparedData) => {
            ww.run({
                data: dataObject,
                preparedData: preparedData
            }, onRunFinished);
        }, parent.errorCallback);
    }


    function createWW() {
        ww = new WW(computeModule.task);
        ww.import('/js/jsbn.js', 'js/jsbn2.js');
        ww.onProgressChanged = (p, extraData) => {
            p = Number(p.toFixed(2));
            if (Math.abs(previousProgress - p) >= 0.01) {
                $('.progress').css("width", p + "%");
                previousProgress = p;
            }

            if (computeModule.getStatus === undefined)
                $('#text-status').css("display", "none");

            if (typeof extraData !== 'undefined'
             && typeof computeModule.drawCanvas === 'function') {
                computeModule.drawCanvas(parent.canvas[0], extraData);
                parent.canvas.removeAttr('style');
            }
        };
        previousProgress = 0;

        parent.canvas = $('#sim-canvas');
    }


    function updateStatusbar(dataObject, dataID) {
        $('#computing-status').addClass('visible').removeClass('hidden');
        $('#text-status').removeAttr("style");

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

            for (let i = 0; i < paragraphs; ++i)
                statusText += "<p>" + Comcute.messages.awaitingData + "</p>";

            const moduleDescription = moduleStatus.description || "";
            $('#text-status').html(moduleDescription + statusText);
        } else if (willDrawCanvas())
            $('#text-status').html(Comcute.messages.awaitingData);
        else
            $('#text-status').html(Comcute.messages.computingStart);
    }


    function willDrawCanvas() {
        return typeof computeModule.drawCanvas === 'function'
         && parent.canvas.attr("style").includes("display: none");
    }
};
