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
		if (!this.initialState) {
			return false;
		}

		const queue = [{ word: word, stack: "Z", state: this.initialState }];
		const visited = new Set();
		visited.add(this.getInstantaneousDescriptionKey(queue[0]));
		while (queue.length > 0) {
			if (queue.length > 500) {
				console.log("overflow");
				return;
			}

			const curr = queue.shift();
			console.log(curr);

			if (curr.word.length === 0 && curr.state.isFinal()) {
				return true;
			} else {
				curr.state.getTransitions().forEach((t) => {
					const toState = t.getToState();
					t.getLabels().forEach((tuple) => {
						const next = { word: undefined, stack: undefined, state: toState };
						const char = curr.word.length > 0 ? curr.word.substring(0, 1) : "";
						if (tuple.char === "" || tuple.char === char) {
							next.word = tuple.char === "" ? curr.word : curr.word.substring(1);
							const stackPop = curr.stack.length > 0 ? curr.stack.substring(curr.stack.length - 1) : "";
							if (tuple.pop === "" || tuple.pop === stackPop) {
								next.stack = tuple.pop === "" ? curr.stack + tuple.push : curr.stack.substring(0, curr.stack.length - 1) + tuple.push;
								const key = this.getInstantaneousDescriptionKey(next);
								if (!visited.has(key)) {
									visited.add(key);
									queue.push(next);
								} else {
									console.log("found duplicate: " + key);
								}
							}
						}
					});
				});
			}
		}
		return false;
	}

	getInstantaneousDescriptionKey(tuple) {
		return tuple.word + "," + tuple.stack + "," + tuple.state.getId();
	}
}
