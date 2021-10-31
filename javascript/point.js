class Point {
	constructor(x, y) {
		this.x = x || 0;
		this.y = y || 0;
	}

	add(p) {
		this.x += p.x;
		this.y += p.y;
	}

	subtract(p) {
		this.x -= p.x;
		this.y -= p.y;
	}

	clone() {
		return new Point(this.x, this.y);
	}

	equals(p) {
		return this.x === p.x && this.y === p.y;
	}

	distance(p) {
		return Math.sqrt(Math.pow(p.x - this.x, 2) + Math.pow(p.y - this.y, 2));
	}

	magnitude() {
		return this.distance(new Point(0, 0));
	}

	normalize(newLength) {
		const length = Math.max(this.magnitude(), 0.001);
		this.x *= newLength / length;
		this.y *= newLength / length;
	}

	normalizeEndPoint(start, newLength) {
		// avoid divide by zero
		const fullLength = Math.max(this.distance(start), 0.001);
		const shortenedEnd = new Point(
			start.x + (newLength * (this.x - start.x)) / fullLength,
			start.y + (newLength * (this.y - start.y)) / fullLength
		);
		return shortenedEnd;
	}

	static shortenedEndPoint(start, end, distance) {
		const fullLength = start.distance(end);
		const newLength = Math.max(fullLength - distance, 0);
		return end.normalizeEndPoint(start, newLength);
	}
}
