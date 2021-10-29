class State {
	constructor(pos, id, name, element) {
		this.pos = pos;
		this.id = id;
		this.name = name;
		this.element = element;
		this.isFinal = false;
		this.isInitial = false;
		this.radius = 26;
		this.transitions = new Map();
		element.attr("id", id);
	}

	setName(newName) {
		this.name = newName;
	}

	getName() {
		return this.name;
	}

	getElement() {
		return this.element;
	}

	isFinal() {
		return this.isFinal;
	}

	setFinal(final) {
		this.isFinal = final;
	}

	isInitial() {
		return this.isInitial;
	}

	setInitial(initial) {
		this.isInitial = initial;
	}

	getPos() {
		return this.pos;
	}

	addTransition(transition) {
		const label = transition.getLabel();
		// check if this label is in the hashmap
		if (this.transitions.has(label)) {
			// make sure an identical transition doesn't already exist
			for (const t of this.transitions.get(label)) {
				if (t.equals(transition)) {
					return;
				}
			}
			this.transitions.get(label).push(transition);
		} else {
			this.transitions.set(label, [transition]);
		}
	}

	getTransitions() {
		return this.transitions;
	}

	clearTransitions() {
		this.transitions = new Map();
	}

	radiusPoint(otherPoint) {
		return Point.shortenedEndPoint(otherPoint, this.pos, this.radius);
	}

	draw() {
		const elementPos = new Point(this.pos.x - this.radius, this.pos.y - this.radius);
		this.element.css("top", elementPos.y + "px");
		this.element.css("left", elementPos.x + "px");
	}
}
