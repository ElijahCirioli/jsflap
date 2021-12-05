class PushdownTransition extends Transition {
	constructor(fromState, toState, tuple) {
		super(fromState, toState, tuple);
	}

	adjustLabeSize() {
		// shrink the text to try and fit between states
		this.element.children(".pushdown-tuple").each((index) => {
			const tuple = this.element.children(".pushdown-tuple").eq(index);
			const distance = this.from.getPos().distance(this.to.getPos()) - 45;
			tuple.children().removeClass("small-text-label");
			this.adjustInputSize(tuple.children(".push-input"));
			if (this.from !== this.to && tuple.outerWidth() > distance) {
				tuple.children().addClass("small-text-label");
			}
			this.adjustInputSize(tuple.children(".push-input"));
		});
	}

	adjustInputSize(input) {
		const sensor = $(`<p></p>`);
		if (input.hasClass("small-text-label")) {
			sensor.addClass("small-width-sensor");
		} else {
			sensor.addClass("width-sensor");
		}
		$("#content-wrap").append(sensor);
		sensor.text(input.val());
		const textWidth = Math.round(sensor.width()) + 8;
		input.width(textWidth);
		sensor.remove();
	}

	generateLabelText() {
		// generate the grid of tuples from the set
		let i = 0;
		this.labels.forEach((tuple) => {
			const element = this.element.children(".pushdown-tuple").eq(i);
			element.children(".char-input").val(tuple.char.length > 0 ? tuple.char : lambdaChar);
			element.children(".pop-input").val(tuple.pop.length > 0 ? tuple.pop : lambdaChar);
			element.children(".push-input").val(tuple.push.length > 0 ? tuple.push : lambdaChar);
			i++;
		});
	}

	addTuple(editor, tuple) {
		if (tuple === undefined) {
			return;
		}

		const element = $(`
			<div class="pushdown-tuple">
				<input type="text" spellcheck="false" maxlength="1" class="label-input char-input tuple-input">
				<p class="tuple-delimeter">,&nbsp;</p>
				<input type="text" spellcheck="false" maxlength="1" class="label-input pop-input tuple-input">
				<p class="tuple-delimeter">🠦</p>
				<input type="text" spellcheck="false" maxlength="256" class="label-input push-input tuple-input">
			</div>`);
		this.element.append(element);
		this.labels.add(tuple);
		editor.setupTupleListeners(element, this, tuple);
		return element;
	}

	removeTuple(tuple) {
		let i = 0;
		let match;
		this.labels.forEach((t) => {
			if (tuple.char === t.char && tuple.pop === t.pop && tuple.push === t.push) {
				this.element.children(".pushdown-tuple").eq(i).remove();
				match = t;
			}
			i++;
		});
		if (match) {
			this.labels.delete(match);
			this.clearCache();
			if (this.labels.size === 0) {
				this.fromState.removeTransition(this.toState);
			}
		}
	}

	focusElement() {
		this.element.children(".pushdown-tuple").last().children(".label-input").first().focus();
		this.element.children(".pushdown-tuple").last().children(".label-input").first()[0].setSelectionRange(9999, 9999);
	}

	selectLabelText() {
		// highlight the text of the tuple
		this.element.children(".pushdown-tuple").last().children(".label-input").first()[0].setSelectionRange(0, 9999);
	}
}
