/*
The MIT License

Copyright (c) 2009-06-11 Jimmy Hattori

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
THE SOFTWARE.
 */

(function($) {
jQuery.webservice = function (options) {
    try {
        var settings = { requestType: "soap1.1",
            error: function (XMLHttpRequest, textStatus, errorThrown) {
                throw XMLHttpRequest.responseText;
            }
        };
        $.extend(settings, options);

        var oBuffer = new Array();

        if (settings.requestType == "soap1.1" || settings.requestType == "soap1.2")
            settings.nameSpace += (settings.nameSpace.length - 1 == settings.nameSpace.lastIndexOf("/")) ? "" : "/";

        switch (settings.requestType) {
            case "soap1.2":
                settings.methodType = "POST";
                settings.contentType = "application/soap+xml";

                oBuffer.push("<soap12:Envelope ");
                oBuffer.push("xmlns:xsi=\"http://www.w3.org/2001/XMLSchema-instance\" ");
                oBuffer.push("xmlns:xsd=\"http://www.w3.org/2001/XMLSchema\" ");
                oBuffer.push("xmlns:soap12=\"http://www.w3.org/2003/05/soap-envelope\">");
                oBuffer.push("<soap12:Body>");
                oBuffer.push("<" + settings.methodName + " xmlns=\"" + settings.nameSpace + "\">");
                for (key in settings.data) {
                    if (key != "length" && typeof (settings.data[key].prototype) == "undefined")
                        oBuffer.push("<" + key + ">" + settings.data[key] + "</" + key + ">");
                }
                oBuffer.push("</" + settings.methodName + ">");
                oBuffer.push("</soap12:Body>");
                oBuffer.push("</soap12:Envelope>");

                settings.requestData = oBuffer.join("");
                break;
            case "httpget":
                settings.methodType = "GET";
                settings.contentType = "text/xml";

                for (key in settings.data) {
                    if (key != "length" && typeof (settings.data[key].prototype) == "undefined")
                        oBuffer.push(key + "=" + settings.data[key]);
                }

                settings.url += ("/" + settings.methodName + "?" + oBuffer.join("&"));
                settings.requestData = "";
                break;
            case "httppost":
                settings.methodType = "POST";
                settings.contentType = "application/x-www-form-urlencoded";

                for (key in settings.data) {
                    if (key != "length" && typeof (settings.data[key].prototype) == "undefined")
                        oBuffer.push(key + "=" + settings.data[key]);
                }

                settings.url += ("/" + settings.methodName);
                settings.requestData = oBuffer.join("&");

                break;
            default:
                settings.requestType = "soap1.1";
                settings.methodType = "POST";
                settings.contentType = "text/xml";

                oBuffer.push("<soap:Envelope ");
                oBuffer.push("xmlns:xsi=\"http://www.w3.org/2001/XMLSchema-instance\" ");
                oBuffer.push("xmlns:xsd=\"http://www.w3.org/2001/XMLSchema\" ");
                oBuffer.push("xmlns:soap=\"http://schemas.xmlsoap.org/soap/envelope/\">");
                oBuffer.push("<soap:Body>");
                oBuffer.push("<ns2:" + settings.methodName + " xmlns:ns2=\"" + settings.nameSpace + "\">");
                for (key in settings.data) {
                    if (key != "length" && typeof (settings.data[key].prototype) == "undefined")
                        oBuffer.push("<arg" + key + ">" + settings.data[key] + "</arg" + key + ">");
                }
                oBuffer.push("</ns2:" + settings.methodName + ">");
                oBuffer.push("</soap:Body>");
                oBuffer.push("</soap:Envelope>");

                settings.requestData = oBuffer.join("");

                break;
        }

        /*
        *Podstawowa wersja pluginu wyrzuca błąd bo wywołaniu $.ajax(...)
        *dla IE 8 dlatego dla tej przeglądarki używany jest inny kod
        */
        if (navigator.userAgent.toUpperCase().indexOf('MSIE') == -1) { // firefox, chrome
            $.ajax({ type: settings.methodType,
                cache: false,
                url: settings.url,
                data: settings.requestData,
                contentType: settings.contentType,
                dataType: settings.dataType,
                success: settings.success,
                error: settings.error,
                beforeSend: function (XMLHttpRequest) {
                    if (settings.requestType === "soap1.1" || settings.requestType === "soap1.2") {
                        //tak na wszelki wypadek, chyba .NET go wymaga
                        XMLHttpRequest.setRequestHeader("SOAPAction", settings.nameSpace + settings.methodName);
                    }
                }
            });
        } else { // IE 8
            var xdr = new XDomainRequest();
            xdr.open(settings.methodType, settings.url);
            xdr.onload = function () {
                if (undefined !== settings.success) {
                    settings.success(this.responseText, 'success');
                }
            }
            xdr.onerror = function () {
               if (undefined !== settings.error) {
                    settings.error('0', '', xdr.responseText);
                }
            }
            xdr.send(settings.requestData);
        }
    }
    catch (err) {
        alert("Error occurred in jquery.webservice.js.");
    }
};
}(jQuery));