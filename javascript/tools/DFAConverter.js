class DFAConverter {
	constructor() {}

	static action(environment) {
		const automaton = environment.getEditor().getAutomaton();

		// first make sure this is possible
		if (!automaton.hasInitialState()) {
			environment.addPopupMessage(
				new PopupMessage(
					"Error",
					"The automaton does not have an initial state.",
					() => {
						environment.removePopupMessages();
					},
					true
				)
			);
			return;
		} else if (automaton.getAlphabet().size === 0) {
			environment.addPopupMessage(
				new PopupMessage(
					"Error",
					"The automaton has no transitions",
					() => {
						environment.removePopupMessages();
					},
					true
				)
			);
			return;
		}

		const env = createEnvironment();
		env.createFiniteEditor();
		const editor = env.getEditor();

		env.setName(`DFA ${environment.getName()}`);

		// get the DFA as a table
		const tables = DFAConverter.NFAtoDFATable(automaton);
		const transitionTableDFA = tables.DFA;
		const needsTrapState = tables.needsTrapState;
		const finalStates = tables.finalStates;

		// create all the states
		const idTable = new Map();
		for (const item of transitionTableDFA) {
			const fromId = item[0];
			if (!idTable.has(fromId)) {
				const newState = editor.createState(DFAConverter.randomPoint(editor), false);
				const componentStateIds = fromId.split("+");
				for (const id of componentStateIds) {
					if (finalStates.has(id) || automaton.getStateById(id).isFinal()) {
						newState.setFinal(true);
						break;
					}
				}
				if (fromId === automaton.getInitialState().getId()) {
					editor.getAutomaton().setInitialState(newState);
				}
				idTable.set(fromId, newState);
			}
		}
		// add a trap state if necessary
		if (needsTrapState) {
			DFAConverter.createTrapState(automaton.getAlphabet(), editor, idTable);
		}

		// create all the transitions
		for (const item of transitionTableDFA) {
			const fromState = idTable.get(item[0]).getElement();
			for (const transition of item[1]) {
				const label = transition[0];
				const toState = idTable.get(transition[1]).getElement();

				editor.startTransition(fromState);
				const transitionObj = editor.endTransition(toState, false);
				transitionObj.addLabel(label);
			}
		}

		TreeLayout.action(env);
		env.testAllInputs(true);
	}

	static NFAtoDFATable(automaton) {
		// recreate the NFA as a table
		const transitionTableNFA = new Map();
		const finalStates = new Set();
		automaton.getStates().forEach((s) => {
			const fromId = s.getId();
			const labels = new Map();
			if (DFAConverter.generateLabelsTableRec(s, labels)) {
				finalStates.add(fromId);
			}
			transitionTableNFA.set(fromId, labels);
		});

		// convert the table to a DFA
		const alphabet = automaton.getAlphabet();
		const queue = [automaton.getInitialState().getId()];
		const transitionTableDFA = new Map();
		let needsTrapState = false;
		while (queue.length > 0) {
			const fromId = queue.shift();
			if (transitionTableDFA.has(fromId)) {
				continue;
			}
			const labelsTableDFA = new Map();
			transitionTableDFA.set(fromId, labelsTableDFA);
			for (const label of alphabet) {
				if (label !== "") {
					let allIds = new Set();
					for (const component of fromId.split("+")) {
						const labelsTableNFA = transitionTableNFA.get(component);
						if (labelsTableNFA.has(label)) {
							const NFATransition = labelsTableNFA.get(label);
							for (const id of NFATransition) {
								allIds.add(id);
							}
						}
					}
					let combinedId = "";
					allIds.forEach((id) => {
						combinedId += id + "+";
					});
					if (combinedId === "") {
						labelsTableDFA.set(label, "trap");
						needsTrapState = true;
					} else {
						combinedId = combinedId.substring(0, combinedId.length - 1);
						labelsTableDFA.set(label, combinedId);
						queue.push(combinedId);
					}
				}
			}
		}

		return {
			NFA: transitionTableNFA,
			DFA: transitionTableDFA,
			finalStates: finalStates,
			needsTrapState: needsTrapState,
		};
	}

	static createTrapState(alphabet, editor, statesMap) {
		const state = editor.createState(DFAConverter.randomPoint(editor), false);
		editor.startTransition(state.getElement());
		const transitionObj = editor.endTransition(state.getElement(), false);
		for (const label of alphabet) {
			if (label === "") {
				continue;
			}
			transitionObj.addLabel(label);
		}
		FileParser.setStateName(state, "Trap");
		statesMap.set("trap", state);
	}

	static generateLabelsTableRec(state, labelsTable, visited) {
		const visitedStates = visited || new Set();
		let finalStatus = state.isFinal();
		visitedStates.add(state.getId());

		state.getTransitions().forEach((t) => {
			const toId = t.getToState().getId();
			for (const label of t.getLabels()) {
				if (label === "") {
					// recursively follow lambda transitions
					if (!visitedStates.has(toId)) {
						finalStatus =
							DFAConverter.generateLabelsTableRec(t.getToState(), labelsTable, visitedStates) ||
							finalStatus;
					}
				} else {
					if (labelsTable.has(label)) {
						labelsTable.get(label).push(toId);
					} else {
						labelsTable.set(label, [toId]);
					}
				}
			}
		});
		return finalStatus;
	}

	static randomPoint(editor) {
		// get a random point on the canvas
		return new Point(
			Math.floor(Math.random() * (editor.canvas.width - 100)) + 50,
			Math.floor(Math.random() * (editor.canvas.height - 100)) + 50
		);
	}

	static isApplicable() {
		return activeEnvironment.getType() === "finite";
	}
}
