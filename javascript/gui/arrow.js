class Arrow {
	static arrowLength = 10;
	static arrowWidth = 6;

	static scalePoint(p, scale, offset, canvas) {
		// scale a point to camera space

		const inverseScale = 1 / scale;
		const center = new Point(canvas.width / 2, canvas.height / 2);
		const minBounds = new Point(center.x * (1 - inverseScale), center.y * (1 - inverseScale));
		return new Point(scale * (p.x - minBounds.x) + offset.x, scale * (p.y - minBounds.y) + offset.y);
	}

	static calculateTipPoints(cache, tip, angle) {
		// calculate the vertices
		const arrowAngle = Math.atan2(this.arrowWidth, this.arrowLength);
		const arrowHypotenuse = new Point(this.arrowWidth, this.arrowLength).magnitude();
		const reverseAngle = angle - Math.PI;
		cache.point1 = new Point(arrowHypotenuse * Math.cos(reverseAngle + arrowAngle), arrowHypotenuse * Math.sin(reverseAngle + arrowAngle));
		cache.point1.add(tip);
		cache.point2 = new Point(arrowHypotenuse * Math.cos(reverseAngle - arrowAngle), arrowHypotenuse * Math.sin(reverseAngle - arrowAngle));
		cache.point2.add(tip);
		cache.tip = tip;
	}

	static drawArrowTip(canvas, cache, scale, offset, color) {
		const context = canvas.getContext("2d");

		// adjust points to camera
		const adjTip = Arrow.scalePoint(cache.tip, scale, offset, canvas);
		const adjPoint1 = Arrow.scalePoint(cache.point1, scale, offset, canvas);
		const adjPoint2 = Arrow.scalePoint(cache.point2, scale, offset, canvas);

		// draw the tip
		context.fillStyle = color;
		context.beginPath();
		context.moveTo(adjTip.x, adjTip.y);
		context.lineTo(adjPoint1.x, adjPoint1.y);
		context.lineTo(adjPoint2.x, adjPoint2.y);
		context.lineTo(adjTip.x, adjTip.y);
		context.fill();
	}

	static drawArrow(canvas, cache, calculate, scale, offset, height, color) {
		const context = canvas.getContext("2d");

		if (calculate) {
			// calculate constants
			const length = cache.start.distance(cache.end);
			cache.shortenedEnd = cache.end.normalizeEndPoint(cache.start, Math.max(length - this.arrowLength, 0));

			// calculate the tip points
			const angle = Math.atan2(cache.end.y - cache.start.y, cache.end.x - cache.start.x);
			Arrow.calculateTipPoints(cache, cache.end, angle);

			// calculate a point above the middle of the arrow
			const multiplier = Math.sign(cache.start.x - cache.end.x);
			const center = new Point((cache.from.x + cache.to.x) / 2, (cache.from.y + cache.to.y) / 2);
			const orthogonalAngle = angle + Math.PI / 2;

			const labelOffset = height + 2.5;
			cache.labelPoint = new Point(
				center.x + Math.cos(orthogonalAngle) * labelOffset * multiplier,
				center.y + Math.sin(orthogonalAngle) * labelOffset * multiplier
			);
		}

		// adjust points to camera
		const adjStart = Arrow.scalePoint(cache.start, scale, offset, canvas);
		const adjEnd = Arrow.scalePoint(cache.shortenedEnd, scale, offset, canvas);

		// draw line
		context.lineWidth = 2 * scale;
		context.strokeStyle = color;
		context.beginPath();
		context.moveTo(adjStart.x, adjStart.y);
		context.lineTo(adjEnd.x, adjEnd.y);
		context.stroke();

		// draw tip
		this.drawArrowTip(canvas, cache, scale, offset, color);

		return cache.labelPoint;
	}

	static drawCurvedArrow(canvas, cache, calculate, scale, offset, height, color) {
		const context = canvas.getContext("2d");

		if (calculate) {
			// calculate constants
			const curveAngle = 0.4;
			const curveAmount = Math.min(50, cache.start.distance(cache.end) / 2 - 5);

			// calculate bezier points
			const angle1 = Math.atan2(cache.end.y - cache.start.y, cache.end.x - cache.start.x) + curveAngle;
			const angle2 = Math.atan2(cache.start.y - cache.end.y, cache.start.x - cache.end.x) - curveAngle;
			cache.control1 = new Point(Math.cos(angle1) * curveAmount, Math.sin(angle1) * curveAmount);
			cache.control1.add(cache.start);
			cache.control2 = new Point(Math.cos(angle2) * curveAmount, Math.sin(angle2) * curveAmount);
			cache.control2.add(cache.end);
			cache.lineEnd = new Point(cache.end.x + Arrow.arrowLength * Math.cos(angle2), cache.end.y + Arrow.arrowLength * Math.sin(angle2));

			// calculate the tip points
			const tipAngle = Math.atan2(cache.end.y - cache.start.y, cache.end.x - cache.start.x) - curveAngle;
			Arrow.calculateTipPoints(cache, cache.end, tipAngle);

			// calculate a point above the apex of the curve
			const orthogonalAngle = Math.atan2(cache.end.y - cache.start.y, cache.end.x - cache.start.x) + Math.PI / 2;
			const labelOffset = cache.start.x > cache.end.x ? height - 2 : -2;
			cache.labelPoint = new Point(
				(cache.control1.x + cache.control2.x) / 2 + Math.cos(orthogonalAngle) * labelOffset,
				(cache.control1.y + cache.control2.y) / 2 + Math.sin(orthogonalAngle) * labelOffset
			);
		}

		// adjust points to camera
		const adjStart = Arrow.scalePoint(cache.start, scale, offset, canvas);
		const adjEnd = Arrow.scalePoint(cache.lineEnd, scale, offset, canvas);
		const adjControl1 = Arrow.scalePoint(cache.control1, scale, offset, canvas);
		const adjControl2 = Arrow.scalePoint(cache.control2, scale, offset, canvas);

		// draw line
		context.lineWidth = 2 * scale;
		context.strokeStyle = color;
		context.beginPath();
		context.moveTo(adjStart.x, adjStart.y);
		context.bezierCurveTo(adjControl1.x, adjControl1.y, adjControl2.x, adjControl2.y, adjEnd.x, adjEnd.y);
		context.stroke();

		// draw tip
		this.drawArrowTip(canvas, cache, scale, offset, color);

		return cache.labelPoint;
	}

	static drawSelfArrow(canvas, cache, calculate, scale, offset, labelHeight, color) {
		const context = canvas.getContext("2d");

		if (calculate) {
			// calculate constants
			const inset = 5;
			const height = 50;
			const tipAngle = Math.atan2(height, inset);

			// calculate bezier points
			cache.control1 = new Point(cache.start.x + inset, cache.start.y - height);
			cache.control2 = new Point(cache.end.x - inset, cache.end.y - height);
			cache.endPoint = new Point(-Math.cos(tipAngle) * this.arrowLength, -Math.sin(tipAngle) * this.arrowLength);
			cache.endPoint.add(cache.end);

			// calculate a point above the apex of the curve
			const labelOffset = labelHeight - 9;
			const labelOffsetX = 0;
			cache.labelPoint = new Point(cache.from.x + labelOffsetX, cache.start.y - height - labelOffset);

			// calculate the tip points
			Arrow.calculateTipPoints(cache, cache.end, tipAngle);
		}

		// adjust points to camera
		const adjStart = Arrow.scalePoint(cache.start, scale, offset, canvas);
		const adjEnd = Arrow.scalePoint(cache.endPoint, scale, offset, canvas);
		const adjControl1 = Arrow.scalePoint(cache.control1, scale, offset, canvas);
		const adjControl2 = Arrow.scalePoint(cache.control2, scale, offset, canvas);

		// draw line
		context.lineWidth = 2 * scale;
		context.strokeStyle = color;
		context.beginPath();
		context.moveTo(adjStart.x, adjStart.y);
		context.bezierCurveTo(adjControl1.x, adjControl1.y, adjControl2.x, adjControl2.y, adjEnd.x, adjEnd.y);
		context.stroke();

		// draw tip
		this.drawArrowTip(canvas, cache, scale, offset, color);

		return cache.labelPoint;
	}
}
