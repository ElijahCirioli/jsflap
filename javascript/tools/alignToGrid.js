class AlignToGrid {
	constructor() {}

	static action(environment) {
		if (environment.getEditor() === undefined) {
			return;
		}
		environment.updateHistory();

		const automaton = environment.getEditor().getAutomaton();
		const selectedStates = environment.getEditor().getSelectedStates();

		if (selectedStates.size > 0) {
			selectedStates.forEach((s) => {
				s.getPos().alignToGrid();
			});
		} else {
			automaton.getStates().forEach((s) => {
				s.getPos().alignToGrid();
			});
		}

		environment.getEditor().draw();
		environment.updateHistory();
	}
}
