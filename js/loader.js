const Loader = function(userSettings) {
    "use strict";

    const LOADER_SERVICE_URL = "https://s-server.comcute.eti.pg.gda.pl/S-war/SIService";
    const LOADER_SERVICE_NAMESPACE = "http://si.webservice/";
    const SupportedTech = {
        JavaScript: 0,
        JavaApplet: 1,
        Flash: 0,
        Silverlight: 0
    };
    const HeadNode = document.getElementsByTagName("head")[0];
    const runner = new Runner(userSettings);
    let registered;
    let errorCallback;
    let taskId;
    let moduleLocation;
    let computeModule;


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
    // Set default
    this.setFailureEvent();


    this.register = function(module) {
        registered = true;

        const browserInfo = [
            navigator.userAgent,
            // trzeba ładować wynik do tablicy bo inaczej plugin js do ws'ów
            // rozwali go na pojedyncze elementy i wyśle literka po literce do ws'a
            JSON.stringify(SupportedTech)
        ];

        // TODO: REMOVE! JUST FOR TESTING WITHOUT SERVER
                setTimeout(() => {
                    computeModule = module;
                    runComcute();
                }, 1000);
                return;

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


    function installModule(soapData, textStatus) {
        if (!registered) {
            return;
        }

        if (textStatus === null || textStatus !== "OK") {
            return errorCallback("Server failed to get task");
        }

        const responseText = extractSoap(soapData);

        if (responseText === null || responseText === "ERROR") {
            return errorCallback("Error while getting task");
        }

        if (responseText === "NO_TASKS_AVAILABLE") {
            return errorCallback("NO_DATA_AVAILABLE");
        }

        const embedHtml = htmlDecode(responseText);
        if (embedHtml == null) {
            return;
        }

        HeadNode.appendChild(embedHtml);
        const sResponse = embedHtml.childNodes[0].textContent;
        eval(sResponse);

        if (taskId === TASK_ID && moduleLocation === MODULE_LOCATION) {
            runComcute();
        } else {
            runner.sServiceUrl = S_SERVICE_URL;
            runner.sServiceNamespace = S_SERVICE_NAMESPACE;
            fetchComcuteModule(MODULE_LOCATION, TASK_ID);
        }
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

    
    function htmlDecode(value) {
        const div = document.createElement("div");
        div.innerHTML = value;
        const htmlTags = div.innerText || div.textContent;

        const innerDiv = document.createElement("div");
        innerDiv.innerHTML = htmlTags;
        return innerDiv.firstChild;
    }
};
