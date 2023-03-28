class URLTransfer {
	constructor() {}

	static export(saveObject) {
		// get the existing transfers if they exist
		const transfers = JSON.parse(window.localStorage.getItem("jsflap url transfers")) || {};

		// remove all stored transfers that are over one day old
		const currTime = Date.now();
		const updatedTransfers = Object.fromEntries(
			Object.entries(transfers).filter(([_, transfer]) => {
				return currTime - transfer.time < 86400000;
			})
		);

		// generate a unique ID for this environment
		const key = URLTransfer.getNextKey(updatedTransfers);

		// add the new transfer
		updatedTransfers[key] = {
			time: currTime,
			save: saveObject,
		};

		// save back to local storage
		window.localStorage.setItem("jsflap url transfers", JSON.stringify(updatedTransfers));

		// create the url
		return "https://elijahcirioli.com/jsflap/?load=" + key;
	}

	static import(key) {
		// get the existing transfers if they exist
		const transfers = JSON.parse(window.localStorage.getItem("jsflap url transfers")) || {};

		// make sure this key exists in the transfers
		if (!(key in transfers)) {
			return;
		}

		// load the environment
		FileParser.parseJSON(transfers[key].save, true);

		// remove the transfer now that it's been used
		delete transfers[key];

		// save back to local storage
		window.localStorage.setItem("jsflap url transfers", JSON.stringify(transfers));
	}

	static checkForImport() {
		// get the existing transfers if they exist
		const transfers = JSON.parse(window.localStorage.getItem("jsflap url transfers")) || {};

		// remove all stored transfers that are over one day old
		const currTime = Date.now();
		const updatedTransfers = Object.fromEntries(
			Object.entries(transfers).filter(([_, transfer]) => {
				return currTime - transfer.time < 86400000;
			})
		);

		// save back to local storage
		window.localStorage.setItem("jsflap url transfers", JSON.stringify(updatedTransfers));

		const params = new URLSearchParams(window.location.search);

		// stop if there is no automaton to load
		if (!params.has("load")) {
			return;
		}

		// load the specified automaton
		URLTransfer.import(params.get("load"));

		// delete the empty default environments
		if (environments.size > 1) {
			environments.forEach((env) => {
				if (env !== activeEnvironment && env.isEmpty()) {
					removeEnvironment(env);
				}
			});
		}

		// remove the key from the url
		window.history.replaceState({}, document.title, "/");
	}

	static getNextKey(transfers) {
		const possibleChars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";
		const keyLength = 8;
		while (true) {
			let str = "";
			for (let i = 0; i < keyLength; i++) {
				str += possibleChars[Math.floor(Math.random() * possibleChars.length)];
			}
			if (!(str in transfers)) {
				return str;
			}
		}
	}
}
