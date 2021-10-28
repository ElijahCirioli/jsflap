class Editor {
	constructor(parent) {
		this.parent = parent;
		this.tool = "point";
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
		if (this.tool === "state") {
			this.createShadowState();
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
		this.automaton.drawAllStates();
	}

	createState(pos) {
		const name = this.automaton.getNextName();
		const element = $(`<div class="state"><p class="state-name">${name}</p></div>`);
		this.statesWrap.append(element);
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

	setupListeners() {
		// resize window
		$(window).resize((e) => {
			this.resizeCanvas();
		});

		const editor = this.parent.children(".editor");

		// click on editor
		editor.click((e) => {
			e.stopPropagation();
			const offset = $(editor).offset();
			const xPos = Math.round(e.clientX - offset.left);
			const yPos = Math.round(e.clientY - offset.top);
			const pos = new Point(xPos, yPos);

			if (this.tool === "state") {
				this.createState(pos);
			}
		});

		// move mouse on editor
		editor.on("mousemove", (e) => {
			e.stopPropagation();
			const offset = $(editor).offset();
			const xPos = Math.round(e.clientX - offset.left);
			const yPos = Math.round(e.clientY - offset.top);
			const pos = new Point(xPos, yPos);

			if (this.tool === "state") {
				this.moveShadowState(pos);
			}
		});
	}
}
