class Automaton {
	constructor() {
		this.states = new Map();
		this.finalStates = new Set();
		this.final;
	}

	getStates() {
		return this.states;
	}

	getStateById(id) {
		return this.states.get(id);
	}

	addState(pos, name, element) {
		const id = this.getNextId();
		const state = new State(pos, id, name, element);
		this.states.set(id, state);
	}

	removeState(state) {
		this.removeTransitionsToState(state);
		this.states.delete(state.id);
		state.getElement().remove();
	}

	addTransition(fromState, toState) {
		const transition = new Transition(fromState, toState);
		fromState.addTransition(transition);
		return transition;
	}

	getTransitionsFromState(state) {
		return state.getTransitions();
	}

	removeTransitionsToState(state) {
		this.states.forEach((s) => {
			s.getTransitions().forEach((transitions, label) => {
				for (let i = 0; i < transitions.length; i++) {
					const t = transitions[i];
					if (t.getToState() === state) {
						transitions.splice(i, 1);
						i--;
						if (transitions.length === 0) {
							s.getTransitions().delete(label);
						}
					}
				}
			});
		});
	}

	removeTransitionsFromState(state) {
		state.clearTransitions();
	}

	getTransitionsBetweenStates(fromState, toState) {
		return fromState.getTransitionsToState(toState);
	}

	drawAllStates() {
		this.states.forEach((s) => {
			s.draw();
		});
	}

	drawAllTransitions(canvas) {
		const context = canvas.getContext("2d");
		context.clearRect(0, 0, canvas.width, canvas.height);
		this.states.forEach((s) => {
			s.getTransitions().forEach((label) => {
				for (const t of label) {
					t.draw(context);
				}
			});
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
