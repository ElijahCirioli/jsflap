class Editor {
	constructor(parent) {
		this.parent = parent;
		this.tool = "point";
		this.startState = undefined;
		this.selectedStates = new Set();
		this.automaton = new Automaton();

		this.editorWrap = this.parent.children(".editor");
		this.canvas = this.editorWrap.children(".editor-canvas")[0];
		this.statesWrap = this.editorWrap.children(".editor-state-container");
		this.shadowState = undefined;
		this.shadowTransition = undefined;

		this.stopDrag();
		this.resizeCanvas();
		this.setupListeners();
	}

	setTool(newTool) {
		this.tool = newTool;

		this.statesWrap.children(".shadow-state").remove();
		this.startState = undefined;
		this.unselectAllStates();
		this.stopDrag();
		this.automaton.drawAllTransitions(this.canvas);
		const stateElements = this.statesWrap.children(".state");
		if (this.tool === "point") {
			stateElements.css("cursor", "grab");
		} else if (this.tool === "state") {
			stateElements.css("cursor", "pointer");
			this.createShadowState();
		} else if (this.tool === "transition") {
			stateElements.css("cursor", "crosshair");
		} else if (this.tool === "trash") {
			stateElements.css("cursor", "pointer");
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
		const name = this.automaton.getNextName();
		const element = $(`<div class="state"><p class="state-name">${name}</p></div>`);
		this.statesWrap.append(element);
		this.automaton.addState(pos, name, element);
		this.setupStateListeners(element);
		this.draw();
	}

	createShadowState() {
		this.shadowState = $("<div class='state shadow-state'></div>");
		this.statesWrap.append(this.shadowState);
	}

	moveShadowState(pos) {
		if (!this.shadowState) {
			return;
		}
		const elementPos = new Point(pos.x - 25, pos.y - 25);
		this.shadowState.css("top", elementPos.y + "px");
		this.shadowState.css("left", elementPos.x + "px");
	}

	createShadowTransition(state) {
		if (this.shadowTransition && this.shadowTransition.getToState() === state) {
			return;
		}
		this.removeShadowTransition();
		this.shadowTransition = this.automaton.addTransition(this.startState, state);
		this.shadowTransition.setColor("rgba(139, 138, 150, 0.5)");
		this.automaton.drawAllTransitions(this.canvas);
	}

	removeShadowTransition() {
		if (this.shadowTransition) {
			this.shadowTransition.getFromState().removeTransition(this.shadowTransition);
			this.shadowTransition = undefined;
		}
		this.automaton.drawAllTransitions(this.canvas);
	}

	statelessShadowTransition(pos) {
		if (this.shadowTransition) {
			this.removeShadowTransition();
		}
		this.automaton.drawAllTransitions(this.canvas);
		const context = this.canvas.getContext("2d");
		const shadowColor = "rgba(139, 138, 150, 0.5)";
		Arrow.drawArrow(context, this.startState.pos, pos, shadowColor);
	}

	startTransition(element) {
		const id = element.attr("id");
		this.startState = this.automaton.getStateById(id);
	}

	endTransition(element) {
		const id = element.attr("id");
		const endState = this.automaton.getStateById(id);
		this.automaton.addTransition(this.startState, endState);
		this.startState = undefined;
		this.automaton.drawAllTransitions(this.canvas);
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

			if (this.tool === "point") {
				if (!controlKey && !shiftKey) {
					this.unselectAllStates();
				}
			} else if (this.tool === "state") {
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

			if (this.tool === "point" && this.clicked && this.lastMousePos) {
				// drag selected states
				const stateOffset = new Point(pos.x - this.lastMousePos.x, pos.y - this.lastMousePos.y);
				this.selectedStates.forEach((s) => {
					s.getPos().add(stateOffset);
				});
				this.lastMousePos = pos;
				this.draw();
			} else if (this.tool === "state") {
				this.moveShadowState(pos);
			} else if (this.tool === "transition" && this.startState) {
				this.statelessShadowTransition(pos);
			}
		});

		// lift mouse up on editor
		this.editorWrap.on("mouseup", (e) => {
			e.stopPropagation();
			this.stopDrag();

			if (this.tool === "transition") {
				this.startState = undefined;
				this.removeShadowTransition();
			}
		});

		// take mouse out of editor
		this.editorWrap.on("mouseleave", (e) => {
			e.stopPropagation();
			this.stopDrag();

			if (this.tool === "transition") {
				this.startState = undefined;
				this.removeShadowTransition();
			}
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
				this.automaton.removeState(state);
				this.automaton.drawAllTransitions(this.canvas);
			}
		});

		// put mouse down on state
		state.on("mousedown", (e) => {
			e.stopPropagation();
			const offset = $(this.editorWrap).offset();
			const xPos = Math.round(e.clientX - offset.left);
			const yPos = Math.round(e.clientY - offset.top);
			const pos = new Point(xPos, yPos);

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
				this.removeShadowTransition();
				this.endTransition($(e.currentTarget));
			}
		});

		// move mouse on state
		state.on("mousemove", (e) => {
			if (this.tool === "transition" && this.startState) {
				this.createShadowTransition(stateObj);
				e.stopPropagation();
			}
		});
	}
}
