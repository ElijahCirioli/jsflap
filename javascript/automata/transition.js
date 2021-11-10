class Transition {
	constructor(fromState, toState, label) {
		this.from = fromState;
		this.to = toState;
		this.labels = new Set();
		this.color = "#2c304d";
		this.preview = false;
		this.id = fromState.getId() + "-" + toState.getId();
		this.delimeter = ", ";
		if (label !== undefined) {
			this.labels.add(label);
		}
	}

	getToState() {
		return this.to;
	}

	getFromState() {
		return this.from;
	}

	getId() {
		return this.id;
	}

	getDelimeter() {
		return this.delimeter;
	}

	getLabels() {
		return this.labels;
	}

	addLabel(label) {
		this.labels.add(label);
	}

	removeLabel(label) {
		this.labels.delete(label);
	}

	hasLabel(label) {
		return this.labels.has(label);
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
		return this.from === t.from && this.to === t.to && this.labels.equals(t.labels);
	}

	addElement(element) {
		this.element = element;
		this.element.attr("id", this.id);
		this.element.attr("name", this.id);
	}

	getElement() {
		return this.element;
	}

	focusElement() {
		this.element.children(".label-input").focus();
		this.element.children(".label-input")[0].setSelectionRange(9999, 9999);
	}

	draw(canvas, scale, offset) {
		let labelPoint;

		if (this.to === this.from) {
			// self loop
			const abovePoint = this.from.getPos().clone();
			abovePoint.subtract(new Point(0, 100));
			const startPos = this.from.radiusPoint(abovePoint, -Math.PI / 5, -1);
			const endPos = this.from.radiusPoint(abovePoint, Math.PI / 5, 0);
			labelPoint = Arrow.drawSelfArrow(canvas, startPos, endPos, this.from.getPos(), scale, offset, this.color);
		} else if (this.to.hasTransitionToState(this.from)) {
			// matched inverse transitions
			const startPos = this.from.radiusPoint(this.to.getPos(), Math.PI / 4, -1);
			const endPos = this.to.radiusPoint(this.from.getPos(), -Math.PI / 4, 0);
			labelPoint = Arrow.drawCurvedArrow(canvas, startPos, endPos, scale, offset, this.color);
		} else {
			// normal straight arrow
			const endPos = this.to.radiusPoint(this.from.getPos(), 0, 0);
			labelPoint = Arrow.drawArrow(canvas, this.from.getPos(), endPos, this.from.getPos(), this.to.getPos(), scale, offset, this.color);
		}

		if (this.element) {
			this.drawLabel(labelPoint);
		}
	}

	selectLabelText() {
		const input = this.element.children(".label-input");
		const str = input.val();
		input[0].setSelectionRange(0, str.length);
	}

	generateLabelText() {
		let str = "";
		this.labels.forEach((char) => {
			if (char === "") {
				str += lambdaChar + this.delimeter;
			} else {
				str += char + this.delimeter;
			}
		});
		str = str.substring(0, str.length - this.delimeter.length);
		this.element.children(".label-input").val(str);
	}

	adjustLabeSize() {
		// this function was giving me some trouble so now it's way over-engineered
		const label = this.element.children(".label-input");

		const sensor = $(`<p class="width-sensor">${label.val()}</p>`);
		this.element.parent().append(sensor);
		const textWidth = Math.round(sensor.width()) + 14;

		const smallSensor = $(`<p class="small-width-sensor">${label.val()}</p>`);
		this.element.parent().append(smallSensor);
		const smallTextWidth = Math.round(smallSensor.width()) + 8;

		const distance = this.from.getPos().distance(this.to.getPos()) - 45;
		if (this.from !== this.to && textWidth > distance) {
			label.addClass("small-text-label");
			label.width(smallTextWidth);
		} else {
			label.removeClass("small-text-label");
			label.width(textWidth);
		}
		sensor.remove();
		smallSensor.remove();
	}

	drawLabel(pos) {
		this.generateLabelText();
		this.adjustLabeSize();

		const fromPos = this.from.getPos();
		const toPos = this.to.getPos();
		const width = this.element.outerWidth();

		let angle = Math.atan2(toPos.y - fromPos.y, toPos.x - fromPos.x);
		if (fromPos.x > toPos.x) {
			angle += Math.PI;
		}

		const top = pos.y - (Math.sin(angle) * width) / 2;
		const left = pos.x - (Math.cos(angle) * width) / 2;

		this.element.css("left", left + "px");
		this.element.css("top", top + "px");
		this.element.css("transform", `rotate(${angle}rad)`);
	}

	removeElement() {
		if (this.element) {
			this.element.remove();
		}
	}
}
