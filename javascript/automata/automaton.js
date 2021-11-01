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
		this.removeTransitionsFromState(state);
		this.states.delete(state.id);
		state.getElement().remove();
	}

	addTransition(fromState, toState, label, element) {
		const transition = fromState.addTransition(toState, label);
		if (element) {
			transition.addElement(element);
		}
		return transition;
	}

	getTransitionsFromState(state) {
		return state.getTransitions();
	}

	removeTransitionsToState(state, label) {
		this.states.forEach((s) => {
			if (s.hasTransitionToState(state)) {
				s.removeTransition(state, label);
			}
		});
	}

	removeTransitionsFromState(state) {
		state.clearTransitions();
	}

	getTransitionsBetweenStates(fromState, toState) {
		return fromState.getTransitionsToState(toState);
	}

	hasTransitionBetweenStates(fromState, toState) {
		return fromState.hasTransitionToState(toState);
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
			s.getTransitions().forEach((t) => {
				t.draw(context);
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
