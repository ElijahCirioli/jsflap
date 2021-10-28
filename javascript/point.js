class Point {
	constructor(x, y) {
		this.x = x || 0;
		this.y = y || 0;
	}

	add(p) {
		this.x += p.x;
		this.y += p.y;
	}
}
