class Transition {
	constructor(fromState, toState) {
		this.from = fromState;
		this.to = toState;
		this.label = "";
		this.color = "#2c304d";
	}

	getToState() {
		return this.to;
	}

	getFromState() {
		return this.from;
	}

	getLabel() {
		return this.label;
	}

	setLabel(newLabel) {
		this.label = newLabel;
	}

	setColor(newColor) {
		this.color = newColor;
	}

	equals(t) {
		return this.from === t.from && this.to === t.to && this.label === t.label;
	}

	draw(context) {
		if (this.to === this.from) {
			// self loop
		} else if (this.to.hasTransitionToState(this.from)) {
			// matched inverse transitions
			const startPos = this.from.radiusPoint(this.to.pos, Math.PI / 4, -1);
			const endPos = this.to.radiusPoint(this.from.pos, -Math.PI / 4, 0);
			Arrow.drawCurvedArrow(context, startPos, endPos, this.color);
		} else {
			// normal straight arrow
			const endPos = this.to.radiusPoint(this.from.pos, 0, -1);
			Arrow.drawArrow(context, this.from.pos, endPos, this.color);
		}
	}
}
