class Server {

	constructor(module) {
		const SServerApiUrl = "https://s-server.comcute.eti.pg.edu.pl/api";
		this.url = SServerApiUrl + '/tasks/' + module.identifier + '/';
	}


	verifyTaskSupport() {
		return this.fetch(this.url, {
            method: 'GET'
        });
	}


	getDataPackage() {
		return this.fetch(this.url, {
			method: 'POST'
        });
	}


	setResults(dataId, results) {
		const url = this.url + dataId;
		return this.fetch(url, {
			method: 'POST',
			body: {
				data: JSON.stringify(results)
			}
        });
	}


	fetch(url, init) {
		return fetch(url, init)
        .then(this._rejectStatusFailure)
        .then(this._parseJSON);
	}


	_rejectStatusFailure(response) {
        if (response.status >= 200 && response.status < 300) {
            return Promise.resolve(response)
        } else {
            return Promise.reject(response.status)
        }
    }


    _parseJSON(response) {
        return response.json()
    }
}