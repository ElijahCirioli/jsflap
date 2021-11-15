class TreeLayout {
	constructor() {}

	static action(environment) {
		const editor = environment.getEditor();
		const automaton = editor.getAutomaton();

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
		}

		const initial = automaton.getInitialState();
		TreeLayout.calculateDistances(automaton, initial);

		// put the states into distance layers
		const distMap = new Map();
		automaton.getStates().forEach((s) => {
			// ignore states that are unreachable
			if (s.dist !== Infinity) {
				if (distMap.has(s.dist)) {
					distMap.get(s.dist).push(s);
				} else {
					distMap.set(s.dist, [s]);
				}
			}
		});

		// draw each layer
		for (const layer of distMap) {
			const index = layer[0];
			const states = layer[1];
			const x = Math.round((index * (editor.canvas.width - 150)) / distMap.size) + 75;
			const ratio = editor.canvas.height / (states.length + 1);
			for (let i = 0; i < states.length; i++) {
				const y = Math.round((i + 1) * ratio);
				states[i].setPos(new Point(x, y));
			}
		}

		editor.draw();
		editor.zoomFit();
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
