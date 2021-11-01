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

	getId() {
		return this.id;
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

	setPos(newPos) {
		this.pos = newPos;
	}

	addTransition(toState, label) {
		// check if this toState is in the hashmap
		if (this.transitions.has(toState.getId())) {
			// add the label to the set
			this.transitions.get(toState.getId()).addLabel(label);
			return this.transitions.get(toState.getId());
		} else {
			// add the toState to the set
			const t = new Transition(this, toState, label);
			this.transitions.set(toState.getId(), t);
			return t;
		}
	}

	removeTransition(toState, label) {
		// check if this toState is in the hashmap
		if (this.transitions.has(toState.getId())) {
			const t = this.getTransitionsToState(toState);
			if (label) {
				// delete the label from the set
				t.removeLabel(label);

				// delete the whole transition if all the labels are gone
				if (t.getLabels().size === 0) {
					this.transitions.delete(toState.getId());
				}
			} else {
				// remove all labels
				this.transitions.delete(toState.getId());
			}
		}
	}

	getTransitions() {
		return this.transitions;
	}

	getTransitionsToState(other) {
		return this.transitions.get(other.getId());
	}

	hasTransitionToState(other) {
		return this.transitions.has(other.getId());
	}

	clearTransitions() {
		this.transitions.forEach((t) => {
			t.removeElement();
		});
		this.transitions = new Map();
	}

	radiusPoint(otherPoint, offsetAngle, offsetRadius) {
		if (otherPoint.equals(this.pos)) {
			return otherPoint;
		}
		const angle = Math.atan2(otherPoint.y - this.pos.y, otherPoint.x - this.pos.x) + offsetAngle;
		const vector = new Point(Math.cos(angle), Math.sin(angle));
		vector.normalize(this.radius + offsetRadius);
		vector.add(this.pos);
		return vector;
	}

	draw() {
		const elementPos = new Point(this.pos.x - this.radius, this.pos.y - this.radius);
		this.element.css("top", elementPos.y + "px");
		this.element.css("left", elementPos.x + "px");
	}
}
