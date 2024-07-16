class Environment {
	constructor(tabElement) {
		this.tab = tabElement;
		this.name = this.tab.children(".environment-tab-name").text();
		this.content = this.createContent();
		this.id = this.generateId();

		this.respondToTriggers = true;
		this.history = [];
		this.maxHistoryDepth = 20;
		this.historyPos = 0;

		// wrap the callback function to preserve "this"
		const callback = (change) => {
			this.testAllInputs(change);
		};

		this.input = new InputContainer(this, callback);
		this.stepInput = new StepInputContainer(this, callback);
		this.messages = new MessagesContainer(this.content);
		this.popups = this.content.children(".editor").children(".editor-popup-container");
		this.addPopupMessage(
			new PopupEditorChoiceMessage(
				() => {
					this.createFiniteEditor();
				},
				() => {
					this.createPushdownEditor();
				},
				() => {
					this.createTuringEditor();
				},
				true
			)
		);

		this.resizeCanvas();
		this.setupListeners();
	}

	getContent() {
		return this.content;
	}

	getEditor() {
		return this.editor;
	}

	hasEditor() {
		return this.editor !== undefined;
	}

	getType() {
		if (this.editor) {
			return this.editor.getType();
		}
		return "none";
	}

	getName() {
		return this.name;
	}

	setName(newName) {
		this.name = newName;
		this.tab.children(".environment-tab-name").text(newName);
	}

	getTab() {
		return this.tab;
	}

	getId() {
		return this.id;
	}

	setId(newId) {
		this.id = newId;
	}

	getInput() {
		return this.input;
	}

	getStepInput() {
		return this.stepInput;
	}

	createFiniteEditor() {
		// wrap the callback function to preserve "this"
		const callback = (change) => {
			this.testAllInputs(change);
		};

		this.editor = new Editor(this.content, callback);
		this.updateHistory();
		this.removePopupMessages();
	}

	createPushdownEditor() {
		// wrap the callback function to preserve "this"
		const callback = (change) => {
			this.testAllInputs(change);
		};

		this.editor = new PushdownEditor(this.content, callback);
		this.updateHistory();
		this.removePopupMessages();
	}

	createTuringEditor() {
		// wrap the callback function to preserve "this"
		const callback = (change) => {
			this.testAllInputs(change);
		};

		this.editor = new TuringEditor(this.content, callback);
		this.updateHistory();
		this.removePopupMessages();
		this.input.setupContainerForTuringMachine();
		this.stepInput.setupContainerForTuringMachine();
	}

	generateId() {
		const possibleChars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";
		const idLength = 32;
		let id = "";
		for (let i = 0; i < idLength; i++) {
			id += possibleChars[Math.floor(Math.random() * possibleChars.length)];
		}
		return id;
	}

	testAllInputs(automataChanged) {
		if (!this.respondToTriggers || this.editor === undefined) {
			return;
		}

		if (this.input.isVisible()) {
			// gather all inputs from multiple run sidebar
			const inputs = this.input.aggregateAllInputs();
			if (this.editor.getType() === "turing") {
				for (const tape of inputs) {
					// get the Turing machine result
					inputs.set(tape[0], this.editor.getAutomaton().parseInput(tape[0].split("")));
				}
				this.input.displayTapeOutputs(inputs);
			} else {
				for (const word of inputs) {
					const sanitizedWord = word[0].replaceAll(lambdaChar, "");
					// find whether it's in the language
					inputs.set(word[0], this.editor.getAutomaton().languageContains(sanitizedWord));
				}
				this.input.displayValidity(inputs);
			}
		} else if (this.stepInput.isVisible()) {
			// gather input from step-by-step sidebar
			const word =
				this.stepInput.getNewInput() || (this.editor.getType() === "turing" ? "" : undefined);
			if (word !== undefined) {
				// make sure the input isn't empty
				if (word.length === 0 && this.editor.getType() !== "turing") {
					this.stepInput.restoreDefault();
				} else {
					// get the parsing steps
					let parseSteps;
					if (this.editor.getType() === "turing") {
						parseSteps = this.editor.getAutomaton().getParseSteps(word.split(""));
					} else {
						const sanitizedWord = word.replaceAll(lambdaChar, "");
						parseSteps = this.editor.getAutomaton().getParseSteps(sanitizedWord);
					}

					if (parseSteps.length > 0) {
						this.stepInput.drawTree(parseSteps);
						if (!automataChanged) {
							this.stepInput.selectStep(0, 0, true, true);
						}
					} else {
						this.stepInput.restoreDefault();
					}
				}
			}
		}

		// generate messages about the automaton
		this.messages.generateMessages(this.editor.getAutomaton());

		// save to undo/browser history if requested
		if (automataChanged) {
			this.updateHistory();
		}
	}

	createContent() {
		const content = $(`
			<div class="environment-wrap">
				<div class="tool-bar">
					<button title="Pointer tool" class="tool-item active" id="point-tool">
						<i class="fas fa-mouse-pointer"></i>
					</button>
					<button title="Pan tool" class="tool-item" id="pan-tool">
						<i class="fas fa-arrows-alt"></i>
					</button>
					<button title="State tool" class="tool-item" id="state-tool">
						<i class="fas fa-circle"></i>
					</button>
					<button title="Transition tool" class="tool-item" id="transition-tool">
						<i class="fas fa-arrow-right-long"></i>
					</button>
					<button title="Chain tool" class="tool-item" id="chain-tool">
						<i class="fas fa-link"></i>
					</button>
					<button title="Trash tool" class="tool-item" id="trash-tool">
						<i class="fas fa-trash-alt"></i>
					</button>
					<button title="Toggle snap to grid" class="tool-item" id="grid-toggle">
						<i class="fas fa-border-all"></i>
					</button>
				</div>
				<div class="editor" tabindex="0">
					<div class="editor-popup-container"></div>
					<div class="editor-zoom-container">
						<div class="zoom-in-out-wrap">
							<button title="Zoom in" class="zoom-button" id="zoom-in-button"><i class="fas fa-plus"></i></button>
							<button title="Zoom out" class="zoom-button" id="zoom-out-button"><i class="fas fa-minus"></i></button>
						</div>
						<button title="Zoom to fit" class="zoom-button" id="zoom-fit-button"><i class="fas fa-expand"></i></button>
						<button title="Zoom to home" class="zoom-button" id="zoom-home-button"><i class="fas fa-home"></i></button>
					</div>
					<div class="editor-label-container"></div>
					<div class="editor-state-container"></div>
					<canvas class="editor-canvas"></canvas>
				</div>
				<div class="environment-sidebar">
					<div class="sidebar-item step-wrap" hidden></div>
					<div class="sidebar-item inputs-wrap"></div>
					<div class="sidebar-item messages-wrap"></div>
				</div>
			</div>
		`);
		$("#content-wrap").append(content);
		return content;
	}

	removeContent() {
		this.content.remove();
	}

	resizeCanvas() {
		const canvas = this.content.children(".editor").children(".editor-canvas");
		canvas.hide();

		requestAnimationFrame(() => {
			const width = this.content.children(".editor").css("width");
			canvas[0].width = width.substring(width, width.length - 2);

			const height = this.content.children(".editor").css("height");
			canvas[0].height = height.substring(height, height.length - 2);

			canvas.show();

			if (this.editor) {
				this.editor.draw();
			}
		});
	}

	addPopupMessage(message) {
		this.popups.empty();
		this.popups.append(message);
		this.popups.show();
	}

	removePopupMessages() {
		this.popups.empty();
		this.popups.hide();
		if (this.editor === undefined) {
			this.addPopupMessage(
				new PopupEditorChoiceMessage(
					() => {
						this.createFiniteEditor();
					},
					() => {
						this.createPushdownEditor();
					},
					() => {
						this.createTuringEditor();
					},
					true
				)
			);
		}
	}

	isEmpty() {
		if (this.editor) {
			return this.editor.getAutomaton().getStates().size === 0;
		}
		return true;
	}

	forgetMousePos() {
		if (this.editor) {
			this.editor.pasteMousePos = undefined;
		}
	}

	undo() {
		if (this.history.length === 0 || this.editor === undefined) {
			return;
		}
		// this is really inefficient since I am remaking the whole automaton from scratch but it's easiest given the tools I've already made
		this.historyPos = Math.min(this.historyPos + 1, this.history.length - 1);
		this.respondToTriggers = false;
		this.content
			.children(".editor")
			.children(".editor-state-container")
			.children(".state")
			.not(".preview-state")
			.remove();
		this.content.children(".editor").children(".editor-label-container").children(".label-form").remove();
		if (this.editor.getType() === "pushdown") {
			this.editor.automaton = new PushdownAutomaton();
		} else if (this.editor.getType() === "turing") {
			this.editor.automaton = new TuringAutomaton();
		} else {
			this.editor.automaton = new Automaton();
		}
		FileParser.parseJSON(this.history[this.historyPos], false, this);
		this.respondToTriggers = true;
		this.content.children(".editor").focus();
		this.testAllInputs(false);
	}

	redo() {
		if (this.history.length === 0 || this.historyPos === 0 || this.editor === undefined) {
			return;
		}
		// this is really inefficient since I am remaking the whole automaton from scratch but it's easiest given the tools I've already made
		this.historyPos = Math.max(this.historyPos - 1, 0);
		this.respondToTriggers = false;
		this.content
			.children(".editor")
			.children(".editor-state-container")
			.children(".state")
			.not(".preview-state")
			.remove();
		this.content.children(".editor").children(".editor-label-container").children(".label-form").remove();
		if (this.editor.getType() === "pushdown") {
			this.editor.automaton = new PushdownAutomaton();
		} else if (this.editor.getType() === "turing") {
			this.editor.automaton = new TuringAutomaton();
		} else {
			this.editor.automaton = new Automaton();
		}
		FileParser.parseJSON(this.history[this.historyPos], false, this);
		this.respondToTriggers = true;
		this.content.children(".editor").focus();
		this.testAllInputs(false);
	}

	updateHistory() {
		const data = this.getSaveObject();

		// see if the automata has changed
		this.history.splice(0, this.historyPos);
		let automataDifference = this.history.length === 0;
		if (!automataDifference) {
			const lastAutomata = this.history[0];
			if (JSON.stringify(data.states) !== JSON.stringify(lastAutomata.states)) {
				automataDifference = true;
			} else if (JSON.stringify(data.transitions) !== JSON.stringify(lastAutomata.transitions)) {
				automataDifference = true;
			}
		}
		// add to the undo stack
		if (automataDifference) {
			this.history.unshift(data);
			if (this.history.length > this.maxHistoryDepth) {
				this.history.splice(this.maxHistoryDepth);
			}
			this.historyPos = 0;
		}

		// add to local storage
		if (data.states.length > 0 || data.transitions.length > 0) {
			const dataString = JSON.stringify(data);
			window.localStorage.setItem(this.id, dataString);
		}
	}

	getSaveObject() {
		// gets a fairly simplified data structure with all the key information about this environment/automaton

		const data = {
			name: this.name,
			id: this.id,
			updated: Date.now(),
			states: [],
			transitions: [],
			inputs: Array.from(this.input.aggregateAllInputs().keys()),
			stepInput: this.stepInput.getInput(),
		};

		if (this.editor === undefined) {
			return data;
		}

		data.type = this.editor.getType();
		const automaton = this.editor.getAutomaton();

		automaton.getStates().forEach((s) => {
			data.states.push({
				x: s.getPos().x,
				y: s.getPos().y,
				name: s.getName(),
				id: s.getId(),
				final: s.isFinal(),
				initial: s.isInitial(),
			});

			s.getTransitions().forEach((t) => {
				data.transitions.push({
					from: t.getFromState().getId(),
					to: t.getToState().getId(),
					labels: Array.from(t.getLabels()),
				});
			});
		});
		return data;
	}

	setupListeners() {
		// resize window
		$(window).resize((e) => {
			if (this.content.is(":visible")) {
				this.resizeCanvas();
			}
		});

		// change tools
		this.content
			.children(".tool-bar")
			.children(".tool-item")
			.not("#grid-toggle")
			.click((e) => {
				e.stopPropagation();
				const target = $(e.currentTarget);
				this.content
					.children(".tool-bar")
					.children(".tool-item")
					.not("#grid-toggle")
					.removeClass("active");
				target.addClass("active");
				if (this.editor) {
					const tool = target.attr("id").split("-")[0];
					this.editor.setTool(tool);
				}
			});

		// toggle snapping to grid
		this.content
			.children(".tool-bar")
			.children("#grid-toggle")
			.click((e) => {
				e.stopPropagation();
				const target = $(e.currentTarget);
				let newSetting = true;
				if (target.hasClass("active")) {
					target.removeClass("active");
					newSetting = false;
				} else {
					target.addClass("active");
				}

				if (this.editor) {
					this.editor.setAlignToGrid(newSetting);
				}
			});

		// type on name
		this.tab.children(".environment-tab-name").on("keyup change", (e) => {
			this.name = this.tab.children(".environment-tab-name").text();
			this.updateHistory();
		});

		this.tab.children(".environment-tab-name").on("keydown", (e) => {
			e = window.event || e;
			const key = e.key;
			if (key === "Enter") {
				e.preventDefault();
			}
		});

		// make popups block click through
		this.popups.on("click mousedown mouseup keydown keyup", (e) => {
			e.stopPropagation();
		});
	}
}
