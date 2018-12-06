const tasksData = {
	fire: {
		values: [
			// format: <map path> <firefighters count>[<x, y> <simulations>[<fires count> [<x, y>]]
			"/images/map_small.png 3 494 11 667 743 958 942 6 2 580 667 602 615 2 151 984 587 94 2 24 662 504 825 3 451 931 351 879 150 913 2 237 819 34 530 4 375 744 712 812 1004 884 125 400",
			"/images/map_small.png 3 494 11 667 743 958 942 6 3 874 827 10 423 465 689 3 191 496 531 980 208 978 4 111 532 954 759 474 709 477 780 4 327 786 192 769 693 848 22 576 4 78 268 579 685 409 789 262 763 2 463 869 400 758"
		],
		current: 0,
	},

	collatz: {
		values: [
			"1000000000000000000 10000",
			"1000000000000010000 10000",
			"1000000000000020000 10000",
			"1000000000000030000 10000",
			"1000000000000040000 10000",
			"1000000000000050000 10000",
			"1000000000000060000 10000",
			"1000000000000070000 10000",
			"1000000000000080000 10000",
			"1000000000000090000 10000",
			"1000000000000100000 10000",
		],
		current: 0
	},

	mersenne: {
		values: [
			"890", "5151", "10000"
		],
		current: 0
	}
}

function uuid() {
	function s4() {
		return Math.floor((1 + Math.random()) * 0x10000)
			.toString(16)
			.substring(1);
	}
	return s4() + s4() + '-' + s4() + '-' + s4() + '-' + s4() + '-' + s4() + s4() + s4();
}

const realFetch = window.fetch;
window.fetch = function() {
	if (arguments[0].includes("s-server.comcute.eti.pg.edu.pl/api")) {
		let jsonBody = {};
		let status = 200;

		const restFragments = arguments[0].split("/");
		if (restFragments[4] === "tasks") {
			if (arguments[1].method === "POST") {
				if (restFragments[6].length === 0) {
					const taskId = restFragments[5];
					let index = tasksData[taskId].current;
					if (index < tasksData[taskId].values.length) {
						tasksData[restFragments[5]].current++;

						jsonBody = {
							UUID: uuid(),
							input: tasksData[taskId].values[index]
						}
					} else {
						status = 404;
					}
				}
			} else if (arguments[1].method === "GET") {
				switch (restFragments[5]) {
					case "fire":
					case "collatz":
					case "mersenne":
						break;
					default:
						status = 404;
						break;
				}
			}
		}

		const response = new Response(JSON.stringify(jsonBody), {
			"status": status,
			"statusText": "OK"
		});
		return new Promise(function(resolve) {
			setTimeout(function() {
				resolve(response);
			}, 200);
		});
	}

	return realFetch.apply(this, arguments)
}