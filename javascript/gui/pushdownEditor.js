class PushdownEditor extends Editor {
	constructor(parent, callback) {
		super(parent, callback);
		this.automaton = new PushdownAutomaton();
	}
}
