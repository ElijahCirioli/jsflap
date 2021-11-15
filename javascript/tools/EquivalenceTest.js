class EquivalenceTest {
	constructor() {}

	static action(env1, env2) {
		const a1 = env1.getEditor().getAutomaton();
		const a2 = env2.getEditor().getAutomaton();

		if (!a2.hasInitialState() || !a1.hasInitialState()) {
			env1.addPopupMessage(
				new PopupMessage(
					"Error",
					"At least one automaton does not have an initial state.",
					() => {
						env1.removePopupMessages();
					},
					true
				)
			);
			return;
		}

		const tables1 = DFAConverter.NFAtoDFATable(a1);
		const dfa1 = tables1.DFA;
		const final1 = tables1.finalStates;

		const tables2 = DFAConverter.NFAtoDFATable(a2);
		const dfa2 = tables2.DFA;
		const final2 = tables2.finalStates;

		// get the alphabets and remove trap transitions
		const alphabet1 = new Set();
		dfa1.forEach((state) => {
			for (const item of state) {
				if (item[1] === "trap") {
					state.delete(item[0]);
				} else {
					alphabet1.add(item[0]);
				}
			}
		});
		const alphabet2 = new Set();
		dfa2.forEach((state) => {
			for (const item of state) {
				if (item[1] === "trap") {
					state.delete(item[0]);
				} else {
					alphabet2.add(item[0]);
				}
			}
		});

		// make sure they have the same alphabet
		for (const char of alphabet1) {
			if (!alphabet2.has(char)) {
				EquivalenceTest.notEquivalentMessage(env1, env2);
				return;
			}
		}
		for (const char of alphabet2) {
			if (!alphabet1.has(char)) {
				EquivalenceTest.notEquivalentMessage(env1, env2);
				return;
			}
		}

		// run the table-filling algorithm
		// this is inefficient so it would be good to replace with the Hopcroft-Karp Algorithm

		// create the table of predecessor states
		const predecessorStates = new Map();
		for (const p of dfa1) {
			for (const q of dfa2) {
				const combinedId = p[0] + "|" + q[0];
				predecessorStates.set(combinedId, new Set());
			}
		}
		for (const p of dfa1) {
			for (const q of dfa2) {
				alphabet1.forEach((char) => {
					if (q[1].has(char) && p[1].has(char)) {
						const tuple = { p: p[0], q: q[0], label: char };
						const combinedId = p[1].get(char) + "|" + q[1].get(char);
						predecessorStates.get(combinedId).add(tuple);
					}
				});
			}
		}

		const n = p.size + q.size;
		const queue = [];

		console.log(predecessorStates);
	}

	static notEquivalentMessage(env1, env2) {
		env1.addPopupMessage(
			new PopupMessage(
				"Equivalence comparison",
				`Automata ${env1.getName()} and ${env2.getName()} are not equivalent.`,
				() => {
					env1.removePopupMessages();
				},
				true
			)
		);
	}

	static equivalentMessage(env1, env2) {
		env1.addPopupMessage(
			new PopupMessage(
				"Equivalence comparison",
				`Automata ${env1.getName()} and ${env2.getName()} are equivalent.`,
				() => {
					env1.removePopupMessages();
				},
				true
			)
		);
	}
}
