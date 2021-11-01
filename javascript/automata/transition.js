class Transition {
	constructor(fromState, toState, element) {
		this.from = fromState;
		this.to = toState;
		this.label = "";
		this.color = "#2c304d";
		this.preview = false;
		this.id = fromState.getId() + toState.getId();
		if (element) {
			this.element = element;
			this.element.attr("id", this.id);
			this.element.attr("name", this.id);
		}
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

	makePreview() {
		this.preview = true;
		this.color = "rgba(139, 138, 150, 0.5)";
	}

	isPreview() {
		return this.preview;
	}

	equals(t) {
		return this.from === t.from && this.to === t.to && this.label === t.label;
	}

	draw(context) {
		let labelPoint;
		if (this.to === this.from) {
			// self loop
			const abovePoint = this.from.pos.clone();
			abovePoint.subtract(new Point(0, 100));
			const startPos = this.from.radiusPoint(abovePoint, -Math.PI / 5, -1);
			const endPos = this.from.radiusPoint(abovePoint, Math.PI / 5, 0);
			labelPoint = Arrow.drawSelfArrow(context, startPos, endPos, this.from.pos, this.color);
		} else if (this.to.hasTransitionToState(this.from)) {
			// matched inverse transitions
			const startPos = this.from.radiusPoint(this.to.pos, Math.PI / 4, -1);
			const endPos = this.to.radiusPoint(this.from.pos, -Math.PI / 4, 0);
			labelPoint = Arrow.drawCurvedArrow(context, startPos, endPos, this.color);
		} else {
			// normal straight arrow
			const endPos = this.to.radiusPoint(this.from.pos, 0, 0);
			labelPoint = Arrow.drawArrow(context, this.from.pos, endPos, this.from.pos, this.to.pos, this.color);
		}

		if (this.element) {
			context.fillStyle = "red";
			context.beginPath();
			context.arc(labelPoint.x, labelPoint.y, 3, 0, 7);
			context.fill();

			this.moveLabel(labelPoint);
		}
	}

	moveLabel(pos) {
		const fromPos = this.from.getPos();
		const toPos = this.to.getPos();
		const width = this.element.width();
		const height = this.element.width();

		let angle = Math.atan2(toPos.y - fromPos.y, toPos.x - fromPos.x);
		if (fromPos.x > toPos.x) {
			angle += Math.PI;
		}

		const top = pos.y - (Math.sin(angle) * height) / 2;
		const left = pos.x - (Math.cos(angle) * width) / 2;

		this.element.css("left", left + "px");
		this.element.css("top", top + "px");
		this.element.css("transform", `rotate(${angle}rad)`);
	}
}
