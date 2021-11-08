class Environment {
	constructor(tabElement) {
		this.tab = tabElement;
		this.name = this.tab.children(".environment-tab-name").text();
		this.content = this.createContent();

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

	getName() {
		return this.name;
	}

	testAllInputs() {
		const words = this.input.aggregateAllInputs();
		for (const word of words) {
			const sanitizedWord = word[0].replaceAll(lambdaChar, "");
			words.set(word[0], this.editor.getAutomaton().languageContains(sanitizedWord));
		}
		this.input.displayValidity(words);
	}

	runUpdatedInputs(words) {}

	createContent() {
		const content = $(`
			<div class="environment-wrap">
				<div class="tool-bar">
					<button class="tool-item active" id="point-tool">
						<i class="fas fa-mouse-pointer"></i>
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
				<div class="editor">
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
			const rawText = this.tab.children(".environment-tab-name").text();
			// try to remove all newline characters
			this.name = rawText.replace(/[\r\n\x0B\x0C\u0085\u2028\u2029]+/g, " ");
			this.tab.children(".environment-tab-name").text(this.name);
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
