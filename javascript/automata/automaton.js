class Automaton {
	constructor() {
		this.states = new Map();
		this.initialState = undefined;
	}

	getStates() {
		return this.states;
	}

	getStateById(id) {
		return this.states.get(id);
	}

	addState(pos, name, element, initial) {
		const id = this.getNextId();
		const state = new State(pos, id, name, element);
		this.states.set(id, state);
		if (initial) {
			this.setInitialState(state);
		}
	}

	removeState(state) {
		if (this.initialState === state) {
			this.initialState = undefined;
		}
		this.removeTransitionsToState(state);
		this.removeTransitionsFromState(state);
		this.states.delete(state.getId());
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

	removeTransition(transition) {
		transition.getFromState().removeTransition(transition.getToState());
	}

	getTransitionsBetweenStates(fromState, toState) {
		return fromState.getTransitionsToState(toState);
	}

	hasTransitionBetweenStates(fromState, toState) {
		return fromState.hasTransitionToState(toState);
	}

	setInitialState(state) {
		if (this.initialState) {
			this.initialState.setInitial(false);
		}
		state.setInitial(true);
		this.initialState = state;
	}

	removeInitialState() {
		if (this.initialState) {
			this.initialState.setInitial(false);
		}
		this.initialState = undefined;
	}

	addFinalState(state) {
		state.setFinal(true);
	}

	removeFinalState(state) {
		state.setFinal(false);
	}

	removeAllFinalStates() {
		this.states.forEach((s) => {
			s.setFinal(false);
		});
	}

	languageContains(word) {
		if (!this.initialState) {
			return false;
		}
		this.lambdaTransitions = new Set();
		return this.parseRec(word, this.initialState);
	}

	parseRec(partialWord, state) {
		const transitions = state.getTransitions();
		for (const wrappedTransition of transitions) {
			const t = wrappedTransition[1];
			const toState = t.getToState();
			// regular transition
			if (partialWord.length > 0) {
				const char = partialWord.substring(0, 1);
				if (t.hasLabel(char) && this.parseRec(partialWord.substring(1), toState)) {
					return true;
				}
			}
			// lambda transition
			if (t.hasLabel("")) {
				// ignore if it's a self transition
				if (t.getFromState() !== toState) {
					// make sure we haven't taken this transition with this length before
					const lambdaCode = partialWord.length + "-" + t.getId();
					if (!this.lambdaTransitions.has(lambdaCode)) {
						this.lambdaTransitions.add(lambdaCode);
						if (this.parseRec(partialWord, toState)) {
							return true;
						}
					}
				}
			}
		}
		if (partialWord.length === 0) {
			return state.isFinal();
		}

		return false;
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
