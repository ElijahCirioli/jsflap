class TuringAutomaton extends PushdownAutomaton {
	constructor() {
		super();
	}

	addState(pos, name, element, initial) {
		const id = this.getNextId();
		const state = new TuringState(pos, id, name, element);
		this.states.set(id, state);
		if (initial) {
			this.setInitialState(state);
		}
		return state;
	}

	getAlphabet() {
		const alphabet = new Set();
		if (this.initialState) {
			this.states.forEach((s) => {
				s.getTransitions().forEach((t) => {
					t.getLabels().forEach((tuple) => {
						alphabet.add(tuple.read);
						alphabet.add(tuple.write);
					});
				});
			});
		}
		return alphabet;
	}

	parseInput(tape) {
		// make sure there's an initial state
		if (!this.initialState) {
			return false;
		}

		// step through instantaneous descriptions in a breadth-first manner
		const queue = [{ tape: tape, index: 0, state: this.initialState }];
		const visited = new Set();
		visited.add(this.getInstantaneousDescriptionKey(queue[0]));

		while (queue.length > 0) {
			if (visited.size > maxConfigurations) {
				return { accept: undefined };
			}

			// take from front of the queue
			const curr = queue.shift();

			// see if we're at an accept state
			if (curr.state.isFinal()) {
				return { accept: true, tape: curr.tape, index: curr.index };
			}

			// look at every other state we can go to
			curr.state.getTransitions().forEach((t) => {
				// look at every tuple we can use to get there
				t.getLabels().forEach((tuple) => {
					if (curr.tape[curr.index] === tuple.read) {
						const newTape = curr.tape.slice();
						newTape[curr.index] = tuple.write;

						let newIndex = curr.index + tuple.move;
						if (newIndex < 0) {
							newIndex = 0;
							newTape.unshift(blankTapeChar);
						} else if (newIndex >= newTape.length) {
							newTape.push(blankTapeChar);
						}

						// make sure we haven't computed this description before
						const next = { tape: newTape, index: newIndex, state: t.getToState() };
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
		return { accept: false };
	}

	getInstantaneousDescriptionKey(tuple) {
		return tuple.tape + "," + tuple.index + "," + tuple.state.getId();
	}

	getParseSteps(tape) {
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
}
