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
    var getStatus;
    var statusTexts = {};
    var ww;
    var previousProgress;
    var totalThreads;


    this.errorCallback = () => {};


    this.startComputing = function(newTaskId, computeModule, computeGetStatus) {
        if (ww === undefined)
            createWW(computeModule, computeGetStatus);

        taskId = newTaskId;
        running = true;
        statusTexts = {};

        totalThreads = ww.getFreeWorkers();
        for (let i = 0; i < totalThreads; ++i)
            fetchInputData();
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
            calculationsEnded();
            return;
        }

        // kontener na dane wejściowe do obliczeń
        let responseText = $(soapData).find("return");
        responseText = responseText[0].innerHTML;

        if (responseText === null || responseText === "NO_DATA_AVAILABLE") {
            calculationsEnded();
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
            console.info("Testowanie: [" + dataObject.toString() + "] " + dataID);

            updateStatusbar(dataObject, dataID);

            ww.run(dataObject, function(result) {
                console.log("Wynik obliczeń (" + dataID + "): " + result);

                const resultArguments = [
                    dataTaskID,
                    dataID,
                    result,
                    navigator.userAgent,
                    "JavaScript" // Informacje o technologii, w której wykonano obliczenia
                ];

                // wysyłanie wyników
                $.webservice({
                    url: parent.sServiceUrl,
                    nameSpace: parent.sServiceNamespace,
                    methodName: "SaveResult",
                    dataType: "text",
                    data: resultArguments,
                    error: parent.errorCallback
                });

                if (running)
                    fetchInputData();

                delete statusTexts[dataID];
            });
        }
    };


    function createWW(computeModule, computeGetStatus) {
        ww = new WW(computeModule);
        ww.import('/js/jsbn.js', 'js/jsbn2.js');
        ww.onProgressChanged = (p) => {
            p = Math.round(p);
            if (Math.abs(previousProgress - p) >= 1) {
                $('.progress').css("width", p + "%");
                previousProgress = p;
            }
        };
        previousProgress = 0;

        if (isFunction(computeGetStatus))
            getStatus = computeGetStatus;
        else
            getStatus = undefined;

        $('#text-status').html("");
    }


    function updateStatusbar(dataObject, dataID) {
        $('#computing-status').addClass('visible').removeClass('hidden');
        if (getStatus !== undefined) {
            const moduleStatus = getStatus(dataObject, Comcute.currentLanguage);
            statusTexts[dataID] = moduleStatus.description;
            let statusText = "";
            let paragraphs = totalThreads;
            for (const id in statusTexts) {
                statusText += "<p>" + statusTexts[id] + "</p>";
                paragraphs--;
            }
            for (let i = 0; i < paragraphs; ++i)
                statusText += "<p>" + Comcute.messages.awaitingData + "</p>";
            $('#text-status').html(moduleStatus.prelude + statusText);
        } else
            $('#text-status').html(Comcute.messages.computingStart);
    }


    function isFunction(functionToCheck) {
        return functionToCheck &&
            {}.toString.call(functionToCheck) === '[object Function]';
    }
};
