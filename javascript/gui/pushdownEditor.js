class PushdownEditor extends Editor {
	constructor(parent, callback) {
		super(parent, callback);
		this.automaton = new PushdownAutomaton();
		this.selectedTuples = new Set();
	}

	getType() {
		return "pushdown";
	}

	selectTuple(tuple, element, transition) {
		element.addClass("selected-tuple");
		this.selectedTuples.add(JSON.stringify({ tuple: tuple, transition: transition.getId() }));
	}

	unselectTuple(tuple, element, transition) {
		element.removeClass("selected-tuple");
		const key = JSON.stringify({ tuple: tuple, transition: transition.getId() });
		this.selectedTuples.delete(key);
		let hasSelectedTuples = false;
		transition.getLabels().forEach((t) => {
			const otherKey = JSON.stringify({ tuple: t, transition: transition.getId() });
			if (this.selectedTuples.has(otherKey)) {
				hasSelectedTuples = true;
			}
		});
		if (!hasSelectedTuples) {
			this.unselectTransition(transition);
		}
	}

	unselectAllTuples() {
		this.labelsWrap.children(".label-form").children(".tuple").removeClass("selected-tuple");
		if (this.selectedTuples) {
			this.selectedTuples.clear();
		}
	}

	unselectAllTransitions() {
		const active = $(document.activeElement);
		if (active.parent().hasClass("selected-tuple")) {
			active.blur();
		}
		this.unselectAllTuples();
		this.labelsWrap.children(".label-form").children(".label-input").removeClass("selected-label");
		this.selectedTransitions.clear();
	}

	selectAll() {
		this.automaton.getStates().forEach((s) => {
			this.selectState(s);
			s.getTransitions().forEach((t) => {
				this.selectedTransitions.add(t);
				const element = t.getElement();
				let i = 0;
				t.getLabels().forEach((tuple) => {
					const tupleElement = element.children(".tuple").eq(i);
					this.selectTuple(tuple, tupleElement, t);
					i++;
				});
			});
		});
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
					<div class="tuple">
						<input type="text" spellcheck="false" maxlength="1" class="label-input char-input tuple-input">
						<p class="tuple-delimiter">,&nbsp;</p>
						<input type="text" spellcheck="false" maxlength="1" class="label-input pop-input tuple-input">
						<p class="tuple-delimiter tuple-delimiter-arrow"><i class="fas fa-arrow-right-long"></i></p>
						<input type="text" spellcheck="false" maxlength="256" class="label-input push-input tuple-input">
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

	removeSelectionBox() {
		if (!this.selectionBoxPoint) {
			return;
		}

		// calculate intersections
		const selectionBoxes = this.labelsWrap.children(".selection-box");
		if (selectionBoxes.length > 0) {
			const selectionBox = selectionBoxes[0];
			this.statesWrap
				.children(".state")
				.toArray()
				.forEach((stateElement) => {
					if (this.elementBoundingBoxCollision(stateElement, selectionBox)) {
						const state = this.automaton.getStateById($(stateElement).attr("id"));
						if (this.tool === "trash") {
							this.automaton.removeState(state);
						} else {
							this.selectState(state);
						}
					}
				});

			this.getAutomaton()
				.getStates()
				.forEach((state) => {
					state.getTransitions().forEach((transition) => {
						const labelElement = transition.getElement();
						let i = 0;
						let removeTuples = [];
						transition.getLabels().forEach((tuple) => {
							const element = labelElement.children(".tuple").eq(i);
							if (this.elementBoundingBoxCollision(element[0], selectionBox)) {
								if (this.tool === "trash") {
									removeTuples.push({
										element: element,
										tuple: tuple,
									});
								} else {
									this.selectTuple(tuple, element, transition);
									this.selectTransition(transition);
									if (this.selectedStates.size === 0) {
										element.focus();
									}
								}
							}
							i++;
						});

						if (removeTuples.length > 0) {
							transition.clearCache();
						}
						for (const r of removeTuples) {
							r.element.remove();
							transition.removeLabel(r.tuple);
							if (transition.getLabels().size === 0) {
								this.automaton.removeTransition(transition);
							}
						}
					});
				});

			this.draw();
			if (this.tool === "trash") {
				this.triggerTest();
			}
		}

		this.labelsWrap.children(".selection-box").remove();
		this.selectionBoxPoint = undefined;
	}

	setupLabelListeners(label, transition) {
		label.on("focusout", (e) => {
			if (label.is(":focus-within")) {
				return;
			}

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
						label.children(".tuple").eq(i).remove();
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
			const element = label.children(".tuple").eq(i);
			this.setupTupleListeners(element, transition, tuple);
			i++;
		});
	}

	setupTupleCharacterInputListeners(element, transition, tuple) {
		this.setupSingleCharacterInputListener(element.children(".char-input"), transition, tuple, "char");
		this.setupSingleCharacterInputListener(element.children(".pop-input"), transition, tuple, "pop");
		this.setupMultipleCharacterInputListener(element.children(".push-input"), transition, tuple, "push");
	}

	setupTupleListeners(element, transition, tuple) {
		this.setupTupleCharacterInputListeners(element, transition, tuple);

		element.click((e) => {
			// middle click
			if (("which" in e && e.which === 2) || ("button" in e && e.button === 4)) {
				return;
			}

			e.stopPropagation();

			if (this.tool === "point" || this.tool === "transition" || this.tool === "chain") {
				const selectionTuple = JSON.stringify({ tuple: tuple, transition: transition.getId() });
				if (controlKey || shiftKey) {
					if (this.selectedTuples.has(selectionTuple)) {
						this.unselectTuple(tuple, element, transition);
						element.children(".label-input").blur();
						this.labelsWrap.children(".label-form").children(".selected-tuple").first().focus();
					} else {
						this.selectTuple(tuple, element, transition);
						this.selectTransition(transition);
					}
				} else {
					if (!this.selectedTuples.has(selectionTuple)) {
						this.unselectAllTransitions();
						this.unselectAllStates();
					}
					this.selectTuple(tuple, element, transition);
					this.selectTransition(transition);
				}
			}
		});

		// put mouse down on tuple
		element.on("mousedown", (e) => {
			const middleClick = ("which" in e && e.which === 2) || ("button" in e && e.button === 4);
			if (!middleClick) {
				e.stopPropagation();
			}
		});

		// lift mouse up on tuple
		element.on("mouseup", (e) => {
			const middleClick = ("which" in e && e.which === 2) || ("button" in e && e.button === 4);
			if (!middleClick) {
				e.stopPropagation();
			}
			this.removeSelectionBox();
		});

		// move mouse onto tuple
		element.on("mouseenter mousemove", (e) => {
			if (this.tool === "chain") {
				this.movePreviewState(new Point(9999999, 9999999));
				this.removePreviewTransition();
				this.automaton.drawAllTransitions(this.canvas, this.scale, this.offset, false);
				e.stopPropagation();
			}
		});

		element.click((e) => {
			if (this.tool === "trash") {
				$(e.currentTarget).remove();
				transition.removeLabel(tuple);
				if (transition.getLabels().size === 0) {
					this.automaton.removeTransition(transition);
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

			// make sure holding shift doesn't cause updates
			if (key === "Shift") {
				return;
			}

			// make sure deleting text doesn't delete the whole transition
			if (key === "Delete" || key === "Backspace") {
				e.stopPropagation();
				tuple[type] = "";
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
						element.val(
							str.substring(0, selectionStart) + key.length === 1
								? key
								: "" + str.substring(selectionEnd + 1, str.length)
						);
						newCursorPos = selectionStart + 1;
					}
				} else {
					if (key === "Backspace" && selectionStart > 0) {
						element.val(
							str.substring(0, selectionStart - 1) + str.substring(selectionEnd, str.length)
						);
						newCursorPos = selectionStart - 1;
					} else if (key === "Delete" && selectionEnd < str.length) {
						element.val(
							str.substring(0, selectionStart) + str.substring(selectionEnd + 1, str.length)
						);
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
						element.val(
							str.substring(0, selectionStart) + key + str.substring(selectionEnd, str.length)
						);
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
