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

		this.input = new InputContainer(this.content, callback);
		this.messages = new MessagesContainer(this.content);
		this.editor = new Editor(this.content, callback);
		this.popups = this.content.children(".editor").children(".editor-popup-container");

		this.setupListeners();
		this.updateHistory();
	}

	getContent() {
		return this.content;
	}

	getEditor() {
		return this.editor;
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

	generateId() {
		const possibleChars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");
		const idLength = 32;
		let id = "";
		for (let i = 0; i < idLength; i++) {
			id += possibleChars[Math.floor(Math.random() * possibleChars.length)];
		}
		return id;
	}

	testAllInputs(automataChanged) {
		if (!this.respondToTriggers) {
			return;
		}
		const words = this.input.aggregateAllInputs();
		for (const word of words) {
			const sanitizedWord = word[0].replaceAll(lambdaChar, "");
			words.set(word[0], this.editor.getAutomaton().languageContains(sanitizedWord));
		}
		this.input.displayValidity(words);
		this.messages.generateMessages(this.editor.getAutomaton());
		if (automataChanged) {
			console.log("adding to stack");
			this.updateHistory();
		}
	}

	createContent() {
		const content = $(`
			<div class="environment-wrap">
				<div class="tool-bar">
					<button class="tool-item active" id="point-tool">
						<i class="fas fa-mouse-pointer"></i>
					</button>
					<button class="tool-item" id="pan-tool">
						<i class="fas fa-arrows-alt"></i>
					</button>
					<button class="tool-item" id="state-tool">
						<i class="fas fa-circle"></i>
					</button>
					<button class="tool-item" id="transition-tool">
						<i class="fas fa-long-arrow-alt-right"></i>
					</button>
					<button class="tool-item" id="chain-tool">
						<i class="fas fa-link"></i>
					</button>
					<button class="tool-item" id="trash-tool">
						<i class="fas fa-trash-alt"></i>
					</button>
				</div>
				<div class="editor" tabindex="0">
					<div class="editor-popup-container"></div>
					<div class="editor-zoom-container">
						<div class="zoom-in-out-wrap">
							<button class="zoom-button" id="zoom-in-button"><i class="fas fa-plus"></i></button>
							<button class="zoom-button" id="zoom-out-button"><i class="fas fa-minus"></i></button>
						</div>
						<button class="zoom-button" id="zoom-fit-button"><i class="fas fa-expand"></i></button>
						<button class="zoom-button" id="zoom-home-button"><i class="fas fa-home"></i></button>
					</div>
					<div class="editor-label-container"></div>
					<div class="editor-state-container"></div>
					<canvas class="editor-canvas"></canvas>
				</div>
				<div class="environment-sidebar">
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

	addPopupMessage(message) {
		this.popups.empty();
		this.popups.append(message);
		this.popups.show();
	}

	removePopupMessages() {
		this.popups.empty();
		this.popups.hide();
	}

	isEmpty() {
		return this.editor.getAutomaton().getStates().size === 0;
	}

	forgetMousePos() {
		this.editor.pasteMousePos = undefined;
	}

	undo() {
		if (this.history.length === 0) {
			return;
		}
		// this is really inefficient since I am remaking the whole automaton from scratch but it's easiest given the tools I've already made
		this.historyPos = Math.min(this.historyPos + 1, this.history.length - 1);
		this.respondToTriggers = false;
		this.content.children(".editor").children(".editor-state-container").children(".state").not(".preview-state").remove();
		this.content.children(".editor").children(".editor-label-container").children(".label-form").remove();
		this.editor.automaton = new Automaton();
		FileParser.parseJSON(this.history[this.historyPos], false, this);
		this.respondToTriggers = true;
		this.testAllInputs(false);
	}

	redo() {
		if (this.history.length === 0 || this.historyPos === 0) {
			return;
		}
		// this is really inefficient since I am remaking the whole automaton from scratch but it's easiest given the tools I've already made
		this.historyPos = Math.max(this.historyPos - 1, 0);
		this.respondToTriggers = false;
		this.content.children(".editor").children(".editor-state-container").children(".state").not(".preview-state").remove();
		this.content.children(".editor").children(".editor-label-container").children(".label-form").remove();
		this.editor.automaton = new Automaton();
		FileParser.parseJSON(this.history[this.historyPos], false, this);
		this.respondToTriggers = true;
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
		const dataString = JSON.stringify(data);
		window.localStorage.setItem(this.id, dataString);
	}

	getSaveObject() {
		const data = {
			name: this.name,
			id: this.id,
			updated: Date.now(),
			states: [],
			transitions: [],
		};
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
		this.content
			.children(".tool-bar")
			.children(".tool-item")
			.click((e) => {
				e.stopPropagation();
				const target = $(e.currentTarget);
				this.content.children(".tool-bar").children(".tool-item").removeClass("active");
				target.addClass("active");
				const tool = target.attr("id").split("-")[0];
				this.editor.setTool(tool);
			});

		this.tab.children(".environment-tab-name").on("keyup change", (e) => {
			this.name = this.tab.children(".environment-tab-name").text();
			this.updateLocalStorage();
		});

		this.tab.children(".environment-tab-name").on("keydown", (e) => {
			e = window.event || e;
			const key = e.key;
			if (key === "Enter") {
				e.preventDefault();
			}
		});

		this.popups.on("click mousedown mouseup keydown keyup", (e) => {
			e.stopPropagation();
		});
	}
}
