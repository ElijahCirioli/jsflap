class State {
	constructor(pos, id, name, element) {
		this.pos = pos;
		this.id = id;
		this.name = name;
		this.element = element;
		this.radius = 26;
	}

	setName(newName) {
		this.name = newName;
	}

	getName() {
		return this.name;
	}

	draw() {
		const elementPos = new Point(this.pos.x - this.radius, this.pos.y - this.radius);
		this.element.css("top", elementPos.y + "px");
		this.element.css("left", elementPos.x + "px");
	}
}
