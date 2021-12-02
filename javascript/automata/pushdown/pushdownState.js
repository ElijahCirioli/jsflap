class PushdownState extends State {
	constructor(pos, id, name, element) {
		super(pos, id, name, element);
	}

	addTransition(toState, tuple) {
		// check if this toState is in the hashmap
		if (this.transitions.has(toState.getId())) {
			// add the label to the set
			this.transitions.get(toState.getId()).addLabel(tuple);
			return this.transitions.get(toState.getId());
		} else {
			// add the toState to the set
			const t = new PushdownTransition(this, toState, tuple);
			this.transitions.set(toState.getId(), t);
			return t;
		}
	}
}
