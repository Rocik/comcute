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
