class Automaton {
	constructor() {
		this.states = new Map();
		this.transitions = new Set();
	}

	addState(pos, name, element) {
		const id = this.getNextId();
		const state = new State(pos, id, name, element);
		this.states.set(id, state);
	}

	drawAllStates() {
		this.states.forEach((s) => {
			s.draw();
		});
	}

	getNextId() {
		const possibleChars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");
		const idLength = 10;
		while (true) {
			let str = "";
			for (let i = 0; i < idLength; i++) {
				str += possibleChars[Math.floor(Math.random() * possibleChars.length)];
			}
			if (!this.states.has(str)) {
				return str;
			}
		}
	}

	getNextName() {
		for (let i = 0; true; i++) {
			const name = "q" + i;
			let foundName = false;
			this.states.forEach((s) => {
				if (s.name === name) {
					foundName = true;
				}
			});
			if (!foundName) {
				return name;
			}
		}
	}
}
