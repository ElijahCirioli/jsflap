class PushdownAutomaton extends Automaton {
	constructor() {
		super();
	}

	addState(pos, name, element, initial) {
		const id = this.getNextId();
		const state = new PushdownState(pos, id, name, element);
		this.states.set(id, state);
		if (initial) {
			this.setInitialState(state);
		}
		return state;
	}

	addTransition(fromState, toState, tuple, element) {
		const transition = fromState.addTransition(toState, tuple);
		if (element) {
			transition.addElement(element);
		}
		return transition;
	}
}
