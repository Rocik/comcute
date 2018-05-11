/**
 *  Pobiera dane do zadania, uruchamia obliczenia
 */
var jsModuleWrapper = function() {
    "use strict";
    const parent = this;

    this.sServiceUrl = ""; // adres URL usługi sieciowej znajdującej się na serwerze S, z którym się komunikujemy
    this.sServiceNamespace = ""; // przestrzeń nazw powyższej usługi
    var taskId = ""; // id rozwiązywanego zadania, zserializowane UUID

    var running = true;
    var ww;

    /**
     * Funkcja pobierajaca dane od serwera S.
     * Jej wywołanie rozpoczyna pracę skryptu.
     *
     * @param string taskID
     * @param string sServiceUrl
     * @param string sServiceNamespace
     */
    this.getData = function(newTaskId, computeModule) {
        taskId = newTaskId;

        if (ww === undefined) {
            ww = new WW(computeModule);
            ww.import('/js/jsbn.js', '/js/jsbn2.js');
            ww.onProgressChanged = (p) => {
                $('.progress').css("width", p + "%");
            };
        }

        running = true;
        fetchModule();
    };


    this.stop = function() {
        if (ww !== undefined) {
            running = false;

            ww.dispose();
            ww = undefined;

            $('.progress').css("width", "0%");
        }
    }


    var fetchModule = function() {
        const getDataArguments = [taskId];

        // Pobranie danych obliczeniowych
        jQuery.webservice({
            url: parent.sServiceUrl,
            nameSpace: parent.sServiceNamespace,
            methodName: "GetData",
            dataType: "text",
            data: getDataArguments,
            success: parseResponse, // po przyjściu danych wykonaj obliczenia
            error: function(XMLHttpRequest, textStatus, errorThrown) {
                console.error(XMLHttpRequest + " " + textStatus + " " + errorThrown);
            }
        });
    };


    /**
     * Parsuje odpowiedź z usługi internetowej na żądanie pobrania danych do zadania
     * @param soapData odpowiedź usługi sieciowej
     * @param textStatus statuc usługi sieciowej
     */
    var parseResponse = function(soapData, textStatus) {
        // sprawdzenie, czy pobranie danych przebiegło poprawnie
        if (textStatus === null || textStatus !== 'success') {
            calculationsEnded();
            return;
        }

        // kontener na dane wejściowe do obliczeń
        let responseText = jQuery(soapData).find("return");

        // Firefox, Chrome
        if (navigator.userAgent.toUpperCase().indexOf('MSIE') == -1)
            responseText = responseText[0].innerHTML;
        else// IE8
            responseText = responseText.prevObject[1].innerText;

        if (responseText === null || responseText === "NO_DATA_AVAILABLE") {
            calculationsEnded();
            return;
        }

        if (!running)
            return;

        // Konwersja odpowiedzi serwera S na zmienne
        const responseJSON = jQuery.parseJSON(responseText);
        const dataTaskID = responseJSON[0]; // id zadania, zserializowane UUID
        const dataID     = responseJSON[1]; // id danych, zserializowane UUID
        const dataObject = responseJSON[2];

        if (dataObject !== null) {
            console.info("Testowanie: [" + dataObject.toString() + "]");
            //$('#computing-status').html("Testowanie: [" + dataObject.toString() + "]");

            ww.run(dataObject, function(result) {
                console.log("Wynik obliczeń: " + result);

                const resultArguments = [
                    dataTaskID,
                    dataID,
                    result,
                    navigator.userAgent,
                    "JavaScript" // Informacje o technologii, w której wykonano obliczenia
                ];

                // wysyłanie wyników
                jQuery.webservice({
                    url: parent.sServiceUrl,
                    nameSpace: parent.sServiceNamespace,
                    methodName: "SaveResult",
                    dataType: "text",
                    data: resultArguments,
                    error: function(XMLHttpRequest, textStatus, errorThrown) {
                        console.error(XMLHttpRequest + " " + textStatus + " " + errorThrown);
                    }
                });

                // Ponowne uruchomienie metody getData - zapętlenie obliczen
                if (running)
                    fetchModule();
            });
        }
    };
};
