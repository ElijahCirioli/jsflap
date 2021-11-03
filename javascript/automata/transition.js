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

	getLabels() {
		return this.labels;
	}

	addLabel(label) {
		this.labels.add(label);
	}

	removeLabel(label) {
		this.labels.delete(label);
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

	draw(context) {
		let labelPoint;
		if (this.to === this.from) {
			// self loop
			const abovePoint = this.from.getPos().clone();
			abovePoint.subtract(new Point(0, 100));
			const startPos = this.from.radiusPoint(abovePoint, -Math.PI / 5, -1);
			const endPos = this.from.radiusPoint(abovePoint, Math.PI / 5, 0);
			labelPoint = Arrow.drawSelfArrow(context, startPos, endPos, this.from.getPos(), this.color);
		} else if (this.to.hasTransitionToState(this.from)) {
			// matched inverse transitions
			const startPos = this.from.radiusPoint(this.to.getPos(), Math.PI / 4, -1);
			const endPos = this.to.radiusPoint(this.from.getPos(), -Math.PI / 4, 0);
			labelPoint = Arrow.drawCurvedArrow(context, startPos, endPos, this.color);
		} else {
			// normal straight arrow
			const endPos = this.to.radiusPoint(this.from.getPos(), 0, 0);
			labelPoint = Arrow.drawArrow(context, this.from.getPos(), endPos, this.from.getPos(), this.to.getPos(), this.color);
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
		str = str.substring(0, str.length - this.delimeter.length).trim();
		this.element.children(".label-input").val(str);
	}

	adjustLabeSize() {
		const text = this.element.children(".label-input").val();
		const sensor = $(`<p class="width-sensor">${text}</p>`);
		this.element.append(sensor);
		const textWidth = Math.round(sensor.width()) + 14;
		const distance = this.from.getPos().distance(this.to.getPos());
		this.element.children(".label-input").width(textWidth);
		sensor.remove();
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
