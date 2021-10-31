class Arrow {
	static arrowLength = 10;
	static arrowWidth = 6;

	static drawArrowTip(context, tip, angle, color) {
		// calculate the vertices
		const arrowAngle = Math.atan2(this.arrowWidth, this.arrowLength);
		const arrowHypotenuse = new Point(this.arrowWidth, this.arrowLength).magnitude();
		const reverseAngle = angle - Math.PI;
		const point1 = new Point(arrowHypotenuse * Math.cos(reverseAngle + arrowAngle), arrowHypotenuse * Math.sin(reverseAngle + arrowAngle));
		point1.add(tip);
		const point2 = new Point(arrowHypotenuse * Math.cos(reverseAngle - arrowAngle), arrowHypotenuse * Math.sin(reverseAngle - arrowAngle));
		point2.add(tip);

		// draw the tip
		context.fillStyle = color;
		context.beginPath();
		context.moveTo(tip.x, tip.y);
		context.lineTo(point1.x, point1.y);
		context.lineTo(point2.x, point2.y);
		context.lineTo(tip.x, tip.y);
		context.fill();
	}

	static drawArrow(context, start, end, color) {
		// calculate constants
		const length = start.distance(end);
		const shortenedEnd = end.normalizeEndPoint(start, Math.max(length - this.arrowLength, 0));
		const angle = Math.atan2(end.y - start.y, end.x - start.x);

		// draw line
		context.lineWidth = 2;
		context.strokeStyle = color;
		context.beginPath();
		context.moveTo(start.x, start.y);
		context.lineTo(shortenedEnd.x, shortenedEnd.y);
		context.stroke();

		// draw tip
		this.drawArrowTip(context, end, angle, color);
	}

	static drawCurvedArrow(context, start, end, color) {
		// calculate constants
		const curveAngle = 0.4;
		const curveAmount = Math.min(50, start.distance(end) / 2 - 5);

		// calculate bezier points
		const angle1 = Math.atan2(end.y - start.y, end.x - start.x) + curveAngle;
		const angle2 = Math.atan2(start.y - end.y, start.x - end.x) - curveAngle;
		const control1 = new Point(Math.cos(angle1) * curveAmount, Math.sin(angle1) * curveAmount);
		control1.add(start);
		const control2 = new Point(Math.cos(angle2) * curveAmount, Math.sin(angle2) * curveAmount);
		control2.add(end);
		const lineEnd = new Point(end.x + Arrow.arrowLength * Math.cos(angle2), end.y + Arrow.arrowLength * Math.sin(angle2));

		// draw line
		context.lineWidth = 2;
		context.strokeStyle = color;
		context.beginPath();
		context.moveTo(start.x, start.y);
		context.bezierCurveTo(control1.x, control1.y, control2.x, control2.y, lineEnd.x, lineEnd.y);
		context.stroke();

		// draw tip
		const tipAngle = Math.atan2(end.y - start.y, end.x - start.x) - curveAngle;
		this.drawArrowTip(context, end, tipAngle, color);
	}
}
