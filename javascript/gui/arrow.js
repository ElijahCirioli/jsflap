class Arrow {
	static arrowLength = 10;
	static arrowWidth = 6;

	static scalePoint(p, scale, offset, canvas) {
		const inverseScale = 1 / scale;
		const center = new Point(canvas.width / 2, canvas.height / 2);
		const minBounds = new Point(center.x * (1 - inverseScale), center.y * (1 - inverseScale));
		return new Point(scale * (p.x - minBounds.x) + offset.x, scale * (p.y - minBounds.y) + offset.y);
	}

	static drawArrowTip(canvas, tip, angle, scale, offset, color) {
		const context = canvas.getContext("2d");

		// calculate the vertices
		const arrowAngle = Math.atan2(this.arrowWidth, this.arrowLength);
		const arrowHypotenuse = new Point(this.arrowWidth, this.arrowLength).magnitude();
		const reverseAngle = angle - Math.PI;
		const point1 = new Point(arrowHypotenuse * Math.cos(reverseAngle + arrowAngle), arrowHypotenuse * Math.sin(reverseAngle + arrowAngle));
		point1.add(tip);
		const point2 = new Point(arrowHypotenuse * Math.cos(reverseAngle - arrowAngle), arrowHypotenuse * Math.sin(reverseAngle - arrowAngle));
		point2.add(tip);

		// adjust points to camera
		const adjTip = Arrow.scalePoint(tip, scale, offset, canvas);
		const adjPoint1 = Arrow.scalePoint(point1, scale, offset, canvas);
		const adjPoint2 = Arrow.scalePoint(point2, scale, offset, canvas);

		// draw the tip
		context.fillStyle = color;
		context.beginPath();
		context.moveTo(adjTip.x, adjTip.y);
		context.lineTo(adjPoint1.x, adjPoint1.y);
		context.lineTo(adjPoint2.x, adjPoint2.y);
		context.lineTo(adjTip.x, adjTip.y);
		context.fill();
	}

	static drawArrow(canvas, start, end, centerStart, centerEnd, scale, offset, color) {
		const context = canvas.getContext("2d");

		// calculate constants
		const length = start.distance(end);
		const shortenedEnd = end.normalizeEndPoint(start, Math.max(length - this.arrowLength, 0));
		const angle = Math.atan2(end.y - start.y, end.x - start.x);

		// adjust points to camera
		const adjStart = Arrow.scalePoint(start, scale, offset, canvas);
		const adjEnd = Arrow.scalePoint(shortenedEnd, scale, offset, canvas);

		// draw line
		context.lineWidth = 2 * scale;
		context.strokeStyle = color;
		context.beginPath();
		context.moveTo(adjStart.x, adjStart.y);
		context.lineTo(adjEnd.x, adjEnd.y);
		context.stroke();

		// draw tip
		this.drawArrowTip(canvas, end, angle, scale, offset, color);

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

	static drawCurvedArrow(canvas, start, end, scale, offset, color) {
		const context = canvas.getContext("2d");

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

		// adjust points to camera
		const adjStart = Arrow.scalePoint(start, scale, offset, canvas);
		const adjEnd = Arrow.scalePoint(lineEnd, scale, offset, canvas);
		const adjControl1 = Arrow.scalePoint(control1, scale, offset, canvas);
		const adjControl2 = Arrow.scalePoint(control2, scale, offset, canvas);

		// draw line
		context.lineWidth = 2 * scale;
		context.strokeStyle = color;
		context.beginPath();
		context.moveTo(adjStart.x, adjStart.y);
		context.bezierCurveTo(adjControl1.x, adjControl1.y, adjControl2.x, adjControl2.y, adjEnd.x, adjEnd.y);
		context.stroke();

		// draw tip
		const tipAngle = Math.atan2(end.y - start.y, end.x - start.x) - curveAngle;
		this.drawArrowTip(canvas, end, tipAngle, scale, offset, color);

		// return a point above the apex of the curve
		const orthogonalAngle = Math.atan2(end.y - start.y, end.x - start.x) + Math.PI / 2;
		const labelOffset = start.x > end.x ? 17 : -3;
		return new Point(
			(control1.x + control2.x) / 2 + Math.cos(orthogonalAngle) * labelOffset,
			(control1.y + control2.y) / 2 + Math.sin(orthogonalAngle) * labelOffset
		);
	}

	static drawSelfArrow(canvas, start, end, center, scale, offset, color) {
		const context = canvas.getContext("2d");

		// calculate constants
		const inset = 5;
		const height = 50;
		const tipAngle = Math.atan2(height, inset);

		// calculate bezier points
		const control1 = new Point(start.x + inset, start.y - height);
		const control2 = new Point(end.x - inset, end.y - height);
		const endPoint = new Point(-Math.cos(tipAngle) * this.arrowLength, -Math.sin(tipAngle) * this.arrowLength);
		endPoint.add(end);

		// adjust points to camera
		const adjStart = Arrow.scalePoint(start, scale, offset, canvas);
		const adjEnd = Arrow.scalePoint(endPoint, scale, offset, canvas);
		const adjControl1 = Arrow.scalePoint(control1, scale, offset, canvas);
		const adjControl2 = Arrow.scalePoint(control2, scale, offset, canvas);

		// draw line
		context.lineWidth = 2 * scale;
		context.strokeStyle = color;
		context.beginPath();
		context.moveTo(adjStart.x, adjStart.y);
		context.bezierCurveTo(adjControl1.x, adjControl1.y, adjControl2.x, adjControl2.y, adjEnd.x, adjEnd.y);
		context.stroke();

		// draw tip
		this.drawArrowTip(canvas, end, tipAngle, scale, offset, color);

		// return a point above the apex of the curve
		const labelOffset = 10;
		const labelOffsetX = 2;
		return new Point(center.x + labelOffsetX, start.y - height - labelOffset);
	}
}
