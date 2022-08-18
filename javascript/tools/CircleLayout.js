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
		CircleLayout.calculateDistances(automaton, initial);

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

	static calculateDistances(automaton, initial) {
		// BFS to calculate minimum distances from initial state

		automaton.getStates().forEach((s) => {
			s.dist = Infinity;
		});
		initial.dist = 0;

		const queue = [initial];
		const visited = new Set();

		while (queue.length > 0) {
			const state = queue.shift();
			visited.add(state.getId());
			state.getTransitions().forEach((t) => {
				const toState = t.getToState();
				toState.dist = Math.min(toState.dist, state.dist + 1);
				if (!visited.has(toState.getId())) {
					queue.push(toState);
				}
			});
		}
	}
}
