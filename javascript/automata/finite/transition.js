class Transition {
	constructor(fromState, toState, label) {
		this.from = fromState;
		this.to = toState;
		this.labels = new Set();
		this.color = "#2c304d";
		this.id = fromState.getId() + "-" + toState.getId();
		this.delimiter = ", ";
		this.cache = {};
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

	getDelimiter() {
		return this.delimiter;
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
		this.color = "rgba(139, 138, 150, 0.5)";
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

	clearCache() {
		this.cache = {};
	}

	draw(canvas, scale, offset, updateLabel) {
		let labelPoint;
		const height = this.element ? this.element.outerHeight() : 0;

		// see if the values need to be recalculated
		let needsCalculation = false;
		if (this.cache.to === undefined || !this.to.getPos().equals(this.cache.to)) {
			needsCalculation = true;
		} else if (this.cache.from === undefined || !this.from.getPos().equals(this.cache.from)) {
			needsCalculation = true;
		} else if (this.cache.type === undefined) {
			needsCalculation = true;
		}

		if (needsCalculation) {
			this.cache.from = this.from.getPos().clone();
			this.cache.to = this.to.getPos().clone();
		}

		if (this.to === this.from) {
			// self loop
			if (needsCalculation || this.cache.type !== "self") {
				needsCalculation = true;
				const abovePoint = this.from.getPos().clone();
				abovePoint.subtract(new Point(0, 100));
				this.cache.start = this.from.radiusPoint(abovePoint, -Math.PI / 5, -1);
				this.cache.end = this.from.radiusPoint(abovePoint, Math.PI / 5, 0);
				this.cache.type = "self";
			}
			labelPoint = Arrow.drawSelfArrow(
				canvas,
				this.cache,
				needsCalculation,
				scale,
				offset,
				height,
				this.color
			);
		} else if (this.to.hasTransitionToState(this.from)) {
			// matched inverse transitions
			if (needsCalculation || this.cache.type !== "matched") {
				needsCalculation = true;
				this.cache.start = this.from.radiusPoint(this.to.getPos(), Math.PI / 4, -1);
				this.cache.end = this.to.radiusPoint(this.from.getPos(), -Math.PI / 4, 0);
				this.cache.type = "matched";
			}
			labelPoint = Arrow.drawCurvedArrow(
				canvas,
				this.cache,
				needsCalculation,
				scale,
				offset,
				height,
				this.color
			);
		} else {
			// normal straight arrow
			if (needsCalculation || this.cache.type !== "straight") {
				needsCalculation = true;
				this.cache.start = this.from.getPos().clone();
				this.cache.end = this.to.radiusPoint(this.from.getPos(), 0, 0);
				this.cache.type = "straight";
			}
			labelPoint = Arrow.drawArrow(
				canvas,
				this.cache,
				needsCalculation,
				scale,
				offset,
				height,
				this.color
			);
		}

		// only draw the labels sometimes to increase performance
		if (this.element && (updateLabel || needsCalculation)) {
			this.drawLabel(labelPoint);
		}
	}

	selectLabelText() {
		// highlight the text of the label
		const input = this.element.children(".label-input");
		const str = input.val();
		input[0].setSelectionRange(0, str.length);
	}

	generateLabelText() {
		// generate the label string from the labels
		let str = "";
		this.labels.forEach((char) => {
			if (char === "") {
				str += lambdaChar + this.delimiter;
			} else {
				str += char + this.delimiter;
			}
		});
		str = str.substring(0, str.length - this.delimiter.length);
		this.element.children(".label-input").val(str);
	}

	adjustLabelSize() {
		// this function was giving me some trouble so now it's way over-engineered
		const label = this.element.children(".label-input");
		const sensor = $(`<p class="width-sensor">${label.val()}</p>`);
		$("#content-wrap").append(sensor);
		const textWidth = Math.round(sensor.width()) + 14;

		const smallSensor = $(`<p class="small-width-sensor">${label.val()}</p>`);
		$("#content-wrap").append(smallSensor);
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
		// get the text and adjust the font size
		this.generateLabelText();
		this.adjustLabelSize();

		// calculate the position of the element
		const fromPos = this.from.getPos();
		const toPos = this.to.getPos();
		const width = this.element.outerWidth();

		let angle = Math.atan2(toPos.y - fromPos.y, toPos.x - fromPos.x);
		if (fromPos.x > toPos.x) {
			angle += Math.PI;
		}

		const top = pos.y - (Math.sin(angle) * width) / 2;
		const left = pos.x - (Math.cos(angle) * width) / 2;

		// set the position
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
