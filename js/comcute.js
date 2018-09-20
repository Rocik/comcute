window.onload = function() {
    'use strict';

    const loader = new Loader();

    const comcuteStart = document.getElementById('comcute-start');
    const comcuteStop = document.getElementById('comcute-stop');
    const progressBar = document.getElementById('progressbar');
    const progress = progressBar.getElementsByClassName('progress')[0];
    const computingStatus = document.getElementById('computing-status');
    const simCanvas = document.getElementById('sim-canvas');
    const textStatus = document.getElementById('text-status');

    const moreLess = document.getElementById('more-less');
    const line = document.getElementById('line');
    const firstPageContent = document.getElementsByClassName('page-content')[0];
    const panel = document.getElementById('panel');


    comcuteStart.onclick = function() {
        loader.setFailureEvent(resetUI);
        loader.registerAndGetModule();

        comcuteStart.style.display = "none";
        comcuteStop.removeAttribute("style");
        progressBar.classList.replace('collapsed', 'expanded')
        simCanvas.style.display = "none";
        empty(simCanvas.getElementsByClassName('all')[0]);
        empty(simCanvas.getElementsByClassName('selected')[0]);
        computingStatus.classList.replace('hidden', 'visible')
        textStatus.innerHTML = Comcute.messages.awaitingData;
    };


    comcuteStop.onclick = function() {
        resetUI();
        loader.unregister();
    };


    moreLess.onclick = function() {
        if (moreLess.classList.contains('less')) {
            moreLess.classList.remove('less');
            line.classList.remove('less');
            firstPageContent.classList.remove('more');
            panel.classList.remove('hidden');
        } else {
            moreLess.classList.add('less');
            line.classList.add('less');
            firstPageContent.classList.add('more');
            panel.classList.add('hidden');
        }
    };


    function resetUI() {
        comcuteStart.removeAttribute("style");
        comcuteStop.style.display = "none";
        progressBar.classList.replace('expanded', 'collapsed')
        progress.style.width = "0%";
        computingStatus.classList.replace('visible', 'hidden')
    }


    function empty(element) {
        while (element.firstChild) {
            element.removeChild(element.firstChild);
        }
    }
};
