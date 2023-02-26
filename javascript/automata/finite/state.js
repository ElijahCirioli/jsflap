class State {
	constructor(pos, id, name, element) {
		this.pos = pos;
		this.id = id;
		this.name = name;
		this.element = element;
		this.final = false;
		this.initial = false;
		this.radius = 25;
		this.transitions = new Map();
		element.attr("id", id);
	}

	setName(newName) {
		this.name = newName;
		if (this.element.children(".state-name").text() !== newName) {
			this.element.children(".state-name").text(newName);
		}
		if (newName.length > 5) {
			this.element.children(".state-name").addClass("state-name-small");
		} else {
			this.element.children(".state-name").removeClass("state-name-small");
		}
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
		return this.final;
	}

	setFinal(final) {
		this.final = final;
		if (final) {
			this.element.addClass("final-state");
		} else {
			this.element.removeClass("final-state");
		}
	}

	isInitial() {
		return this.initial;
	}

	setInitial(initial) {
		this.initial = initial;
		if (initial) {
			// add the initial state arrow
			const scale = this.radius * 0.8;
			const p1 = new Point(0, 0);
			const p2 = new Point(0, 2 * scale);
			const p3 = new Point(scale, scale);
			const indicator = $(`
			<svg class="initial-state" width="${scale}" height="${2 * scale}">
				<polygon points="${p1.x},${p1.y} ${p2.x},${p2.y} ${p3.x},${p3.y}"/>
			</svg>`);
			indicator.css("top", this.radius - 1 - scale);
			this.element.append(indicator);
		} else {
			this.element.children(".initial-state").remove();
		}
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
					t.removeElement();
					this.transitions.delete(toState.getId());
				}
			} else {
				// remove all labels
				t.removeElement();
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
		// get a point on the line between this state and the otherPoint offset from this radius
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
		this.element.css("top", elementPos.y);
		this.element.css("left", elementPos.x);
	}
}
