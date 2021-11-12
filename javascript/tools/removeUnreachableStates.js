class RemoveUnreachableStates {
	constructor() {}

	static action(environment) {
		const automaton = environment.getEditor().getAutomaton();
		const unreachable = automaton.getUnreachableStates();
		unreachable.forEach((state) => {
			automaton.removeState(state);
		});
	}
}
