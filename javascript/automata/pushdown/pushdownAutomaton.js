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

	languageContains(word) {
		// is the word in the language of this FSA?

		// make sure there's an initial state
		if (!this.initialState) {
			return false;
		}

		// step through instanenous descriptions in a breadth-first manner
		const queue = [{ word: word, stack: "Z", state: this.initialState }];
		const visited = new Set();
		visited.add(this.getInstantaneousDescriptionKey(queue[0]));
		let numConfigurations = 0;

		while (queue.length > 0) {
			numConfigurations++;
			if (numConfigurations > 500) {
				return undefined;
			}

			// take from front of the queue
			const curr = queue.shift();
			// see if we're at an accept state
			if (curr.word.length === 0 && curr.state.isFinal()) {
				console.log(numConfigurations);
				return true;
			} else {
				// look at every other state we can go to
				curr.state.getTransitions().forEach((t) => {
					const toState = t.getToState();
					// look at every tuple we can use to get there
					t.getLabels().forEach((tuple) => {
						if (this.canUseTransitionTuple(curr, tuple)) {
							const newWord = tuple.char === "" ? curr.word : curr.word.substring(1);
							const newStack = tuple.pop === "" ? tuple.push + curr.stack : tuple.push + curr.stack.substring(1);

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
		}
		return false;
	}

	canUseTransitionTuple(desc, tuple) {
		const charMatches = tuple.char === "" || (desc.word.length > 0 && tuple.char === desc.word.substring(0, 1));
		const popMatches = tuple.pop === "" || (desc.stack.length > 0 && tuple.pop === desc.stack.substring(0, 1));

		return charMatches && popMatches;
	}

	getInstantaneousDescriptionKey(tuple) {
		return tuple.word + "," + tuple.stack + "," + tuple.state.getId();
	}
}
