class Editor {
	constructor(parent, callback) {
		this.parent = parent;
		this.triggerTest = callback;
		this.tool = "point";
		this.startState = undefined;
		this.selectionBoxPoint = undefined;
		this.selectedStates = new Set();
		this.selectedTransitions = new Set();
		this.automaton = new Automaton();

		this.editorWrap = this.parent.children(".editor");
		this.canvas = this.editorWrap.children(".editor-canvas")[0];
		this.statesWrap = this.editorWrap.children(".editor-state-container");
		this.labelsWrap = this.editorWrap.children(".editor-label-container");
		this.previewState = undefined;
		this.previewTransition = undefined;

		this.stopDrag();
		this.resizeCanvas();
		this.setupListeners();
	}

	setTool(newTool) {
		this.tool = newTool;

		this.statesWrap.children(".preview-state").remove();
		this.startState = undefined;
		this.removeSelectionBox();
		this.stopDrag();
		this.automaton.drawAllTransitions(this.canvas);
		const stateElements = this.statesWrap.children(".state");
		const labelElements = this.labelsWrap.children(".label-form");
		labelElements.css("pointer-events", "all");
		labelElements.children(".label-input").css("cursor", "text");
		if (this.tool === "point") {
			stateElements.css("cursor", "grab");
			this.unselectAllTransitions();
		} else if (this.tool === "state") {
			stateElements.css("cursor", "pointer");
			labelElements.css("pointer-events", "none");
			this.unselectAllStates();
			this.unselectAllTransitions();
			this.createPreviewState();
		} else if (this.tool === "transition") {
			stateElements.css("cursor", "crosshair");
			this.unselectAllStates();
			this.unselectAllTransitions();
		} else if (this.tool === "trash") {
			stateElements.css("cursor", "pointer");
			labelElements.children(".label-input").css("cursor", "pointer");
		} else if (this.tool === "chain") {
		}
	}

	getTool() {
		return this.tool;
	}

	getAutomaton() {
		return this.automaton;
	}

	resizeCanvas() {
		this.canvas.width = 0;
		this.canvas.height = 0;

		const width = this.parent.children(".editor").css("width");
		this.canvas.width = width.substring(width, width.length - 2);

		const height = this.parent.children(".editor").css("height");
		this.canvas.height = height.substring(height, height.length - 2);

		this.draw();
	}

	draw() {
		this.automaton.drawAllTransitions(this.canvas);
		this.automaton.drawAllStates();
	}

	createState(pos) {
		const firstState = this.automaton.getStates().size === 0;
		const name = this.automaton.getNextName();
		const element = $(`<div class="state"><p class="state-name">${name}</p></div>`);
		this.statesWrap.append(element);
		this.automaton.addState(pos, name, element, firstState);
		this.setupStateListeners(element);
		this.draw();
		this.triggerTest();
	}

	createPreviewState() {
		this.previewState = $("<div class='state preview-state'></div>");
		this.statesWrap.append(this.previewState);
	}

	movePreviewState(pos) {
		if (!this.previewState) {
			return;
		}
		const elementPos = new Point(pos.x - 25, pos.y - 25);
		this.previewState.css("top", elementPos.y + "px");
		this.previewState.css("left", elementPos.x + "px");
	}

	createPreviewTransition(state) {
		if (this.previewTransition && this.previewTransition.getToState() === state) {
			return;
		}
		this.removePreviewTransition();
		if (!this.automaton.hasTransitionBetweenStates(this.startState, state)) {
			this.previewTransition = this.automaton.addTransition(this.startState, state, "PREVIEW");
			this.previewTransition.makePreview();
		}
		this.automaton.drawAllTransitions(this.canvas);
	}

	removePreviewTransition() {
		if (this.previewTransition) {
			const fromState = this.previewTransition.getFromState();
			const toState = this.previewTransition.getToState();
			fromState.removeTransition(toState, "PREVIEW");
			this.previewTransition = undefined;
		}
		this.automaton.drawAllTransitions(this.canvas);
	}

	statelessPreviewTransition(pos) {
		if (this.previewTransition) {
			this.removePreviewTransition();
		}
		this.automaton.drawAllTransitions(this.canvas);
		const context = this.canvas.getContext("2d");
		const previewColor = "rgba(139, 138, 150, 0.5)";
		Arrow.drawArrow(context, this.startState.getPos(), pos, this.startState.getPos(), pos, previewColor);
	}

	startTransition(element) {
		const id = element.attr("id");
		this.startState = this.automaton.getStateById(id);
		this.labelsWrap.children(".label-form").css("pointer-events", "none");
	}

	endTransition(element) {
		const endId = element.attr("id");
		const endState = this.automaton.getStateById(endId);

		this.labelsWrap.children(".label-form").css("pointer-events", "all");
		if (!this.automaton.hasTransitionBetweenStates(this.startState, endState)) {
			const labelElement = $(`<form class="label-form"><input type="text" spellcheck="false" maxlength="256" class="label-input"></form>`);
			this.labelsWrap.append(labelElement);
			const t = this.automaton.addTransition(this.startState, endState, "", labelElement);
			this.setupLabelListeners(labelElement, t);
			t.focusElement();
			t.selectLabelText();
			this.unselectAllTransitions();
			this.selectTransition(t);
		} else {
			const t = this.automaton.getTransitionsBetweenStates(this.startState, endState);
			t.focusElement();
			this.selectTransition(t);
		}

		this.triggerTest();
		this.startState = undefined;
	}

	stopDrag() {
		if (this.tool === "point") {
			this.statesWrap.children(".state").css("cursor", "grab");
		}
		this.clicked = false;
		this.lastMousePos = undefined;
	}

	startDrag(pos) {
		this.statesWrap.children(".selected").css("cursor", "grabbing");
		this.clicked = true;
		this.lastMousePos = pos;
	}

	selectState(state) {
		state.getElement().addClass("selected");
		this.selectedStates.add(state);
	}

	unselectState(state) {
		state.getElement().removeClass("selected");
		this.selectedStates.delete(state);
	}

	unselectAllStates() {
		this.statesWrap.children(".state").removeClass("selected");
		this.selectedStates.clear();
	}

	selectTransition(transition) {
		transition.getElement().children(".label-input").addClass("selected-label");
		this.selectedTransitions.add(transition);
	}

	unselectTransition(transition) {
		transition.getElement().children(".label-input").removeClass("selected-label");
		this.selectedTransitions.delete(transition);
	}

	unselectAllTransitions() {
		this.labelsWrap.children(".label-form").children(".label-input").removeClass("selected-label");
		this.selectedTransitions.clear();
	}

	startSelectionBox(pos) {
		this.labelsWrap.children(".selection-box").remove();
		this.selectionBoxPoint = pos;
		const selectionBox = $(`<div class="selection-box"></div>`);
		selectionBox.css("top", pos.y);
		selectionBox.css("left", pos.x);
		this.labelsWrap.append(selectionBox);
	}

	moveSelectionBox(pos) {
		if (!this.selectionBoxPoint) {
			return;
		}
		// draw the box
		const selectionBox = this.labelsWrap.children(".selection-box");
		if (pos.x > this.selectionBoxPoint.x) {
			selectionBox.css("left", this.selectionBoxPoint.x);
			selectionBox.css("width", pos.x - this.selectionBoxPoint.x);
		} else {
			selectionBox.css("left", pos.x);
			selectionBox.css("width", this.selectionBoxPoint.x - pos.x);
		}

		if (pos.y > this.selectionBoxPoint.y) {
			selectionBox.css("top", this.selectionBoxPoint.y);
			selectionBox.css("height", pos.y - this.selectionBoxPoint.y);
		} else {
			selectionBox.css("top", pos.y);
			selectionBox.css("height", this.selectionBoxPoint.y - pos.y);
		}

		// calculate intersections
	}

	removeSelectionBox() {
		this.labelsWrap.children(".selection-box").remove();
		this.selectionBoxPoint = undefined;
	}

	createRightClickMenu(state, pos) {
		this.labelsWrap.children(".right-click-menu").remove();
		const finalIcon = state.isFinal() ? "fa-check-square" : "fa-square";
		const initialIcon = state.isInitial() ? "fa-check-square" : "fa-square";
		const menu = $(`
		<div class="right-click-menu">
			<button class="menu-child-item" id="make-final-button"><i class="fas ${finalIcon}"></i> Final</button>
			<button class="menu-child-item" id="make-initial-button"><i class="fas ${initialIcon}"></i> Initial</button>
			<button class="menu-child-item" id="rename-button">Rename</button>
		</div>`);
		menu.css("top", pos.y + "px");
		menu.css("left", pos.x + "px");
		this.labelsWrap.append(menu);

		menu.children("#make-final-button").click((e) => {
			e.stopPropagation();
			const newFinalStatus = !state.isFinal();
			if (newFinalStatus) {
				// make selected states final
				this.selectedStates.forEach((s) => {
					this.automaton.addFinalState(s);
				});
			} else {
				// make selected states not final
				this.selectedStates.forEach((s) => {
					this.automaton.removeFinalState(s);
				});
			}
			const newFinalIcon = newFinalStatus ? "fa-check-square" : "fa-square";
			const iconElement = $(e.currentTarget).children("i");
			iconElement.removeClass("fa-check-square");
			iconElement.removeClass("fa-square");
			iconElement.addClass(newFinalIcon);

			this.triggerTest();
		});

		menu.children("#make-initial-button").click((e) => {
			e.stopPropagation();
			const newInitialStatus = !state.isInitial();
			if (newInitialStatus) {
				this.automaton.setInitialState(state);
			} else {
				this.automaton.removeInitialState();
			}
			const newInitialIcon = newInitialStatus ? "fa-check-square" : "fa-square";
			const iconElement = $(e.currentTarget).children("i");
			iconElement.removeClass("fa-check-square");
			iconElement.removeClass("fa-square");
			iconElement.addClass(newInitialIcon);

			this.triggerTest();
		});
	}

	setupListeners() {
		// resize window
		$(window).resize((e) => {
			this.resizeCanvas();
		});

		// click on editor
		this.editorWrap.click((e) => {
			e.stopPropagation();
			const offset = $(this.editorWrap).offset();
			const xPos = Math.round(e.clientX - offset.left);
			const yPos = Math.round(e.clientY - offset.top);
			const pos = new Point(xPos, yPos);

			this.labelsWrap.children(".right-click-menu").remove();
			if (this.tool === "state") {
				this.createState(pos);
			}
		});

		// move mouse on editor
		this.editorWrap.on("mousemove", (e) => {
			e.stopPropagation();
			const offset = $(this.editorWrap).offset();
			const xPos = Math.round(e.clientX - offset.left);
			const yPos = Math.round(e.clientY - offset.top);
			const pos = new Point(xPos, yPos);

			if (this.tool === "point") {
				if (this.clicked && this.lastMousePos) {
					// drag selected states
					const stateOffset = new Point(pos.x - this.lastMousePos.x, pos.y - this.lastMousePos.y);
					this.selectedStates.forEach((s) => {
						s.getPos().add(stateOffset);
					});
					this.lastMousePos = pos;
					this.draw();
				} else if (this.selectionBoxPoint) {
					this.moveSelectionBox(pos);
				}
			} else if (this.tool === "state") {
				this.movePreviewState(pos);
			} else if (this.tool === "transition" && this.startState) {
				this.statelessPreviewTransition(pos);
			}
		});

		// put mouse down on editor
		this.editorWrap.on("mousedown", (e) => {
			e.stopPropagation();
			const offset = $(this.editorWrap).offset();
			const xPos = Math.round(e.clientX - offset.left);
			const yPos = Math.round(e.clientY - offset.top);
			const pos = new Point(xPos, yPos);

			if (this.tool === "point") {
				this.startSelectionBox(pos);
			}
		});

		// lift mouse up on editor
		this.editorWrap.on("mouseup", (e) => {
			e.stopPropagation();
			this.stopDrag();

			if (this.tool === "transition") {
				this.startState = undefined;
				this.labelsWrap.children(".label-form").css("pointer-events", "all");
				this.removePreviewTransition();

				if (!controlKey && !shiftKey) {
					this.unselectAllStates();
					this.unselectAllTransitions();
				}
			} else if (this.tool === "point") {
				this.removeSelectionBox();

				if (!controlKey && !shiftKey) {
					this.unselectAllStates();
					this.unselectAllTransitions();
				}
			}
		});

		// take mouse out of editor
		this.editorWrap.on("mouseleave", (e) => {
			e.stopPropagation();
			this.stopDrag();

			if (this.tool === "transition") {
				this.startState = undefined;
				this.labelsWrap.children(".label-form").css("pointer-events", "all");
				this.removePreviewTransition();
			} else if (this.tool === "point") {
				this.removeSelectionBox();
			}
		});

		// click on something not in the editor
		this.editorWrap.on("focusout", (e) => {
			this.labelsWrap.children(".right-click-menu").remove();
		});
	}

	setupStateListeners(state) {
		// get the object associated with this element
		const id = state.attr("id");
		const stateObj = this.automaton.getStateById(id);

		// click on state
		state.click((e) => {
			e.stopPropagation();
			const id = $(e.currentTarget).attr("id");
			const state = this.automaton.getStateById(id);
			if (this.tool === "trash") {
				if (this.selectedStates.has(state)) {
					this.selectedStates.forEach((s) => {
						this.automaton.removeState(s);
					});
				} else {
					this.automaton.removeState(state);
				}
				this.unselectAllStates();
				this.automaton.drawAllTransitions(this.canvas);
				this.triggerTest();
			}
		});

		// put mouse down on state
		state.on("mousedown", (e) => {
			e = window.event || e;
			e.stopPropagation();

			// try to stop right clicks
			if ("which" in e && e.which == 3) {
				return;
			} else if ("button" in e && e.button == 2) {
				return;
			}

			const offset = $(this.editorWrap).offset();
			const xPos = Math.round(e.clientX - offset.left);
			const yPos = Math.round(e.clientY - offset.top);
			const pos = new Point(xPos, yPos);

			this.labelsWrap.children(".right-click-menu").remove();

			if (this.tool === "point") {
				if (controlKey || shiftKey) {
					if (this.selectedStates.has(stateObj)) {
						this.unselectState(stateObj);
					} else {
						this.selectState(stateObj);
					}
				} else {
					if (!this.selectedStates.has(stateObj)) {
						this.unselectAllStates();
					}
					this.selectState(stateObj);
					this.startDrag(pos);
				}
			} else if (this.tool === "transition" && !this.startState) {
				this.startTransition($(e.currentTarget));
				this.createPreviewTransition(stateObj);
			}
		});

		// lift mouse up on state
		state.on("mouseup", (e) => {
			e.stopPropagation();
			this.stopDrag();

			if (this.tool === "point") {
				if (!controlKey && !shiftKey && this.selectedStates.size === 1) {
					this.unselectState(stateObj);
				}
			} else if (this.tool === "transition" && this.startState) {
				this.removePreviewTransition();
				this.endTransition($(e.currentTarget));
			}
		});

		// move mouse on state
		state.on("mousemove", (e) => {
			if (this.tool === "transition" && this.startState) {
				this.createPreviewTransition(stateObj);
				e.stopPropagation();
			}
		});

		// right click on state
		state.on("contextmenu", (e) => {
			e.preventDefault();

			const offset = $(this.editorWrap).offset();
			const xPos = Math.round(e.clientX - offset.left);
			const yPos = Math.round(e.clientY - offset.top);
			const pos = new Point(xPos, yPos);

			this.selectState(stateObj);
			this.createRightClickMenu(stateObj, pos);
		});
	}

	setupLabelListeners(label, transition) {
		const input = label.children(".label-input");

		label.click((e) => {
			e.stopPropagation();

			if (this.tool === "point" || this.tool === "transition") {
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
					}
					this.selectTransition(transition);
				}
			} else if (this.tool === "trash") {
				if (this.selectedTransitions.has(transition)) {
					this.selectedTransitions.forEach((t) => {
						this.automaton.removeTransition(t);
					});
				} else {
					this.automaton.removeTransition(transition);
				}
				this.unselectAllTransitions();
				this.automaton.drawAllTransitions(this.canvas);
				this.triggerTest();
			}
		});

		label.on("mouseup", (e) => {
			this.removeSelectionBox();
			e.stopPropagation();
		});

		input.on("focusout", (e) => {
			if (transition.labels.size === 0) {
				this.automaton.removeTransition(transition);
			}
			this.automaton.drawAllTransitions(this.canvas);
			this.triggerTest();
			input[0].setSelectionRange(0, 0);
		});

		input.on("focusin", (e) => {
			this.automaton.drawAllTransitions(this.canvas);
		});

		label.on("keydown", (e) => {
			e = window.event || e;
			const key = e.key;
			e.preventDefault();

			const str = input.val();
			const selectionStart = input[0].selectionStart;
			const selectionEnd = input[0].selectionEnd;
			const chunkLength = transition.getDelimeter().length + 1;

			if (key === "Enter") {
				// lose focus when they press enter
				input.blur();
			} else {
				let newCursorPos = selectionStart;
				if (selectionStart !== selectionEnd) {
					if (key === "Backspace" || key === "Delete" || key.length === 1) {
						// delete multiple labels
						const startAdjusted = chunkLength * Math.ceil(selectionStart / chunkLength);
						const endAdjusted = chunkLength * Math.floor((selectionEnd - 1) / chunkLength) + 1;
						const adjustedSelection = str.substring(startAdjusted, endAdjusted);
						const chars = adjustedSelection.split(transition.getDelimeter());
						for (const c of chars) {
							if (c !== "") {
								if (c === lambdaChar) {
									transition.removeLabel("");
								} else {
									transition.removeLabel(c);
								}
							}
						}
						newCursorPos = startAdjusted - transition.getDelimeter().length;
					}
				} else {
					if (key === "Backspace" || key === "Delete") {
						// delete individual label
						let startAdjusted;
						if (key === "Backspace") {
							startAdjusted = chunkLength * Math.floor((selectionStart - 1) / chunkLength);
						} else if (key === "Delete") {
							startAdjusted = chunkLength * Math.ceil(selectionStart / chunkLength);
						}
						const char = str.substring(startAdjusted, startAdjusted + 1);
						if (char !== "") {
							if (char === lambdaChar) {
								transition.removeLabel("");
							} else {
								transition.removeLabel(char);
							}
						}
						newCursorPos = startAdjusted - transition.getDelimeter().length;
					}
				}

				if (key === "ArrowRight") {
					newCursorPos = chunkLength * Math.ceil(selectionEnd / chunkLength) + 1;
				} else if (key === "ArrowLeft") {
					newCursorPos = Math.max(chunkLength * (Math.floor(selectionStart / chunkLength) - 1) + 1, 0);
				}
				if (key.length === 1) {
					// add labels
					this.selectedTransitions.forEach((t) => {
						if (key === ",") {
							t.addLabel("");
						} else {
							t.addLabel(key);
						}
					});
					newCursorPos = chunkLength * 1000;
				}

				input[0].setSelectionRange(newCursorPos, newCursorPos);
				this.automaton.drawAllTransitions(this.canvas);
				this.triggerTest();
			}
		});
	}
}
