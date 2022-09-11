class ClipboardTools {
	constructor() {}

	static cut() {
		if (!activeEnvironment.hasEditor()) {
			return;
		}

		ClipboardTools.copy();
		const editor = activeEnvironment.getEditor();
		const automaton = editor.getAutomaton();
		const selectedStates = editor.getSelectedStates();
		const selectedTransitions = editor.getSelectedTransitions();

		selectedStates.forEach((s) => {
			automaton.removeState(s);
		});
		selectedTransitions.forEach((t) => {
			automaton.removeTransition(t);
		});

		activeEnvironment.testAllInputs(true);
		editor.draw();
	}

	static copy() {
		if (!activeEnvironment.hasEditor()) {
			return;
		}

		const editor = activeEnvironment.getEditor();
		const selectedStates = editor.getSelectedStates();
		const selectedTransitions = editor.getSelectedTransitions();

		if (selectedStates.size === 0) {
			return;
		}

		// get min x and y
		const minPos = new Point(Infinity, Infinity);
		selectedStates.forEach((s) => {
			const pos = s.getPos();
			minPos.x = Math.min(minPos.x, pos.x);
			minPos.y = Math.min(minPos.y, pos.y);
		});

		// create data object
		const data = {
			pos: minPos,
			id: activeEnvironment.getId(),
			type: activeEnvironment.getType(),
			states: [],
			transitions: [],
		};

		// copy selected states
		selectedStates.forEach((s) => {
			const pos = s.getPos().clone();
			pos.subtract(minPos);
			data.states.push({
				pos: pos,
				name: s.getName(),
				id: s.getId(),
				final: s.isFinal(),
				initial: s.isInitial(),
			});
		});

		// copy selected transitions
		selectedTransitions.forEach((t) => {
			data.transitions.push({
				from: t.getFromState().getId(),
				to: t.getToState().getId(),
				labels: t.getLabels(),
			});
		});

		clipboard = data;
	}

	static paste() {
		// make sure data exists to be pasted
		if (clipboard === undefined || !activeEnvironment.hasEditor()) {
			return;
		}

		// make sure we're pasting the right type of data
		if (activeEnvironment.getType() !== clipboard.type) {
			return;
		}

		activeEnvironment.respondToTriggers = false;
		const editor = activeEnvironment.getEditor();
		editor.unselectAllStates();
		editor.unselectAllTransitions();
		let startPoint = clipboard.pos;
		if (editor.pasteMousePos) {
			startPoint = editor.pasteMousePos;
		}
		const elementMap = new Map();

		// paste states
		for (const s of clipboard.states) {
			const pos = s.pos.clone();
			pos.add(startPoint);
			const state = editor.createState(pos, false);
			FileParser.setStateName(state, s.name);
			if (s.final) {
				editor.getAutomaton().addFinalState(state);
			}
			if (s.initial && !editor.getAutomaton().hasInitialState()) {
				editor.getAutomaton().setInitialState(state);
			}
			editor.selectState(state);
			elementMap.set(s.id, state.getElement());
		}

		// paste transitions
		for (const t of clipboard.transitions) {
			const fromState = elementMap.get(t.from);
			const toState = elementMap.get(t.to);
			if (fromState && toState) {
				editor.startTransition(fromState);
				const transitionObj = editor.endTransition(toState, false);
				for (const label of t.labels) {
					if (clipboard.type === "finite") {
						transitionObj.addLabel(label);
					} else {
						const element = transitionObj.addTuple(editor, label);
						editor.selectTuple(label, element, transitionObj);
					}
				}
				editor.selectTransition(transitionObj);
			}
		}

		startPoint.add(new Point(20, 20));

		activeEnvironment.respondToTriggers = true;
		activeEnvironment.testAllInputs(true);
		editor.draw();
	}
}
