class CircleLayout {
	constructor() {}

	static action(environment) {
		const editor = environment.getEditor();
		if (!editor) {
			return;
		}
		const automaton = editor.getAutomaton();
		const states = automaton.getStates();
		if (states.size === 0) {
			return;
		}

		// sort the states by their distance from the initial state
		const initial = automaton.getInitialState() || states.values().next().value;
		TreeLayout.calculateDistances(automaton, initial);

		const orderedStates = [];
		states.forEach((s) => {
			orderedStates.push(s);
		});
		orderedStates.sort((a, b) => {
			return a.dist - b.dist;
		});

		// place them in a circle in the order of that distance
		const center = new Point(Math.round(editor.canvas.width / 2), Math.round(editor.canvas.height / 2));
		const radius = Math.min(center.x, center.y) - 50;
		const deltaAngle = (2 * Math.PI) / orderedStates.length;
		for (let i = 0; i < orderedStates.length; i++) {
			const angle = i * deltaAngle + Math.PI;
			const x = Math.round(radius * Math.cos(angle));
			const y = Math.round(radius * Math.sin(angle));
			orderedStates[i].setPos(new Point(x, y));
		}

		editor.draw();
		editor.zoomFit();
		environment.updateHistory();
		editor.editorWrap.focus();
	}
}
