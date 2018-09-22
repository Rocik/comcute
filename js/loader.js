var Loader = function() {
    //"use strict"; // TODO: enable

    // Adres usługi systemu comcute do komunikacji z internautą.
    const LOADER_SERVICE_URL = "https://s-server.comcute.eti.pg.gda.pl/S-war/SIService";
    // Namespace usługi systemu comcute do komunikacji z internautą.
    const LOADER_SERVICE_NAMESPACE = "http://si.webservice/";
    const runner = new Runner();
    const supportedTech = {
        JavaScript: 0,
        JavaApplet: 1,
        Flash: 0,
        Silverlight: 0
    };
    let registered;
    let errorCallback;
    let taskId;
    let moduleLocation;
    let computeModule;


    // Constructor
    {
        this.setFailureEvent();
    }


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


    this.registerAndGetModule = function() {
        registered = true;

        const browserInfo = [
            navigator.userAgent,
            // trzeba ładować wynik do tablicy bo inaczej plugin js do ws'ów
            // rozwali go na pojedyncze elementy i wysle literka po literce do ws'a
            JSON.stringify(supportedTech)
        ];

        // TODO: REMOVE! JUST FOR TESTING WITHOUT SERVER
                setTimeout(() => {
                    computeModule = comcuteModule;
                    runComcute();
                }, 1000);
                return;

        // Pobranie kodu obliczeniowego od serwera S
        webservice({
            url: LOADER_SERVICE_URL,
            nameSpace: LOADER_SERVICE_NAMESPACE,
            methodName: "GetTask",
            data: browserInfo,
            success: installModule,
            error: errorCallback
        });
    };


    this.unregister = function () {
        runner.stop();
        registered = false;
    };

    /**
     * Instaluje otrzymany od węzła S moduł obliczeniowy.
     * @param soapData odpowiedź usługi sieciowej
     * @param textStatus statuc usługi sieciowej
     */
    function installModule(soapData, textStatus) {
        if (!registered) {
            return;
        }

        if (textStatus === null || textStatus !== "success") {
            return errorCallback("Server failed to get task");
        }

        // wyciągnięcie odpowiedzi
        const rawResponseText = $(soapData).find("return");
        const responseText = rawResponseText[0].innerHTML;

        if (responseText === null || responseText === "ERROR") {
            return errorCallback("Error while getting task");
        }

        if (responseText === "NO_TASKS_AVAILABLE") {
            return errorCallback("NO_DATA_AVAILABLE");
        }

        // zdekodowanie ze stringa do htmla i utworzenie tablicy obiektów html ze stringa tagów
        const embedHtml = $(htmlDecode(responseText));
        if (embedHtml.length === 0) {
            return;
        }

        // dodanie skryptu osadzającego do seksji head
        const head = document.getElementsByTagName("head")[0];
        head.appendChild(embedHtml[0]);
        const sResponse = embedHtml[0].childNodes[0].textContent;
        eval(sResponse);

        // utworzenie i załadowanie skryptu obliczeniowego
        //if (MODULE_TYPE === "JavaScript") {
            if (taskId === TASK_ID && moduleLocation === MODULE_LOCATION) {
                runComcute();
            } else {
                runner.sServiceUrl = S_SERVICE_URL;
                runner.sServiceNamespace = S_SERVICE_NAMESPACE;
                fetchComcuteModule(MODULE_LOCATION, TASK_ID);
            }
        //}
    }


    function fetchComcuteModule(newLocation, newTaskId) {
        const request = new XMLHttpRequest();
        request.open('GET', newLocation, true);
        request.onload = function () {
            if (this.status >= 200 && this.status < 400) {
                //var response = this.response;
                // eval( ~script~ )

                taskId = newTaskId;
                moduleLocation = newLocation;
                computeModule = comcuteModule;

                runComcute();
            } else {
                errorCallback(this.statusText);
            }
        };
        request.onerror = errorCallback;
        request.send();
    }


    function runComcute() {
        if (registered) {
            runner.errorCallback = errorCallback;
            runner.startComputing(taskId, computeModule);
        }
    }


    // Dekoduje string do tagów html
    function htmlDecode(value) {
        const p = document.createElement(p);
        p.innerHTML = value;
        return p.innerText || p.textContent;
    }
};
