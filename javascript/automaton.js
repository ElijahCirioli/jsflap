class Automaton {
	constructor() {
		this.states = new Map();
		this.transitions = new Set();
	}

	getStateById(id) {
		return this.states.get(id);
	}

	addState(pos, name, element) {
		const id = this.getNextId();
		const state = new State(pos, id, name, element);
		this.states.set(id, state);
	}

	addTransition(fromState, toState) {
		this.transitions.add(new Transition(fromState, toState));
	}

	drawAllStates() {
		this.states.forEach((s) => {
			s.draw();
		});
	}

	drawAllTransitions(canvas) {
		const context = canvas.getContext("2d");
		context.clearRect(0, 0, canvas.width, canvas.height);
		this.transitions.forEach((t) => {
			t.draw(context);
		});
	}

	getNextId() {
		const possibleChars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");
		const idLength = 15;
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
