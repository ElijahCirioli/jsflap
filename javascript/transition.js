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

	equals(t) {
		return this.from === t.from && this.to === t.to && this.label === t.label;
	}

	draw(context) {
		const endPos = this.to.radiusPoint(this.from.pos);
		Transition.drawArrow(context, this.from.pos, endPos, this.color);
	}

	static drawArrow(context, start, end, color) {
		const arrowLength = 10;
		const arrowWidth = 6;

		// calculate arrow vertices
		const length = start.distance(end);
		const shortenedEnd = end.normalizeEndPoint(start, Math.max(length - arrowLength, 0));
		const displacement = new Point(end.x - start.x, end.y - start.y);
		const scaledSlopes = displacement.normalizeEndPoint(new Point(0, 0), arrowWidth);
		const pointLeft = new Point(shortenedEnd.x - scaledSlopes.y, shortenedEnd.y + scaledSlopes.x);
		const pointRight = new Point(shortenedEnd.x + scaledSlopes.y, shortenedEnd.y - scaledSlopes.x);

		// draw line
		context.lineWidth = 2;
		context.strokeStyle = color;
		context.beginPath();
		context.moveTo(start.x, start.y);
		context.lineTo(shortenedEnd.x, shortenedEnd.y);
		context.stroke();

		// draw tip
		context.fillStyle = color;
		context.beginPath();
		context.moveTo(shortenedEnd.x, shortenedEnd.y);
		context.lineTo(pointRight.x, pointRight.y);
		context.lineTo(end.x, end.y);
		context.lineTo(pointLeft.x, pointLeft.y);
		context.lineTo(shortenedEnd.x, shortenedEnd.y);
		context.fill();
	}
}
