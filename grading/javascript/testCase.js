class TestCase {
	constructor(type) {
		this.type = type;

		this.createElement();
		this.setupListeners();
	}

	createElement() {
		this.element = $(`<tr class="test-case"></tr>`);
		const inputCell = $(`<td class="test-case-input"></td>`);
		this.input = $(
			`<input type="text" spellcheck="false" maxlength="256" placeholder="Input word" class="inputs-form-item-input" />`
		);
		inputCell.append(this.input);
		this.expectedOutput = $(
			`<td class="test-case-output test-case-output-expected">
				<i title="The word should not be accepted by the automaton." class="fas fa-times-circle rejected"></i>
				<i title="The word should be accepted by the automaton." class="fas fa-check-circle accepted"></i>
			</td>`
		);
		this.actualOutput = $(
			`<td class="test-case-output test-case-output-actual">
				<i title="The word is not accepted by the automaton." class="fas fa-times-circle rejected"></i>
				<i title="The word is accepted by the automaton." class="fas fa-check-circle accepted"></i>
				<i title="Unable to determine if the word is accepted by the automaton." class="fas fa-question-circle unknown"></i>
			</td>`
		);
		this.passOutput = $(
			`<td class="test-case-output test-case-output-pass">
				<i title="The test case did not pass." class="fas fa-times-circle rejected"></i>
				<i title="The test case passed." class="fas fa-check-circle accepted"></i>
			</td>`
		);

		// hide output icons
		this.expectedOutput.children().hide();
		this.expectedOutput.children(".accepted").show();
		this.actualOutput.children().hide();
		this.passOutput.children().hide();

		// add to row
		this.element.append(inputCell);
		this.element.append(this.expectedOutput);
		this.element.append(this.actualOutput);
		this.element.append(this.passOutput);

		$("#input-table-body").append(this.element);
	}

	setupListeners() {
		// setup events for changing expected output
		this.expectedOutput.click((e) => {
			if (this.expectedOutput.children(".accepted").is(":visible")) {
				this.expectedOutput.children(".accepted").hide();
				this.expectedOutput.children(".rejected").show();
			} else {
				this.expectedOutput.children(".rejected").hide();
				this.expectedOutput.children(".accepted").show();
			}
			gradeAllAutomata();
		});

		// setup typing key events for new input
		this.input.on("keydown", (e) => {
			e = window.event || e;
			e.stopPropagation();
			const key = e.key;

			if (key === "Tab" || key === "Enter") {
				if (this.isEmpty()) {
					// make a new input if there are no empty ones
					if (this.type === "turing") {
						this.input.val(blankTapeChar);
					} else {
						this.input.val(lambdaChar);
					}
					createSingleInputIfNeeded();
				}

				// make enter act like tab
				if (key === "Enter") {
					this.element.next().children(".test-case-input").children().focus();
				}
			}

			// stop them from typing commas
			if (key === ",") {
				e.preventDefault();
			}

			// move up one input
			if (key === "ArrowUp") {
				// make sure we're not at the top
				if (!this.isFirst()) {
					e.preventDefault();
					this.element.prev().children(".test-case-input").children().focus();
				}
			}

			// move down one input
			if (key === "ArrowDown") {
				// make sure we're not at the bottom
				if (!this.isLast()) {
					e.preventDefault();
					this.element.next().children(".test-case-input").children().focus();
				}
			}
		});

		this.input.on("keyup", createSingleInputIfNeeded);

		this.element.on("focusout", removeEmptyInputs);
	}

	removeElement() {
		this.element.remove();
	}

	getWord() {
		return this.input.val();
	}

	getExpectedResult() {
		return this.expectedOutput.children(".accepted").is(":visible");
	}

	getType() {
		return this.type;
	}

	isNondeterminismAllowed() {
		return $("#allow-nondeterminism").hasClass("checkbox-checked");
	}

	isEmpty() {
		return this.getWord().length === 0;
	}

	isFirst() {
		return this.element.is(":first-child");
	}

	isLast() {
		return this.element.is(":last-child");
	}

	setWord(word) {
		this.input.val(word);
	}

	setExpectedResult(accept) {
		this.showResultIcon(this.expectedOutput, accept);
	}

	setActualResult(result) {
		this.showResultIcon(this.actualOutput, result.actual);
		this.showResultIcon(this.passOutput, result.pass);
	}

	removeActualResult() {
		this.actualOutput.children().hide();
		this.passOutput.children().hide();
	}

	showResultIcon(iconWrap, result) {
		iconWrap.children(".accepted").hide();
		iconWrap.children(".rejected").hide();
		iconWrap.children(".unknown").hide();
		if (result) {
			iconWrap.children(".accepted").show();
		} else if (result === undefined) {
			iconWrap.children(".unknown").show();
		} else {
			iconWrap.children(".rejected").show();
		}
	}
}
