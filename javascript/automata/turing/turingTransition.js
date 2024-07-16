class TuringTransition extends PushdownTransition {
	constructor(fromState, toState, tuple) {
		super(fromState, toState, tuple);
	}

	adjustLabelSize() {
		// shrink the text to try and fit between states
		const distance = this.from.getPos().distance(this.to.getPos()) - 45;

		if (this.from !== this.to && this.element.outerWidth() > distance) {
			this.element.children(".tuple").children(".label-input").addClass("small-text-label");
			this.element.children(".tuple").children(".move-input-dropdown").addClass("small-text-dropdown");
			this.element
				.children(".tuple")
				.children(".move-input-dropdown")
				.children()
				.addClass("small-text-label");
		} else {
			this.element.children(".tuple").children(".label-input").removeClass("small-text-label");
			this.element
				.children(".tuple")
				.children(".move-input-dropdown")
				.removeClass("small-text-dropdown");
			this.element
				.children(".tuple")
				.children(".move-input-dropdown")
				.children()
				.removeClass("small-text-label");
		}
	}

	generateLabelText() {
		// generate the grid of tuples from the set
		let i = 0;
		this.labels.forEach((tuple) => {
			const element = this.element.children(".tuple").eq(i);
			element.children(".read-input").val(tuple.read.length > 0 ? tuple.read : blankTapeChar);
			element.children(".write-input").val(tuple.write.length > 0 ? tuple.write : blankTapeChar);
			if (tuple.move === -1) {
				element.children(".move-input").val("L");
			} else if (tuple.move === 1) {
				element.children(".move-input").val("R");
			} else {
				element.children(".move-input").val("S");
			}

			i++;
		});
	}

	addTuple(editor, tuple) {
		if (tuple === undefined) {
			return;
		}

		const element = $(`
            <div class="tuple" tabindex="1">
                <input type="text" spellcheck="false" maxlength="1" class="label-input read-input tuple-input">
                <p class="tuple-delimiter tuple-delimiter-arrow"><i class="fas fa-arrow-right-long"></i></p>
                <input type="text" spellcheck="false" maxlength="1" class="label-input write-input tuple-input">
                <p class="tuple-delimiter">,&nbsp;</p>
                <input type="text" spellcheck="false" maxlength="1" class="label-input move-input tuple-input">
				 <div class="move-input-dropdown">
					<p class="move-input-dropdown-item move-input-left">L</p>
					<p class="move-input-dropdown-item move-input-stay">S</p>
					<p class="move-input-dropdown-item move-input-right">R</p>
				</div>
            </div>`);
		this.element.append(element);
		this.labels.add(tuple);
		editor.setupTupleListeners(element, this, tuple);
		return element;
	}

	addEmptyTuple(editor) {
		this.addTuple(editor, { read: "", write: "", move: 0 });
	}

	removeTuple(tuple) {
		let i = 0;
		let match;
		this.labels.forEach((t) => {
			if (tuple.read === t.read && tuple.write === t.write && tuple.move === t.move) {
				this.element.children(".tuple").eq(i).remove();
				match = t;
			}
			i++;
		});
		if (match) {
			this.labels.delete(match);
			this.clearCache();
			if (this.labels.size === 0) {
				this.from.removeTransition(this.to);
			}
		}
	}

	focusElement() {
		this.element.children(".tuple").last().children(".label-input").first().focus();
		this.element
			.children(".tuple")
			.last()
			.children(".label-input")
			.first()[0]
			.setSelectionRange(9999, 9999);
	}

	selectLabelText() {
		// highlight the text of the tuple
		this.element.children(".tuple").last().children(".label-input").first()[0].setSelectionRange(0, 9999);
	}
}
