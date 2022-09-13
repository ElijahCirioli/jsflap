class TreeLayout {
	constructor() {}

	static action(environment) {
		const editor = environment.getEditor();
		if (!editor) {
			return;
		}
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

		// create queue and stack for BFS traversal
		const queue = TreeLayout.createTreeDataStructure(initial);
		const stack = queue.slice().reverse();

		// calculate the height required for each node
		stack.forEach((node) => {
			if (node.children.length === 0) {
				// if a node has no children then set base height
				node.height = 100;
			} else {
				// a node's height is the sum of the height of its children
				node.height = node.children.reduce((sum, child) => {
					return sum + child.height;
				}, 0);
			}
		});

		// position all the states
		initial.setPos(new Point(0, 0));
		queue.forEach((node) => {
			let yPos = node.state.getPos().y - node.height / 2;
			node.children.forEach((child) => {
				child.state.setPos(new Point(child.depth * 140, yPos + child.height / 2));
				yPos += child.height;
			});
		});

		// adjust positions to be in the center of their children
		stack
			.filter((node) => node.children.length > 0)
			.forEach((node) => {
				const yAvg =
					node.children.reduce((sum, child) => {
						return sum + child.state.getPos().y;
					}, 0) / node.children.length;

				node.state.getPos().y = yAvg;
			});

		if (editor.isAlignToGrid()) {
			AlignToGrid.action(environment);
		}
		editor.draw();
		editor.zoomFit();
		environment.updateHistory();
		editor.editorWrap.focus();
	}

	static createTreeDataStructure(initialState) {
		const head = { state: initialState, children: [], depth: 0 };
		const queue = [head];
		const resultQueue = [];
		const visited = new Set();
		visited.add(head.state.getId());

		// traverse the automaton in a breadth-first manner
		while (queue.length > 0) {
			const curr = queue.shift();
			resultQueue.push(curr);

			// look at every transition we can take
			curr.state.getTransitions().forEach((t) => {
				const toState = t.getToState();
				if (visited.has(toState.getId())) {
					return;
				}
				visited.add(toState.getId());

				const toNode = { state: toState, children: [], depth: curr.depth + 1 };

				curr.children.push(toNode);
				queue.push(toNode);
			});
		}

		return resultQueue;
	}
}
