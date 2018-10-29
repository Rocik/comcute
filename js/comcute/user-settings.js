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