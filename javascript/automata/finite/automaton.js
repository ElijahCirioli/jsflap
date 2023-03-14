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

	removeEmptyTransitions() {
		// remove transitions with no labels
		this.states.forEach((s) => {
			s.getTransitions().forEach((t) => {
				if (t.getLabels().size === 0) {
					console.log("found empty transition");
					s.removeTransition(t.getToState());
				}
			});
		});
	}

	languageContains(word) {
		// is the word in the language of this FSA?

		if (!this.initialState) {
			return false;
		}
		this.lambdaTransitions = new Set();
		return this.parseRec(word, this.initialState);
	}

	parseRec(partialWord, state) {
		// recursively walk through states to see if the string is accepted

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
		// we've run out of characters, are we at a final state?
		if (partialWord.length === 0) {
			return state.isFinal();
		}

		return false;
	}

	getParseSteps(word) {
		// get a step-by-step process for parsing whether a word is in the language

		// make sure there's an initial state
		if (!this.initialState) {
			return [];
		}

		let foundAccept = false;
		let totalConfigurations = 0;
		const steps = [];
		const queue = [{ word: word, state: this.initialState, depth: 0, accept: undefined }];

		while (queue.length > 0) {
			// take from front of the queue
			const curr = queue.shift();

			// add to steps tree
			if (steps.length <= curr.depth) {
				// break the loop early if there's an accept in the last layer or we've tried too many things
				if (foundAccept || totalConfigurations > maxConfigurations) {
					break;
				}
				steps.push([curr]);
			} else {
				steps[curr.depth].push(curr);
			}
			totalConfigurations++;

			// see if we're at an accept state
			if (curr.word.length === 0 && curr.state.isFinal()) {
				curr.accept = true;
				foundAccept = true;
				continue;
			}

			const index = steps[curr.depth].length - 1; // track where we came from in this layer
			let foundTransition = false;

			// look at every transition we can take
			curr.state.getTransitions().forEach((t) => {
				// normal transition
				if (curr.word.length > 0 && t.hasLabel(curr.word[0])) {
					const next = {
						word: curr.word.substring(1),
						state: t.getToState(),
						depth: curr.depth + 1,
						accept: undefined,
						predecessor: index,
					};
					queue.push(next);
					foundTransition = true;
				}

				// lambda transition
				if (t.hasLabel("")) {
					const next = {
						word: curr.word,
						state: t.getToState(),
						depth: curr.depth + 1,
						accept: undefined,
						predecessor: index,
					};
					queue.push(next);
					foundTransition = true;
				}
			});

			// check whether there was anywhere to go
			if (!foundTransition) {
				curr.accept = false;
			}
		}

		return steps;
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

	isDeterministic(alphabet) {
		// return whether this is a DFA

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
		// return a set of all states not reachable from the initial state

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
		// return whether the graph contains any cycles

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
		// recursively look for back edges

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
		const possibleChars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";
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
