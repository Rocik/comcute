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
        JavaScript: 0,
        JavaApplet: 1,
        Flash: 0,
        Silverlight: 0
    };
    let errorCallback;
    let taskId;
    let moduleLocation;
    let sServiceUrl;
    let sServiceNamespace;
    let computeModule;
    let computeStatusFunction;


    this.setFailureEvent = function(callback) {
        errorCallback = function() {
            console.error(Array.prototype.slice.call(arguments).join(" "));

            if (arguments.length > 0 && arguments[0] == "NO_DATA_AVAILABLE")
                alert(Comcute.messages.noTask);
            else
                alert(Comcute.messages.error);

            if (typeof callback === 'function')
                callback();
        };
    };
    this.setFailureEvent();


    this.registerAndGetModule = function() {
        const browserInfo = [
            navigator.userAgent,
            // trzeba ładować wynik do tablicy bo inaczej plugin js do ws'ów
            // rozwali go na pojedyncze elemnty i wysle literka po literce do ws'a
            JSON.stringify(supportedTech)
        ];

        // Pobranie kodu obliczeniowego od serwera S
        $.webservice({
            url: LOADER_SERVICE_URL,
            nameSpace: LOADER_SERVICE_NAMESPACE,
            methodName: "GetTask",
            dataType: "text",
            data: browserInfo,
            success: installModule,
            error: errorCallback
        });
    };


    this.unregister = function () {
        jsMW.stop();
    };

    /**
     * Instaluje otrzymany od węzła S moduł obliczeniowy.
     * @param soapData odpowiedź usługi sieciowej
     * @param textStatus statuc usługi sieciowej
     */
    function installModule(soapData, textStatus) {
        if (textStatus === null || textStatus !== "success")
            return;

        // wyciągnięcie odpowiedzi
        const rawResponseText = $(soapData).find("return");
        const responseText = rawResponseText[0].innerHTML;

        if (responseText === null || responseText === "ERROR")
            return;

        // zdekodowanie ze stringa do htmla i utworzenie tablicy obiektów html ze stringa tagów
        const embedHtml = $(htmlDecode(responseText));
        if (embedHtml.length === 0)
            return;

        // dodanie skryptu osadzającego do seksji head
        const head = document.getElementsByTagName("head")[0];
        head.appendChild(embedHtml[0]);
        const sResponse = embedHtml[0].childNodes[0].textContent;
        eval(sResponse);

        // utworzenie i załadowanie skryptu obliczeniowego
        //if (MODULE_TYPE === "JavaScript") {
            if (taskId === TASK_ID && moduleLocation === MODULE_LOCATION)
                runComcute();
            else {
                jsMW.sServiceUrl = S_SERVICE_URL;
                jsMW.sServiceNamespace = S_SERVICE_NAMESPACE;
                fetchComcuteModule(MODULE_LOCATION, TASK_ID);
            }
        //}
    }


    function fetchComcuteModule(newLocation, newTaskId) {
        $.ajax({
            url: newLocation,
            dataType: 'script',
            success: function(data) {
                taskId = newTaskId;
                moduleLocation = newLocation;
                //computeModule = comcuteModule;
                computeModule = comcuteModuleFire;

                runComcute();
            },
            error: errorCallback
        });
    }


    function runComcute() {
        jsMW.errorCallback = errorCallback;
        jsMW.startComputing(taskId, computeModule);
    }


    // dekoduje string do tagów html
    function htmlDecode(value) {
        return $('<p/>').html(value).text();
    }
};
