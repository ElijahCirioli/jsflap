class Transition {
	constructor(fromState, toState) {
		this.from = fromState;
		this.to = toState;
		this.label = "";
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

	draw(context) {
		context.lineWidth = 2;
		context.strokeStyle = "#2c304d";
		context.beginPath();
		context.moveTo(this.from.pos.x, this.from.pos.y);
		context.lineTo(this.to.pos.x, this.to.pos.y);
		context.stroke();
	}
}
