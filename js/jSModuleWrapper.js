var COMPUTATION_TIME = 100, // czas trwania etapu obliczeń w milisekundach
    COMPUTATION_INTERVAL = 100, // czas przerwy pomiędzy etapami obliczeń w milisekundach
    result = "", // wynik obliczeń dla paczki danych
    packageProcessed = false; // flaga wskazująca, czy obliczenia dla danej paczki danych zostały zakończone

/**
 *  Pobiera dane do zadania, uruchamia obliczenia
 *  @param timeOutFunction funkcja wykonywana, gdy nie powiedzie się pobranie danych
 *  @param logger obiekt logujacy zdarzenia
 */
var jsModuleWrapper = function(timeOutFunction, logger) {
    var taskIdGlobal = "", // id rozwiązywanego zadania, zserializowane UUID
        sServiceUrlGlobal = "", // adres URL usługi sieciowej znajdującej się na serwerze S, z którym się komunikujemy
        sServiceNamespaceGlobal = "", // przestrzeń nazw powyższej usługi
        toFunction = timeOutFunction,
        logger = logger,
        jsMW = {},

        /**
         * Funkcja pobierajaca dane od serwera S.
         * Jej wywołanie rozpoczyna pracę skryptu.
         *
         * @param string taskID
         * @param string sServiceUrl
         * @param string sServiceNamespace
         */
        getData = function(taskID, sServiceUrl, sServiceNamespace) {
            var getDataArguments = new Array();
            getDataArguments[0] = taskID;
            // eksport zmiennych do zasięgu globlanego
            taskIdGlobal = taskID;
            sServiceUrlGlobal = sServiceUrl;
            sServiceNamespaceGlobal = sServiceNamespace;

            // Wywołanie webserwisu
            // Pobranie danych obliczeniowych
            jQuery.webservice({
                url: sServiceUrl,
                nameSpace: sServiceNamespace,
                methodName: "GetData",
                dataType: "text",
                data: getDataArguments,
                success: parseResponse, // po przyjściu danych wykonaj obliczenia
                error: function(XMLHttpRequest, textStatus, errorThrown) {
                    console.log(XMLHttpRequest);
                    logger.onError(Comcute.logErrorTypes.errorGetData, XMLHttpRequest.status, textStatus, errorThrown.toString());
                }
            });
        },

        /**
         * Parsuje odpowiedź z usługi internetowej na żądanie pobrania danych do zadania
         * @param soapData odpowiedź usługi sieciowej
         * @param textStatus statuc usługi sieciowej
         */
        parseResponse = function(soapData, textStatus) {
            var responseText,
                responseJSON,
                dataTaskID,
                dataID,
                dataObject,
                resultArguments;

            // sprawdzenie, czy pobranie danych przebiegło poprawnie
            if (null === textStatus || 'success' !== textStatus) {
                logger.onError(Comcute.logErrorTypes.errorBadData, '200', textStatus, '');
                calculationsEnded();
                return;
            }

            // kontener na dane wejściowe do obliczeń
            responseText = jQuery(soapData).find("return");

            //firefox, chrome
            if (navigator.userAgent.toUpperCase().indexOf('MSIE') == -1) {
                responseText = responseText[0].innerHTML;
            } else { // IE8
                responseText = responseText.prevObject[1].innerText;
            }

            if (null === responseText || "NO_DATA_AVAILABLE" === responseText) {
                logger.onNoData(Comcute.logErrorTypes.warNoData,'200', textStatus, responseText);
                calculationsEnded();
                return;
            }

            //Konwersja odpowiedzi serwera S na zmienne
            responseJSON = jQuery.parseJSON(responseText);
            dataTaskID = responseJSON[0]; // id zadania, , zserializowane UUID
            dataID = responseJSON[1]; // id danych, zserializowane UUID
            dataObject = responseJSON[2]; // dane

            if (null !== dataObject) {
                packageProcessed = false;
                logger.onInfo(true, dataTaskID);

                //funkcja compute() musi być zdefiniowana w pobranym module obliczeniowym
                //compute(dataObject);
                compute2(dataObject);

                setInterval(function() {
                    if (packageProcessed) {
                        packageProcessed = false;
                        //przygotowanie odpowiedzi
                        resultArguments = new Array();
                        resultArguments[0] = dataTaskID; //id zadania, zserializowane UUID
                        resultArguments[1] = dataID; //id danych, zserializowane UUID
                        resultArguments[2] = result; // dane wynikowe
                        resultArguments[3] = navigator.userAgent; // user agent
                        resultArguments[4] = "JavaScript"; // Informacje o technologii, w której wykonano obliczenia

                        //wysyłanie wyników
                        jQuery.webservice({
                            url: sServiceUrlGlobal,
                            nameSpace: sServiceNamespaceGlobal,
                            methodName: "SaveResult",
                            dataType: "text",
                            data: resultArguments,
                            success: function() {
                                logger.onInfo(false, dataTaskID);
                            },
                            error: function(XMLHttpRequest, textStatus, errorThrown) {
                                logger.onError(Comcute.logErrorTypes.errorSentResult, XMLHttpRequest.status, textStatus, errorThrown.toString());
                            }
                        });

                        //Ponowne uruchomienie metody getData - zapętlenie obliczen
                        if (!jsMW.stop)
                            getData(taskIdGlobal, sServiceUrlGlobal, sServiceNamespaceGlobal);
                        else {
                            jsMW.stop = false;
                        }
                    }
                }, COMPUTATION_INTERVAL * 2);
            }
        },
        calculationsEnded = function() {
            setTimeout(function() {
                toFunction();
            }, 7500);
        };

    jsMW.getData = getData;
    jsMW.stop = false;

    return jsMW;
};
