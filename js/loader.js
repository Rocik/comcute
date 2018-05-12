var Loader = function() {
    // Adres usługi systemu comcute do komunikacji z internautą.
    const LOADER_SERVICE_URL = "https://s-server.comcute.eti.pg.gda.pl/S-war/SIService";
    // Namespace usługi systemu comcute do komunikacji z internautą.
    const LOADER_SERVICE_NAMESPACE = "http://si.webservice/";
    const opt = {
        infoId: '#comcute',
        urlId: '#url'
    };
    const jsMW = new jsModuleWrapper();
    const supportedTech = {
        JavaScript: 1,
        JavaApplet: 0,
        Flash: 0,
        Silverlight: 0
    };
    let taskId;
    let moduleLocation;
    let sServiceUrl;
    let sServiceNamespace;
    let computeModule;
    let computeStatusFunction;

    // Główna funkcja JsLoader'a wywoływana po załadowaniu strony.
    // Pobiera kod obliczeniowy od serwera S i wysyła dane
    //  o technologiach dostepnych w przglądarce internauty.
    this.registerAndGetModule = function() {
        // tablica parametrów przeglądarki internauty
        const browserInfo = [
            navigator.userAgent,
            // trzeba ładować wynik do tablicy bo inaczej plugin js do ws'ów
            // rozwali go na pojedyncze elemnty i wysle literka po literce do ws'a
            JSON.stringify(supportedTech)
        ];

        // Pobranie kodu obliczeniowego od serwera S
        jQuery.webservice({
            url: LOADER_SERVICE_URL,
            nameSpace: LOADER_SERVICE_NAMESPACE,
            methodName: "GetTask",
            dataType: "text",
            data: browserInfo,
            success: installModule,
            error: function(XMLHttpRequest, textStatus, errorThrown) {
                console.error(XMLHttpRequest + " " + textStatus + " " + errorThrown);
            }
        });
    };


    this.unregister = function () {
        jsMW.stop();
    }

    /**
     * Instaluje otrzymany od węzła S moduł obliczeniowy.
     * @param soapData odpowiedź usługi sieciowej
     * @param textStatus statuc usługi sieciowej
     */
    function installModule(soapData, textStatus) {
        if (textStatus === null || textStatus !== "success")
            return;

        // wyciągnięcie odpowiedzi
        const rawResponseText = jQuery(soapData).find("return");
        const responseText = (navigator.userAgent.toUpperCase().indexOf('MSIE') == -1)
            ? rawResponseText[0].innerHTML
            : rawResponseText.prevObject[1].innerText;

        if (responseText === null || responseText === "ERROR")
            return;

        // zdekodowanie ze stringa do htmla i utworzenie tablicy obiektów html ze stringa tagów
        const embedHtml = (navigator.userAgent.toUpperCase().indexOf('MSIE') == -1)
            ? jQuery(htmlDecode(responseText))
            : jQuery(responseText);

        if (embedHtml.length === 0)
            return;

        // dodanie skryptu osadzającego do seksji head
        const head = document.getElementsByTagName("head")[0];
        head.appendChild(embedHtml[0]);
        const sResponse = embedHtml[0].childNodes[0].textContent;
        eval(sResponse);

        // pobranie i umieszczenie na stronie skryptu kodu osadzającego
        jQuery('#container').append(jQuery("#embedScript"));

        // utworzenie i załadowanie skryptu obliczeniowego
        if (MODULE_TYPE === "JavaScript") {
            if (taskId === TASK_ID && moduleLocation === MODULE_LOCATION)
                runComcute();
            else {
                jsMW.sServiceUrl = S_SERVICE_URL;
                jsMW.sServiceNamespace = S_SERVICE_NAMESPACE;
                fetchComcute(MODULE_LOCATION, TASK_ID);
            }
        }
    }


    function fetchComcute(newLocation, newTaskId) {
        jQuery.ajax({
            url: newLocation,
            dataType: 'script',
            success: function(data) {
                taskId = newTaskId;
                moduleLocation = newLocation;
                computeModule = collatzIntervals;
                computeStatusFunction = comcuteGetStatus;
                runComcute();
            },
            error: function(XMLHttpRequest, textStatus, errorThrown) {
                console.error(XMLHttpRequest + " " + textStatus + " " + errorThrown);
            }
        });
    }


    function runComcute() {
        jsMW.getData(taskId, computeModule, computeStatusFunction);
    }


    // dekoduje string do tagów html
    function htmlDecode(value) {
        return jQuery('<p/>').html(value).text();
    }
};
