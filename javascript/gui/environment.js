class Environment {
	constructor(tabElement) {
		this.tab = tabElement;
		this.name = this.tab.children(".environment-tab-name").text();
		this.content = this.createContent();
		this.id = this.generateId();

		// wrap the callback function to preserve "this"
		const callback = () => {
			this.testAllInputs();
		};

		this.input = new InputContainer(this.content, callback);
		this.editor = new Editor(this.content, callback);

		this.setupListeners();
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

	testAllInputs() {
		const words = this.input.aggregateAllInputs();
		for (const word of words) {
			const sanitizedWord = word[0].replaceAll(lambdaChar, "");
			words.set(word[0], this.editor.getAutomaton().languageContains(sanitizedWord));
		}
		this.input.displayValidity(words);
		this.updateLocalStorage();
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

	updateLocalStorage() {
		const data = this.getSaveObject();
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
	}
}
