class Editor {
	constructor(parent) {
		this.parent = parent;
		this.tool = "point";
		this.startState = undefined;
		this.automaton = new Automaton();

		this.editorWrap = this.parent.children(".editor");
		this.canvas = this.editorWrap.children(".editor-canvas")[0];
		this.statesWrap = this.editorWrap.children(".editor-state-container");
		this.shadowState = undefined;

		this.resizeCanvas();
		this.setupListeners();
	}

	setTool(newTool) {
		this.tool = newTool;

		this.statesWrap.children(".shadow-state").remove();
		this.startState = undefined;
		if (this.tool === "point") {
			this.statesWrap.children(".state").css("cursor", "grab");
		} else if (this.tool === "state") {
			this.statesWrap.children(".state").css("cursor", "pointer");
			this.createShadowState();
		} else if (this.tool === "transition") {
			this.statesWrap.children(".state").css("cursor", "crosshair");
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
		this.setupStateListeners(element);
		this.automaton.addState(pos, name, element);
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

	drawShadowTransition(pos) {
		if (!this.startState) {
			return;
		}
		this.automaton.drawAllTransitions(this.canvas);
		const context = this.canvas.getContext("2d");
		context.lineWidth = 2;
		context.strokeStyle = "rgba(139, 138, 150, 0.5)";
		context.beginPath();
		context.moveTo(this.startState.pos.x, this.startState.pos.y);
		context.lineTo(pos.x, pos.y);
		context.stroke();
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

			if (this.tool === "state") {
				this.moveShadowState(pos);
			} else if (this.tool === "transition") {
				this.drawShadowTransition(pos);
			}
		});

		// lift mouse up on editor
		this.editorWrap.on("mouseup", (e) => {
			e.stopPropagation();
			const offset = $(this.editorWrap).offset();
			const xPos = Math.round(e.clientX - offset.left);
			const yPos = Math.round(e.clientY - offset.top);
			const pos = new Point(xPos, yPos);

			if (this.tool === "transition") {
				this.startState = undefined;
				this.automaton.drawAllTransitions(this.canvas);
			}
		});
	}

	setupStateListeners(state) {
		// put mouse down on state
		state.on("mousedown", (e) => {
			e.stopPropagation();
			if (this.tool === "transition" && !this.startState) {
				this.startTransition($(e.currentTarget));
			}
		});

		// lift mouse up on state
		state.on("mouseup", (e) => {
			e.stopPropagation();
			if (this.tool === "transition" && this.startState) {
				this.endTransition($(e.currentTarget));
			}
		});

		// move mouse on state
		state.on("mousemove", (e) => {
			e.stopPropagation();
			const id = $(e.currentTarget).attr("id");
			const state = this.automaton.getStateById(id);
			if (this.tool === "transition") {
				this.drawShadowTransition(state.pos);
			}
		});
	}
}
