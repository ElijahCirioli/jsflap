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

	static drawArrow(context, start, end, centerStart, centerEnd, color) {
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

		// return a point above the middle of the arrow
		const multiplier = Math.sign(start.x - end.x);
		const center = new Point((centerStart.x + centerEnd.x) / 2, (centerStart.y + centerEnd.y) / 2);
		const orthogonalAngle = angle + Math.PI / 2;
		const labelOffset = 22;
		return new Point(
			center.x + Math.cos(orthogonalAngle) * labelOffset * multiplier,
			center.y + Math.sin(orthogonalAngle) * labelOffset * multiplier
		);
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

		// return a point above the apex of the curve
		const orthogonalAngle = Math.atan2(end.y - start.y, end.x - start.x) + Math.PI / 2;
		const labelOffset = start.x > end.x ? 17 : -3;
		return new Point(
			(control1.x + control2.x) / 2 + Math.cos(orthogonalAngle) * labelOffset,
			(control1.y + control2.y) / 2 + Math.sin(orthogonalAngle) * labelOffset
		);
	}

	static drawSelfArrow(context, start, end, center, color) {
		// calculate constants
		const inset = 5;
		const height = 50;
		const tipAngle = Math.atan2(height, inset);

		// calculate bezier points
		const control1 = new Point(start.x + inset, start.y - height);
		const control2 = new Point(end.x - inset, end.y - height);
		const endPoint = new Point(-Math.cos(tipAngle) * this.arrowLength, -Math.sin(tipAngle) * this.arrowLength);
		endPoint.add(end);

		// draw line
		context.lineWidth = 2;
		context.strokeStyle = color;
		context.beginPath();
		context.moveTo(start.x, start.y);
		context.bezierCurveTo(control1.x, control1.y, control2.x, control2.y, endPoint.x, endPoint.y);
		context.stroke();

		// draw tip
		this.drawArrowTip(context, end, tipAngle, color);

		// return a point above the apex of the curve
		const labelOffset = 10;
		const labelOffsetX = 2;
		return new Point(center.x + labelOffsetX, start.y - height - labelOffset);
	}
}
