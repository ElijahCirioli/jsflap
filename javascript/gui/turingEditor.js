class TuringEditor extends PushdownEditor {
	constructor(parent, callback) {
		super(parent, callback);
		this.automaton = new TuringAutomaton();
	}

	getType() {
		return "turing";
	}

	endTransition(element, autoLambda) {
		const endId = element.attr("id");
		const endState = this.automaton.getStateById(endId);
		const tuple = autoLambda ? { read: "", write: "", move: 0 } : undefined;
		let t;

		this.labelsWrap.children(".label-form").css("pointer-events", "all");
		if (!this.automaton.hasTransitionBetweenStates(this.startState, endState)) {
			// no existing transition so create a new one
			const labelElement = $(`<form class="label-form tuple-form"></form>`);
			if (autoLambda) {
				labelElement.append(`
                    <div class="tuple">
                        <input type="text" spellcheck="false" maxlength="1" class="label-input read-input tuple-input">
                        <p class="tuple-delimeter">🠦</p>
                        <input type="text" spellcheck="false" maxlength="1" class="label-input write-input tuple-input">
                        <p class="tuple-delimeter">,&nbsp;</p>
                        <input type="text" spellcheck="false" maxlength="1" class="label-input move-input tuple-input">
                        <div class="move-input-dropdown">
                            <p class="move-input-dropdown-item move-input-left">L</p>
                            <p class="move-input-dropdown-item move-input-stay">S</p>
                            <p class="move-input-dropdown-item move-input-right">R</p>
                        </div>
                    </div>
                `);
			}
			this.labelsWrap.append(labelElement);
			t = this.automaton.addTransition(this.startState, endState, tuple, labelElement);
			this.setupLabelListeners(labelElement, t);
		} else {
			// there's already a transition here so just select it
			t = this.automaton.getTransitionsBetweenStates(this.startState, endState);
			t.addTuple(this, tuple);
		}

		if (autoLambda) {
			this.unselectAllTransitions();
			this.selectTuple(tuple, t.getElement().children(".tuple").last(), t);
			this.selectTransition(t);
			t.clearCache();
			this.automaton.drawAllTransitions(this.canvas, this.scale, this.offset, true);
			t.focusElement();
			t.selectLabelText();
		}

		this.triggerTest();
		this.startState = undefined;
		return t;
	}

	setupTupleCharacterInputListeners(element, transition, tuple) {
		this.setupSingleCharacterInputListener(element.children(".read-input"), transition, tuple, "read");
		this.setupSingleCharacterInputListener(element.children(".write-input"), transition, tuple, "write");

		const moveInput = element.children(".move-input");
		moveInput.on("focusout", (e) => {
			moveInput[0].setSelectionRange(0, 0);
		});

		moveInput.on("focusin", (e) => {
			moveInput[0].setSelectionRange(0, 9999);
		});

		moveInput.on("keydown", (e) => {
			e = window.event || e;
			const key = e.key;
			e.preventDefault();
			e.stopPropagation();

			// make sure deleting text doesn't delete the whole transition
			if (key === "Delete" || key === "Backspace") {
				e.stopPropagation();
				tuple.move = 0;
				this.automaton.drawAllTransitions(this.canvas, this.scale, this.offset, true);
				this.triggerTest();
			} else if (key === "Enter") {
				transition.addEmptyTuple(this);
				this.unselectAllTransitions();
				this.selectTransition(transition);
				transition.clearCache();
				this.automaton.drawAllTransitions(this.canvas, this.scale, this.offset, true);
				transition.focusElement();
				transition.selectLabelText();
			} else if (key === "ArrowRight" || key === "Tab") {
				moveInput.next().next(".label-input").focus();
				if (moveInput.prev().length > 0 && moveInput.next().next(".label-input").length > 0) {
					moveInput.next().next(".label-input")[0].setSelectionRange(0, 0);
				}
			} else if (key === "ArrowLeft") {
				if (moveInput.prev().length > 0) {
					moveInput.prev().prev(".label-input").focus();
				} else {
					moveInput.parent().next().children(".label-input").last().focus();
				}
			} else if (key === "ArrowUp") {
				moveInput.parent().next().children().eq(moveInput.index()).focus();
			} else if (key === "ArrowDown") {
				moveInput.parent().prev().children().eq(moveInput.index()).focus();
			} else if (key.length === 1) {
				// add chars
				if (key === "," || key === "s") {
					tuple.move = 0;
				} else if (key === "r") {
					tuple.move = 1;
				} else if (key === "l") {
					tuple.move = -1;
				}

				this.automaton.drawAllTransitions(this.canvas, this.scale, this.offset, true);
				this.triggerTest();
			}
		});

		element
			.children(".move-input-dropdown")
			.children(".move-input-dropdown-item")
			.click((e) => {
				e.preventDefault();
				e.stopPropagation();
				tuple.move = $(e.target).index() - 1;
				moveInput.click();
				this.automaton.drawAllTransitions(this.canvas, this.scale, this.offset, true);
				this.triggerTest();
			});
	}
}
