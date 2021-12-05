class PushdownEditor extends Editor {
	constructor(parent, callback) {
		super(parent, callback);
		this.automaton = new PushdownAutomaton();
	}

	getType() {
		return "pushdown";
	}

	endTransition(element, autoLambda) {
		const endId = element.attr("id");
		const endState = this.automaton.getStateById(endId);
		const tuple = autoLambda ? { char: "", push: "", pop: "" } : undefined;
		let t;

		this.labelsWrap.children(".label-form").css("pointer-events", "all");
		if (!this.automaton.hasTransitionBetweenStates(this.startState, endState)) {
			// no existing transition so create a new one
			const labelElement = $(`<form class="label-form tuple-form"></form>`);
			if (autoLambda) {
				labelElement.append(`
				<div class="pushdown-tuple">
					<input type="text" spellcheck="false" maxlength="1" class="label-input char-input tuple-input">
					<p class="tuple-delimeter">,&nbsp;</p>
					<input type="text" spellcheck="false" maxlength="1" class="label-input pop-input tuple-input">
					<p class="tuple-delimeter">🠦</p>
					<input type="text" spellcheck="false" maxlength="256" class="label-input push-input tuple-input">
				</div>`);
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

	setupLabelListeners(label, transition) {
		const input = label.children(".pushdown-tuple").children(".label-input");

		// click on transition label
		label.click((e) => {
			// middle click
			if (("which" in e && e.which === 2) || ("button" in e && e.button === 4)) {
				return;
			}

			e.stopPropagation();

			if (this.tool === "point" || this.tool === "transition" || this.tool === "chain") {
				if (controlKey || shiftKey) {
					if (this.selectedTransitions.has(transition)) {
						this.unselectTransition(transition);
						input.blur();
						if (this.selectedTransitions.size > 0) {
							const first = this.selectedTransitions.values().next().value;
							first.focusElement();
						}
					} else {
						this.selectTransition(transition);
					}
				} else {
					if (!this.selectedTransitions.has(transition)) {
						this.unselectAllTransitions();
						this.unselectAllStates();
					}
					this.selectTransition(transition);
				}
			}
		});

		// put mouse down on transition label
		label.on("mousedown", (e) => {
			const middleClick = ("which" in e && e.which === 2) || ("button" in e && e.button === 4);
			if (!middleClick) {
				e.stopPropagation();
			}
		});

		// lift mouse up on transition label
		label.on("mouseup", (e) => {
			const middleClick = ("which" in e && e.which === 2) || ("button" in e && e.button === 4);
			if (!middleClick) {
				e.stopPropagation();
			}
			this.removeSelectionBox();
		});

		// move mouse onto transition label
		label.on("mouseenter mousemove", (e) => {
			if (this.tool === "chain") {
				this.movePreviewState(new Point(9999999, 9999999));
				this.removePreviewTransition();
				this.automaton.drawAllTransitions(this.canvas, this.scale, this.offset, false);
				e.stopPropagation();
			}
		});

		label.on("focusout", (e) => {
			setTimeout(() => {
				if ($(document.activeElement).parent().parent()[0] === label[0]) {
					return;
				}

				const foundTuples = new Set();
				const removeTuples = [];
				let i = 0;
				transition.getLabels().forEach((tuple) => {
					const key = tuple.char + "," + tuple.pop + "," + tuple.push;
					if (foundTuples.has(key)) {
						label.children(".pushdown-tuple").eq(i).remove();
						removeTuples.push(tuple);
					} else {
						foundTuples.add(key);
						i++;
					}
				});
				for (const t of removeTuples) {
					transition.removeLabel(t);
				}

				transition.clearCache();
				this.automaton.drawAllTransitions(this.canvas, this.scale, this.offset, true);
			}, 50);
		});

		let i = 0;
		transition.getLabels().forEach((tuple) => {
			const element = label.children(".pushdown-tuple").eq(i);
			this.setupTupleListeners(element, transition, tuple);
			i++;
		});
	}

	setupTupleListeners(element, transition, tuple) {
		this.setupSingleCharacterInputListener(element.children(".char-input"), transition, tuple, "char");
		this.setupSingleCharacterInputListener(element.children(".pop-input"), transition, tuple, "pop");
		this.setupMultipleCharacterInputListener(element.children(".push-input"), transition, tuple, "push");

		element.click((e) => {
			if (this.tool === "trash") {
				if (this.selectedTransitions.has(transition)) {
					this.selectedTransitions.forEach((t) => {
						this.automaton.removeTransition(t);
					});
				} else {
					$(e.currentTarget).remove();
					transition.removeLabel(tuple);
					if (transition.getLabels().size === 0) {
						this.automaton.removeTransition(transition);
					}
				}
				this.unselectAllTransitions();
				transition.clearCache();
				this.automaton.drawAllTransitions(this.canvas, this.scale, this.offset, true);
				this.triggerTest();
			}
		});
	}

	setupSingleCharacterInputListener(element, transition, tuple, type) {
		element.on("focusout", (e) => {
			element[0].setSelectionRange(0, 0);
		});

		element.on("focusin", (e) => {
			element[0].setSelectionRange(0, 9999);
		});

		// type in the box
		element.on("keydown", (e) => {
			e = window.event || e;
			const key = e.key;
			e.preventDefault();
			e.stopPropagation();

			// make sure deleting text doesn't delete the whole transition
			if (key === "Delete" || key === "Backspace") {
				e.stopPropagation();
				tuple[type] = "";
				this.automaton.drawAllTransitions(this.canvas, this.scale, this.offset, true);
				this.triggerTest();
			} else if (key === "Enter") {
				transition.addTuple(this, { char: "", push: "", pop: "" });
				this.unselectAllTransitions();
				this.selectTransition(transition);
				transition.clearCache();
				this.automaton.drawAllTransitions(this.canvas, this.scale, this.offset, true);
				transition.focusElement();
				transition.selectLabelText();
			} else if (key === "ArrowRight" || key === "Tab") {
				element.next().next(".label-input").focus();
				if (element.prev().length > 0 && element.next().next(".label-input").length > 0) {
					element.next().next(".label-input")[0].setSelectionRange(0, 0);
				}
			} else if (key === "ArrowLeft") {
				if (element.prev().length > 0) {
					element.prev().prev(".label-input").focus();
				} else {
					element.parent().next().children(".label-input").last().focus();
				}
			} else if (key === "ArrowUp") {
				element.parent().next().children().eq(element.index()).focus();
			} else if (key === "ArrowDown") {
				element.parent().prev().children().eq(element.index()).focus();
			} else if (key.length === 1) {
				// add chars
				if (key === ",") {
					tuple[type] = "";
				} else {
					tuple[type] = key;
				}

				element.next().next(".label-input").focus();
				this.automaton.drawAllTransitions(this.canvas, this.scale, this.offset, true);
				this.triggerTest();
			}
		});
	}

	setupMultipleCharacterInputListener(element, transition, tuple, type) {
		element.on("focusout", (e) => {
			element[0].setSelectionRange(0, 0);
			this.automaton.drawAllTransitions(this.canvas, this.scale, this.offset, true);
		});

		element.on("focusin", (e) => {
			if (element.val() === lambdaChar) {
				element[0].setSelectionRange(0, 9999);
			} else {
				element[0].setSelectionRange(9999, 9999);
			}
		});

		element.on("keydown", (e) => {
			e = window.event || e;
			const key = e.key;
			e.stopPropagation();
			e.preventDefault();

			let str = element.val();
			const selectionStart = element[0].selectionStart;
			const selectionEnd = element[0].selectionEnd;

			if (key === "Enter") {
				transition.addTuple(this, { char: "", push: "", pop: "" });
				this.unselectAllTransitions();
				this.selectTransition(transition);
				transition.clearCache();
				this.automaton.drawAllTransitions(this.canvas, this.scale, this.offset, true);
				transition.focusElement();
				transition.selectLabelText();
			} else {
				let newCursorPos = selectionStart;
				// deleting
				if (selectionStart !== selectionEnd) {
					if (key === "Backspace" || key === "Delete" || key.length === 1) {
						// delete multiple labels
						element.val(str.substring(0, selectionStart) + key.length === 1 ? key : "" + str.substring(selectionEnd + 1, str.length));
						newCursorPos = selectionStart + 1;
					}
				} else {
					if (key === "Backspace" && selectionStart > 0) {
						element.val(str.substring(0, selectionStart - 1) + str.substring(selectionEnd, str.length));
						newCursorPos = selectionStart - 1;
					} else if (key === "Delete" && selectionEnd < str.length) {
						element.val(str.substring(0, selectionStart) + str.substring(selectionEnd + 1, str.length));
						newCursorPos = selectionStart;
					}
				}

				if (key === "ArrowRight") {
					newCursorPos = selectionEnd + 1;
					if (newCursorPos > str.length) {
						element.parent().prev().children(".label-input").first().focus();
					}
					element[0].setSelectionRange(newCursorPos, newCursorPos);
					return;
				} else if (key === "ArrowLeft") {
					newCursorPos = selectionStart - 1;
					if (newCursorPos < 0) {
						element.prev().prev(".label-input").focus();
					} else {
						element[0].setSelectionRange(newCursorPos, newCursorPos);
					}
					return;
				} else if (key === "ArrowUp") {
					element.parent().next().children().eq(element.index()).focus();
					return;
				} else if (key === "ArrowDown") {
					element.parent().prev().children().eq(element.index()).focus();
					return;
				} else if (key === "Tab") {
					element.parent().prev().children(".label-input").first().focus();
					this.automaton.drawAllTransitions(this.canvas, this.scale, this.offset, true);
					return;
				} else if (key.length === 1) {
					if (key === ",") {
						if (str.length === 0) {
							element.val(lambdaChar);
						}
					} else {
						element.val(str.substring(0, selectionStart) + key + str.substring(selectionEnd, str.length));
						newCursorPos = selectionEnd + 1;
					}
				}

				str = element.val();
				if (str.length > 1) {
					element.val(str.replaceAll(lambdaChar, ""));
				}

				let stackPushString = "";
				for (const char of str) {
					if (char !== lambdaChar) {
						stackPushString += char;
					}
				}
				tuple[type] = stackPushString;
				this.automaton.drawAllTransitions(this.canvas, this.scale, this.offset, true);
				this.triggerTest();
				if (stackPushString.length === 0) {
					element.val("");
				}
				element[0].setSelectionRange(newCursorPos, newCursorPos);
			}
		});
	}
}
