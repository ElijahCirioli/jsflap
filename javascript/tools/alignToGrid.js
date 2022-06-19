class AlignToGrid {
	constructor() {}

	static action(environment) {
		const editor = environment.getEditor();
		if (editor === undefined) {
			return;
		}
		environment.updateHistory();

		const automaton = editor.getAutomaton();
		const selectedStates = editor.getSelectedStates();

		if (selectedStates.size > 0) {
			selectedStates.forEach((s) => {
				s.getPos().alignToGrid();
			});
		} else {
			automaton.getStates().forEach((s) => {
				s.getPos().alignToGrid();
			});
		}

		editor.draw();
		environment.updateHistory();
		editor.editorWrap.focus();
	}
}
