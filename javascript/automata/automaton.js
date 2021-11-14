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
		return state;
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

	hasInitialState() {
		return this.initialState !== undefined;
	}

	getInitialState() {
		return this.initialState;
	}

	hasFinalState() {
		for (const s of this.states) {
			if (s[1].isFinal()) {
				return true;
			}
		}
		return false;
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

	getAlphabet() {
		const alphabet = new Set();
		if (this.initialState) {
			this.states.forEach((s) => {
				s.getTransitions().forEach((t) => {
					t.getLabels().forEach((char) => {
						alphabet.add(char);
					});
				});
			});
		}
		return alphabet;
	}

	isDFA(alphabet) {
		if (!this.initialState) {
			return false;
		}
		const queue = [this.initialState];
		const visited = new Set();
		while (queue.length > 0) {
			const state = queue.shift();
			visited.add(state);
			const transitions = state.getTransitions();
			const labels = new Set();
			for (const item of transitions) {
				const t = item[1];

				for (const char of t.getLabels()) {
					// check for non-determinism and lambda transition
					if (labels.has(char) || char === "") {
						return false;
					}
					labels.add(char);
				}

				// add toState to queue
				const toState = t.getToState();
				if (!visited.has(toState)) {
					queue.push(toState);
				}
			}

			// see if the state is missing transitions for a character in the alphabet
			for (const char of alphabet) {
				if (!labels.has(char)) {
					return false;
				}
			}
		}
		return true;
	}

	getUnreachableStates() {
		if (!this.initialState) {
			return new Set();
		}
		const queue = [this.initialState];
		const visited = new Set();
		while (queue.length > 0) {
			const state = queue.shift();
			visited.add(state);
			state.getTransitions().forEach((t) => {
				// add toState to queue
				const toState = t.getToState();
				if (!visited.has(toState)) {
					queue.push(toState);
				}
			});
		}

		// find difference between visited and states
		const unreachable = new Set();
		this.states.forEach((s) => {
			if (!visited.has(s)) {
				unreachable.add(s);
			}
		});

		return unreachable;
	}

	containsCycle() {
		const visited = new Set();
		const explored = new Set();

		for (const item of this.states) {
			if (this.containsCycleRec(item[1], visited, explored)) {
				return true;
			}
		}
		return false;
	}

	containsCycleRec(state, visited, explored) {
		if (explored.has(state)) {
			return true;
		}
		if (visited.has(state)) {
			return false;
		}

		visited.add(state);
		explored.add(state);

		const transitions = state.getTransitions();
		for (const item of transitions) {
			const t = item[1];
			if (this.containsCycleRec(t.getToState(), visited, explored)) {
				return true;
			}
		}

		explored.delete(state);
		return false;
	}

	drawAllStates() {
		this.states.forEach((s) => {
			s.draw();
		});
	}

	drawAllTransitions(canvas, scale, offset, updateLabels) {
		const context = canvas.getContext("2d");
		context.clearRect(0, 0, canvas.width, canvas.height);
		this.states.forEach((s) => {
			s.getTransitions().forEach((t) => {
				t.draw(canvas, scale, offset, updateLabels);
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
