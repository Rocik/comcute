"use strict";
const Loader = function(userSettings) {

    const runner = new Runner(userSettings);
    let server;
    let registered;
    let computeModule;

    let errorHandler;
    let errorHandled = false;

    this.setFailureEvent = function(callback) {
        errorHandler = function() {
            console.error(Array.prototype.slice.call(arguments).join(" "));

            if (errorHandled) {
                return;
            }
            errorHandled = true;

            if (arguments.length > 0 && arguments[0] == 404) {
                alert(Comcute.messages.noTask);
            } else if (arguments.length > 0 && arguments[0] == "ENDED") {
                alert(Comcute.messages.computingEnd);
            } else {
                alert(Comcute.messages.error);
            }

            if (typeof callback === 'function') {
                callback();
            }
        };
    };


    this.register = function(module) {
        errorHandled = false;
        if (typeof errorHandler !== 'function') {
            this.setFailureEvent();
        }

        registered = true;
        computeModule = module;
        server = new Server(module);

        server.verifyTaskSupport()
        .then(startRunner)
        .catch(function(err) {
            errorHandler(err);
        });
    };


    this.unregister = function () {
        runner.stop();
        registered = false;
    };
    

    const startRunner = () => {
        if (!registered) {
            return;
        }

        runner.errorCallback = errorHandler;
        runner.startComputing(server, computeModule);
    }
};
