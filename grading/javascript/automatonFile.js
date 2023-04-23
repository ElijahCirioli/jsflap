class AutomatonFile {
	constructor(file, environment) {
		this.fileName = file.name;
		if (environment) {
			this.name = environment.getName();
			this.automaton = environment.getEditor().getAutomaton();
			this.type = environment.getEditor().getType();
			this.saveObject = environment.getSaveObject();
			this.cachedWordResults = new Map();
			environment.getContent().remove();
		}
		this.createElement();
		this.setupListeners();

		gradeAutomaton(this);
	}

	createElement() {
		this.element = $(
			`<tr class="automaton-file">
				<td class="automaton-file-file"></td>
				<td class="automaton-file-name"></td>
				<td class="automaton-file-score"></td>
				<td class="automaton-file-actions"></td>
			</tr>`
		);
		$("#automata-table-body").append(this.element);

		this.element.children(".automaton-file-file").text(this.fileName);

		const buttons = this.element.children(".automaton-file-actions");
		this.deleteButton = $(
			`<button title="Remove automaton" class="automaton-file-button delete-button">
				<i class="fa-solid fa-trash-can"></i>
			</button>`
		);
		buttons.append(this.deleteButton);

		if (this.name === undefined) {
			this.element.children(".automaton-file-name").text("Failed to parse file");
			this.element.children(".automaton-file-name").addClass("red-color");
			return;
		}

		this.element.children(".automaton-file-name").text(this.name);
		this.element.children(".automaton-file-score").text("0/0");

		this.openButton = $(
			`<button title="Edit in jsFLAP" class="automaton-file-button">
				<i class="fa-solid fa-arrow-up-right-from-square"></i>
			</button>`
		);
		buttons.prepend(this.openButton);

		this.focusButton = $(`
			<button title="View test results" class="automaton-file-button">
				<i class="fa-solid fa-eye"></i>
			</button>`);
		buttons.prepend(this.focusButton);
	}

	setupListeners() {
		// delete row
		this.deleteButton.click((e) => {
			e.stopPropagation();

			this.delete();
		});

		// open in editor
		if (this.openButton) {
			this.openButton.click((e) => {
				e.stopPropagation();

				this.saveObject.stepInput = "";
				this.saveObject.input = [];

				const url = URLTransfer.export(this.saveObject);
				window.open(url, "_blank");
			});
		}

		// view results
		this.element.click((e) => {
			e.stopPropagation();

			selectAutomatonFile(this);
		});
	}

	highlight() {
		this.element.addClass("selected-automaton-file");
	}

	unhighlight() {
		this.element.removeClass("selected-automaton-file");
	}

	delete() {
		if (selectAutomatonFile === this) {
			selectAutomatonFile(undefined);
		}
		automatonFiles.splice(automatonFiles.indexOf(this), 1);
		this.element.remove();
	}

	getAutomaton() {
		return this.automaton;
	}

	getType() {
		return this.type;
	}

	getCachedResult(word) {
		return this.cachedWordResults.get(word);
	}

	getTestResults() {
		return this.testResults;
	}

	setCachedResults(results) {
		this.cachedWordResults = results;
	}

	setTestOutput(results) {
		this.testResults = results;
		const numPassed = results.filter((res) => res.pass).length;
		this.element.children(".automaton-file-score").text(`${numPassed}/${results.length}`);
	}
}
