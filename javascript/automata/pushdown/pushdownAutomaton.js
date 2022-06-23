class PushdownAutomaton extends Automaton {
	constructor() {
		super();
	}

	addState(pos, name, element, initial) {
		const id = this.getNextId();
		const state = new PushdownState(pos, id, name, element);
		this.states.set(id, state);
		if (initial) {
			this.setInitialState(state);
		}
		return state;
	}

	addTransition(fromState, toState, tuple, element) {
		const transition = fromState.addTransition(toState, tuple);
		if (element) {
			transition.addElement(element);
		}
		return transition;
	}

	getAlphabet() {
		const alphabet = new Set();
		if (this.initialState) {
			this.states.forEach((s) => {
				s.getTransitions().forEach((t) => {
					t.getLabels().forEach((tuple) => {
						alphabet.add(tuple.char);
					});
				});
			});
		}
		return alphabet;
	}

	getStackAlphabet() {
		const alphabet = new Set();
		alphabet.add(initialStackChar);
		if (this.initialState) {
			this.states.forEach((s) => {
				s.getTransitions().forEach((t) => {
					t.getLabels().forEach((tuple) => {
						alphabet.add(tuple.pop);
						for (const char of tuple.push.split("")) {
							alphabet.add(char);
						}
					});
				});
			});
		}
		return alphabet;
	}

	languageContains(word) {
		// is the word in the language of this PDA?

		// make sure there's an initial state
		if (!this.initialState) {
			return false;
		}

		// step through instantaneous descriptions in a breadth-first manner
		const queue = [{ word: word, stack: initialStackChar, state: this.initialState }];
		const visited = new Set();
		visited.add(this.getInstantaneousDescriptionKey(queue[0]));

		while (queue.length > 0) {
			if (visited.size > maxConfigurations) {
				return undefined;
			}

			// take from front of the queue
			const curr = queue.shift();

			// see if we're at an accept state
			if (curr.word.length === 0 && curr.state.isFinal()) {
				return true;
			}

			// look at every other state we can go to
			curr.state.getTransitions().forEach((t) => {
				const toState = t.getToState();
				// look at every tuple we can use to get there
				t.getLabels().forEach((tuple) => {
					if (this.canUseTransitionTuple(curr, tuple)) {
						const newWord = tuple.char === "" ? curr.word : curr.word.substring(1);
						const newStack =
							tuple.pop === "" ? tuple.push + curr.stack : tuple.push + curr.stack.substring(1);

						// make sure we haven't computed this description before
						const next = { word: newWord, stack: newStack, state: toState };
						const key = this.getInstantaneousDescriptionKey(next);
						if (!visited.has(key)) {
							// add to queue
							visited.add(key);
							queue.push(next);
						}
					}
				});
			});
		}
		return false;
	}

	canUseTransitionTuple(desc, tuple) {
		// can the automaton take this transition tuple from this instantaneous  description
		const charMatches =
			tuple.char === "" || (desc.word.length > 0 && tuple.char === desc.word.substring(0, 1));
		const popMatches =
			tuple.pop === "" || (desc.stack.length > 0 && tuple.pop === desc.stack.substring(0, 1));

		return charMatches && popMatches;
	}

	getInstantaneousDescriptionKey(tuple) {
		return tuple.word + "," + tuple.stack + "," + tuple.state.getId();
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
		const queue = [
			{ word: word, stack: initialStackChar, state: this.initialState, depth: 0, accept: undefined },
		];

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
				const toState = t.getToState();
				// look at every tuple we can use to get there
				t.getLabels().forEach((tuple) => {
					if (this.canUseTransitionTuple(curr, tuple)) {
						const newWord = tuple.char === "" ? curr.word : curr.word.substring(1);
						const newStack =
							tuple.pop === "" ? tuple.push + curr.stack : tuple.push + curr.stack.substring(1);

						const next = {
							word: newWord,
							stack: newStack,
							state: toState,
							depth: curr.depth + 1,
							accept: undefined,
							predecessor: index,
						};
						queue.push(next);
						foundTransition = true;
					}
				});
			});

			// check whether there was anywhere to go
			if (!foundTransition) {
				curr.accept = false;
			}
		}

		return steps;
	}

	isDeterministic() {
		// return whether this is a DPDA (loosely defined)
		// this does not check for every combination of stack character and input for each transition, it just looks for multiple possibilities with the same input and character

		if (!this.initialState) {
			return false;
		}

		const queue = [this.initialState];
		const visited = new Set();
		while (queue.length > 0) {
			const state = queue.shift();
			visited.add(state);
			const transitions = state.getTransitions();
			const foundTuples = [];
			for (const item of transitions) {
				const t = item[1];

				for (const tuple of t.getLabels()) {
					for (const found of foundTuples) {
						if (tuple.char === "" || found.char === "" || tuple.char === found.char) {
							if (tuple.pop === "" || found.pop === "" || tuple.pop === found.pop) {
								return false;
							}
						}
					}
					foundTuples.push(tuple);
				}

				// add toState to queue
				const toState = t.getToState();
				if (!visited.has(toState)) {
					queue.push(toState);
				}
			}
		}
		return true;
	}
}
