class RemoveUnreachableStates {
	constructor() {}

	static action(environment) {
		const automaton = environment.getEditor().getAutomaton();

		if (automaton.hasInitialState()) {
			const unreachable = automaton.getUnreachableStates();
			unreachable.forEach((state) => {
				automaton.removeState(state);
			});
			environment.getEditor().draw();
		} else {
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
		}
	}
}
