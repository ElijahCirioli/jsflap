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

		// get the alphabets
		const alphabet1 = new Set();
		dfa1.forEach((state) => {
			for (const item of state) {
				if (item[1] !== "trap") {
					alphabet1.add(item[0]);
				}
			}
		});
		const alphabet2 = new Set();
		dfa2.forEach((state) => {
			for (const item of state) {
				if (item[1] !== "trap") {
					alphabet2.add(item[0]);
				}
			}
		});

		const trapState = new Map();
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
			trapState.set(char, "trap");
		}
		// add trap state to both DFAs
		dfa1.set("trap", trapState);
		dfa2.set("trap", trapState);

		// this has an O(n^2) time complexity
		// It could be improved by turning visited into a union-find data structure
		const visited = new Set();
		const initialId = a1.getInitialState().getId() + "|" + a2.getInitialState().getId();
		const queue = [initialId];

		while (queue.length > 0) {
			const curr = queue.shift();
			if (!visited.has(curr)) {
				const p = curr.split("|")[0];
				const q = curr.split("|")[1];

				const distinguishable = EquivalenceTest.distinguishable(p, q, final1, final2);
				if (distinguishable) {
					EquivalenceTest.notEquivalentMessage(env1, env2);
					return;
				}

				for (const char of alphabet1) {
					const pToState = dfa1.get(p).get(char);
					const qToState = dfa2.get(q).get(char);
					queue.push(pToState + "|" + qToState);
				}

				visited.add(curr);
			}
		}

		EquivalenceTest.equivalentMessage(env1, env2);
	}

	static distinguishable(p, q, pFinalStates, qFinalStates) {
		const pIsFinal = EquivalenceTest.isFinal(p, pFinalStates);
		const qIsFinal = EquivalenceTest.isFinal(q, qFinalStates);
		return pIsFinal ? !qIsFinal : qIsFinal;
	}

	static isFinal(combinedState, finalStates) {
		for (const sub of combinedState.split("+")) {
			if (finalStates.has(sub)) {
				return true;
			}
		}
		return false;
	}

	static notEquivalentMessage(env1, env2) {
		env1.addPopupMessage(
			new PopupMessage(
				"Equivalence comparison",
				`Automata <u>${env1.getName()}</u> and <u>${env2.getName()}</u> are <strong>not</strong> equivalent.`,
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
				`Automata <u>${env1.getName()}</u> and <u>${env2.getName()}</u> are equivalent.`,
				() => {
					env1.removePopupMessages();
				},
				true
			)
		);
	}

	static isApplicable() {
		let numFinite = 0;
		for (const env of environments) {
			if (env.getType() === "finite") {
				numFinite++;
			}
		}
		return numFinite > 1;
	}
}
