window.onload = function() {
    'use strict';
    
    const enabledTasks = [
        { title: "Fire",               js: window.comcuteFireModule },
        { title: "Collatz Intervals",  js: window.comcuteCollatzModule },
        { title: "Mersene",            js: window.comcuteMersenneModule },
    ]

    const userSettings = new UserSettings();
    const loader = new Loader(userSettings);

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

    const oldBrowserStorageKey = 'isOldBrowser';


    function setup() {
        if (sessionStorage.getItem(oldBrowserStorageKey) == null) {
            const isOldBrowser = typeof(Worker) === "undefined";
            sessionStorage.setItem(oldBrowserStorageKey, isOldBrowser.toString());
            if (isOldBrowser) {
                alert(Comcute.messages.oldBrowser)
            }
        }

        if (sessionStorage.getItem(oldBrowserStorageKey) == 'false') {
            comcuteStart.parentElement.removeAttribute("style");
        }

        const comcuteTasks = document.getElementById('comcute-tasks');
        for (let task of enabledTasks) {
            const a = document.createElement("a");
            a.classList.add("comcute-start");
            a.innerText = task.title;
            a.onclick = () => {
                startComcute(task.js);
            }
            comcuteTasks.appendChild(a);
        }
    }


    comcuteStart.onclick = function() {
        startComcute(enabledTasks[0].js);
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


    function startComcute(comcuteModule) {
        if (sessionStorage.getItem(oldBrowserStorageKey) == 'true') {
            return;
        }

        loader.setFailureEvent(resetUI);
        loader.register(comcuteModule);

        comcuteStart.parentElement.style.display = "none";
        comcuteStop.removeAttribute("style");
        progressBar.classList.replace('collapsed', 'expanded')
        simCanvas.style.display = "none";
        empty(simCanvas.getElementsByClassName('all')[0]);
        empty(simCanvas.getElementsByClassName('selected')[0]);
        computingStatus.classList.replace('hidden', 'visible')
        textStatus.innerHTML = Comcute.messages.awaitingData;
    }


    function resetUI() {
        comcuteStart.parentElement.removeAttribute("style");
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


    setup();
};


class UserSettings {
    constructor() {
        const cpuThreads = window.navigator.hardwareConcurrency - 1;
        this.workersCount = this.loadWorkersAmount(cpuThreads);

        this.setupSlider(cpuThreads);
    }

    loadWorkersAmount(maxWorkers) {
        const defaultAmount = this.isOnMobile() ? 1 : maxWorkers;

        const workersCount = localStorage.getItem("workersCount");
        if (workersCount == null) {
            return defaultAmount;
        }

        return parseInt(workersCount) || defaultAmount;
    }

    isOnMobile() {
        return (typeof window.orientation !== "undefined")
            || (navigator.userAgent.indexOf('IEMobile') !== -1);
    }

    setupSlider(threadsLimit) {
        const workersCountRange = document.getElementById('workers-count');
        if (workersCountRange == null) {
            return;
        }
        workersCountRange.setAttribute("max", threadsLimit);
        workersCountRange.setAttribute("value", this.workersCount);

        const self = this;
        workersCountRange.oninput = function() {
            self.workersCount = this.value;
            localStorage.setItem("workersCount", this.value);
        }
    }
}
