var jsLoader = function(settings) {
    var LOADER_SERVICE_URL = "http://s1.comcute.eti.pg.gda.pl:50080/S-war/SIService", // Adres usługi systemu comcute do komunikacji z internatuą.
        LOADER_SERVICE_NAMESPACE = "http://si.webservice/", // Namespace usługi systemu comcute do komunikacji z internatuą.
        jsMW,
        opt,
        defaultOptions = {
            infoId: '#comcute',
            urlId: '#url',
            logger: {
                onInfo: function(isStart, taskId) {},
                onNoData: function(status, textStatus, warning) {},
                onNoTask: function(status, textStatus, warning) {},
                onError: function(status, textStatus, error) {}
            }
        },
        jsL = {},
        taskId,
        moduleLocation,
	sResponse;

    opt = jQuery.extend({}, defaultOptions, settings);

    /**
     * Główna funkcja JsLoader'a wywoływana po załadowaniu strony.
     * Pobiera kod obliczeniowy od serwera S i wysyła dane o technologiach dostepnych w przglądarce internauty.
     *
     * @param supportedTech technologia, ktora ma byc uzyta
     */
    jsL.registerAndGetModuleDEBUG = function(supportedTech) {
        LOADER_SERVICE_URL = jQuery(opt.urlId).val();
        // tablica parametrów przeglądarki internauty
        var browserInfo = new Array();
        // pobieramy informacje o dostepności technologii w przeglądarce internauty
        var pluginsInfo = {
            JavaScript: 0,
            JavaApplet: 0,
            Flash: 0,
            Silverlight: 0
        };
        pluginsInfo[supportedTech] = 1;
        var supportedTech = pluginsInfo;
        browserInfo[0] = navigator.userAgent;
        // trzeba ładować wynik do tablicy bo inaczej plugin js do ws'ów
        // rozwali go na pojedyncze elemnty i wysle literka po literce do ws'a
        browserInfo[1] = JSON.stringify(supportedTech);

        // Pobranie kodu obliczeniowego od serwera S
        jQuery.webservice({
            url: LOADER_SERVICE_URL,
            nameSpace: LOADER_SERVICE_NAMESPACE,
            methodName: "GetTask",
            dataType: "text",
            data: browserInfo,
            success: installModule, // obsługa odpowiedzi - instalacja modułu
            error: function(XMLHttpRequest, textStatus, errorThrown) {
                opt.logger.onError(Comcute.logErrorTypes.errorGetModule, XMLHttpRequest.status, textStatus, LOADER_SERVICE_URL + ' ' + errorThrown.toString());
            }
        });
    };

    /**
     * Główna funkcja JsLoader'a wywoływana po załadowaniu strony.<br/>
     * Pobiera kod obliczeniowy od serwera S i wysyła dane o technologiach dostepnych w przglądarce internauty.
     */
    var registerAndGetModule = function() {
        // tablica parametrów przeglądarki internauty
        var browserInfo = new Array();
        // pobieramy informacje o dostepności technologii w przeglądarce internauty
        var supportedTech = getSupportedTech();

        browserInfo[0] = navigator.userAgent;
        // trzeba ładować wynik do tablicy bo inaczej plugin js do ws'ów
        // rozwali go na pojedyncze elemnty i wysle literka po literce do ws'a
        browserInfo[1] = JSON.stringify(supportedTech);

        // Pobranie kodu obliczeniowego od serwera S
        jQuery.webservice({
            url: LOADER_SERVICE_URL,
            nameSpace: LOADER_SERVICE_NAMESPACE,
            methodName: "GetTask",
            dataType: "text",
            data: browserInfo,
            success: installModule, // obsługa odpowiedzi - instalacja modułu
            error: function(XMLHttpRequest, textStatus, errorThrown) {
                opt.logger.onError(Comcute.logErrorTypes.errorGetModule, XMLHttpRequest.status, textStatus, errorThrown.toString());
            }
        });
    };
    jsL.registerAndGetModule = registerAndGetModule;
    jsMW = jsModuleWrapper(registerAndGetModule, opt.logger);


    var unregister = function () {
        jsMW.stop = true;
    }
    jsL.unregister = unregister;

    /**
     * Instaluje otrzymany od węzła S moduł obliczeniowy.
     * @param soapData odpowiedź usługi sieciowej
     * @param textStatus statuc usługi sieciowej
     */
    function installModule(soapData, textStatus) {
        if (null === textStatus || "success" !== textStatus) {
            opt.logger.onError(Comcute.logErrorTypes.errorBadNodeSAnswer,'200', textStatus, '');
            return;
        }

        // wyciągnięcie odpowiedzi
        var responseText = jQuery(soapData).find("return"),
            embedHtml,
            head;

        responseText = (navigator.userAgent.toUpperCase().indexOf('MSIE') == -1) ? responseText[0].innerHTML : responseText.prevObject[1].innerText;

        if (null === responseText || "ERROR" === responseText) {
            opt.logger.onError(Comcute.logErrorTypes.errorBadNodeSAnswer, '200', textStatus, responseText);
            return;
        }

        // zdekodowanie ze stringa do htmla i utworzenie tablicy obiektów html ze stringa tagów
        embedHtml = (navigator.userAgent.toUpperCase().indexOf('MSIE') == -1) ? jQuery(htmlDecode(responseText)) : jQuery(responseText);
        if (0 === embedHtml.length) {
            opt.logger.onNoTask(Comcute.logErrorTypes.warNoTask, '200', textStatus, responseText);
            return;
        }

        //dodanie skryptu osadzającego do seksji head
        head = document.getElementsByTagName("head")[0];
        head.appendChild(embedHtml[0]);
	sResponse = embedHtml[0].childNodes[0].textContent;
	eval(sResponse);

        // pobranie i umieszczenie na stronie skryptu kodu osadzającego
        jQuery('#container').append(jQuery("#embedScript"));

        // utworzenie i załadowanie skryptu obliczeniowego
        if ("JavaScript" === MODULE_TYPE) {
            if (TASK_ID === taskId && MODULE_LOCATION === moduleLocation) {
                runComcute();
            } else {
                jQuery.ajax({
                    url: MODULE_LOCATION,
                    dataType: 'script',
                    success: function(data) {
                        taskId = TASK_ID;
                        moduleLocation = MODULE_LOCATION;
                        runComcute();
                    },
                    error: function(XMLHttpRequest, textStatus, errorThrown) {
                        opt.logger.onError(Comcute.logErrorTypes.errorGetScript, XMLHttpRequest.status, textStatus, errorThrown.toString());
                    }
                });
            }
        }
    }

    /**
     * Wrapper uruchamiający zainstalowany moduł obliczeniowy.
     */
    function runComcute() {
	    eval(sResponse);
        jsMW.getData(TASK_ID, S_SERVICE_URL, S_SERVICE_NAMESPACE);
    }

    /**
     * pobiera informacje o technologiach dostępnych w przglądarce użytkownika.
     */
    function getSupportedTech() {
        // lista technologii dostepnych u klienta
        var pluginsInfo = {
            JavaScript: 1,
            JavaApplet: 0,
            Flash: 0,
            Silverlight: 0
        };

        // firefox, chrome
        if (navigator.userAgent.toUpperCase().indexOf('MSIE') == -1) {
            var L = navigator.plugins.length;

            for (var i = 0; i < L; i++) {
                var pluginName = navigator.plugins[i].name;

                if (pluginName === "Shockwave Flash") {
                    pluginsInfo["Flash"] = 1;
                }
                else if (pluginName === "Silverlight Plug-In") {
                    pluginsInfo["Silverlight"] = 1;
                }
            }
        } else { // IE8
            if (window.ActiveXObject) {
                var control = null;
                try {
                    control = new ActiveXObject('ShockwaveFlash.ShockwaveFlash');
                    pluginsInfo["Flash"] = 1;
                } catch (e) {
                }
                try {
                    control = new ActiveXObject('AgControl.AgControl');
                    // określona wersja SL == 4.0 lub 3.0
                    if (control.IsVersionSupported("4.0") || control.IsVersionSupported("3.0")) {
                        pluginsInfo["Silverlight"] = 1;
                    }
                } catch (e) {
                }
            }
        }

        return pluginsInfo;
    }

   // dekoduje string do tagów html
    function htmlDecode(value) {
        return jQuery('<p/>').html(value).text();
    }

    return jsL;
};
