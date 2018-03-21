jQuery(document).ready(function($) {
    function Logger() {
        this.method = "";
        this.id;
        this.infoId;
        this.sendRequest = function(type, data) {
            var that = this;
            $.ajax({
                type: 'post',
                dataType: 'json',
                url: Comcute.ajaxurl,
                data: {
                    action: 'cc_statistics',
                    type: type,
                    data: data
                },
                success: function(data) {
                    if (Logger.typeInfo === type && undefined !== data.id) {
                        that.id = data.id;
                    }
                }
            });
        };
        this.logError = function(errorType, status, textStatus, thrownError) {
            this.sendRequest(Logger.typeError, this.createErrorData(errorType, status, textStatus, thrownError));
        };
        this.logStartComputing = function(taskId) {
            this.sendRequest(Logger.typeInfo, this.createInfoData(taskId));
        };
        this.logEndComputing = function(taskId) {
            this.sendRequest(Logger.typeInfo, this.createInfoData(taskId, this.id));
        };
        this.createErrorData = function(errorType, status, textStatus, thrownError) {
            var browser = $.uaMatch(navigator.userAgent).browser;

            return {
                errorType: errorType,
                status: status,
                textStatus: textStatus,
                thrownError: thrownError,
                browser: browser,
                browserVersion: $.browser.version
            };
        };
        this.createInfoData = function(taskId, id) {
            return {
                id: id || "",
                taskId: taskId
            };
        };
        this.setMsg = function(type) {
            var className = "",
                msg = "";

            switch (type) {
                case Logger.typeError:
                    msg = Logger.dictionary.errorMsg;
                    className = "error";
                    break;
                case Logger.typeNoTask:
                    msg = Logger.dictionary.noTaskMsg;
                    className = "error";
                    break;
                case Logger.typeNoData:
                    msg = Logger.dictionary.awaitingDataMsg;
                    className = "info";
                    break;
                case Logger.typeStartComputing:
                    msg = Logger.dictionary.computingStartMsg;
                    className = "info";
                    break;
                case Logger.typeEndComputing:
                    msg = Logger.dictionary.computingEndMsg;
                    className = "info";
                    break;
            }

            $(this.infoId).html(msg);
            if (!($('#container').hasClass(className))) {
                $('#container').attr('class', '');
                $('#container').addClass(className);
            } else {
                $('#container').removeClass('hidden');
            }
            if (Logger.typeError === type || Logger.typeNoTask === type) {
                $('#comcute-button').removeClass('disabled');
            }
        };
    };
    Logger.dictionary = Comcute.messages;

    Logger.typeError = "error";
    Logger.typeStartComputing = "startComputing";
    Logger.typeEndComputing = "endComputing";
    Logger.typeNoTask = "noTask";
    Logger.typeNoData = "noData";
    Logger.typeInfo = "info";

    Logger.prototype.onError = function(errorType, status, textStatus, error) {
        this.logError(errorType, status, textStatus, error);
        this.setMsg(Logger.typeError);
    };
    Logger.prototype.onNoTask = function(errorType, status, textStatus, error) {
        this.logError(errorType, status, textStatus, error);
        this.setMsg(Logger.typeNoTask);
    };
    Logger.prototype.onNoData = function(errorType, status, textStatus, error) {
        this.logError(errorType, status, textStatus, error);
        this.setMsg(Logger.typeNoData);
    };
    Logger.prototype.onInfo = function(isStart, taskId) {
        if (isStart) {
            this.logStartComputing(taskId);
            this.setMsg(Logger.typeStartComputing);
        } else {
            this.logEndComputing(taskId);
            this.setMsg(Logger.typeEndComputing);
        }
    };

    var infoId = '#comcute',
        logger = new Logger(),
        jsL;
        logger.infoId = infoId;
        jsL = jsLoader({
            infoId: infoId,
            logger: logger
        }
    );
    $('#comcute-start').click(function(event){
        $('#comcute-start').css("display", "none");
        $('#comcute-stop').removeAttr("style");
        $('#progressbar').addClass('expanded').removeClass('collapsed');
        jsL.registerAndGetModule();
    });
    $('#comcute-stop').click(function(event){
        $('#comcute-start').removeAttr("style");
        $('#comcute-stop').css("display", "none");
        $('#progressbar').addClass('collapsed').removeClass('expanded');
        jsL.unregister();
    });
    $('#debugButtons span').each(function() {
        $(this).click(function(event){
            $('#comcute-button').addClass('disabled');
            jsL.registerAndGetModuleDEBUG($(this).attr('ref'));
        });
    });
    $('#close').click(function(event){
        var containerClass = $('#container').attr('class');
        switch (containerClass) {
            case 'error':
                $('#container').fadeOut('slow', function() {
                    $('#container').attr('class', '');
                    $('#container').addClass('hidden');
                    $('#container').css('display', '');
                });
                break;
            case 'info':
                $('#container').animate({
                    left: '-100%',
                    padding: '0.75em 30px 0.75em 0 '
                }, 800, function(){
                    $('#container').attr('class', 'infoHidden');
                    $('#container').attr('style', '');
                });
               break;
            case 'infoHidden':
               $('#container').animate({
                   left: '0',
                   padding: "0.75em 0"
               }, 800, function() {
                    $('#container').attr('class', 'info');
                    $('#container').attr('style', '');
               });
               break;
        }
    });
    $('#more-less').click(function(event) {
        if ($('#more-less').hasClass('more')) {
            $('#main').addClass('full');
            $('#more-less').removeClass('more');
            $('#more-less').addClass('less');
        } else if ($('#more-less').hasClass('less')) {
            $('#main').removeClass('full');
            $('#more-less').removeClass('less');
            $('#more-less').addClass('more');
        }
    });
}(jQuery));
(function(d, s, id) {
  var js, fjs = d.getElementsByTagName(s)[0];
  if (d.getElementById(id)) return;
  js = d.createElement(s); js.id = id;
  js.src = "//connect.facebook.net/en_GB/all.js#xfbml=1&appId=253343904679064";
  fjs.parentNode.insertBefore(js, fjs);
}(document, 'script', 'facebook-jssdk'));
// Load G+ SDK Asynchronously
(function() {
    var po = document.createElement('script');
    po.type = 'text/javascript';
    po.async = true;
    po.src = 'https://apis.google.com/js/plusone.js',
    s = document.getElementsByTagName('script')[0];
    s.parentNode.insertBefore(po, s);
})();
