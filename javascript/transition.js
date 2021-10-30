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
		if (this.to === this.from) {
			// self loop
		} else if (this.to.hasTransitionToState(this.from)) {
			// matched inverse transitions
			const startPos = this.from.radiusPoint(this.to.pos, Math.PI / 4);
			const endPos = this.to.radiusPoint(this.from.pos, -Math.PI / 4);
			this.drawCurvedArrow(context, startPos, endPos, this.color);
		} else {
			// normal straight arrow
			const endPos = this.to.radiusPoint(this.from.pos, 0);
			Transition.drawArrow(context, this.from.pos, endPos, this.color);
		}
	}

	drawCurvedArrow(context, start, end, color) {
		const arrowLength = 10;
		const arrowWidth = 6;
		const curveAngle = 0.4;
		const curveAmount = Math.min(60, start.distance(end) / 2 - 5);

		// calculate bezier points
		const angle1 = Math.atan2(end.y - start.y, end.x - start.x) + curveAngle;
		const angle2 = Math.atan2(start.y - end.y, start.x - end.x) - curveAngle;
		const control1 = new Point(Math.cos(angle1) * curveAmount, Math.sin(angle1) * curveAmount);
		control1.add(start);
		const control2 = new Point(Math.cos(angle2) * curveAmount, Math.sin(angle2) * curveAmount);
		control2.add(end);

		// draw line
		context.lineWidth = 2;
		context.strokeStyle = color;
		context.beginPath();
		context.moveTo(start.x, start.y);
		context.bezierCurveTo(control1.x, control1.y, control2.x, control2.y, end.x, end.y);
		context.stroke();
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
