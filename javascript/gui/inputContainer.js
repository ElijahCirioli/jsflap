class InputContainer {
	constructor(environment, callback) {
		this.inputWrap = environment.getContent().children(".environment-sidebar").children(".inputs-wrap");
		this.environment = environment;
		this.selection;

		this.triggerTest = () => {
			callback(false);
		};

		this.setupContainer();
		this.setupListeners();
	}

	aggregateAllInputs() {
		// get all the inputs from the form

		const allInputs = new Map();
		this.inputContent
			.children(".inputs-form")
			.children(".inputs-form-item")
			.toArray()
			.forEach((item) => {
				const itemInput = $(item).children(".inputs-form-item-input");
				if (itemInput.val().length > 0) {
					// set it's validity as false for now
					if (this.environment.getType() === "turing") {
						allInputs.set(itemInput.val(), { accept: false, tape: [], index: 0 });
					} else {
						allInputs.set(itemInput.val(), false);
					}
				}
			});
		return allInputs;
	}

	displayValidity(inputs) {
		this.inputContent
			.children(".inputs-form")
			.children(".inputs-form-item")
			.toArray()
			.forEach((item) => {
				const itemInput = $(item).children(".inputs-form-item-input");
				const word = itemInput.val();
				$(item).children(".inputs-form-item-output").children().hide();
				if (word.length > 0 && inputs.has(word)) {
					const accepted = inputs.get(word);
					if (accepted === undefined) {
						$(item).children(".inputs-form-item-output").children(".unknown").show();
					} else if (accepted) {
						$(item).children(".inputs-form-item-output").children(".accepted").show();
					} else {
						$(item).children(".inputs-form-item-output").children(".rejected").show();
					}
				}
			});
	}

	displayTapeOutputs(inputs) {
		this.inputContent
			.children(".inputs-form")
			.children(".inputs-form-item")
			.toArray()
			.forEach((item) => {
				const itemInput = $(item).children(".inputs-form-item-input");
				const inputTape = itemInput.val();
				$(item).children(".inputs-form-item-output").children().hide();
				$(item)
					.children(".inputs-form-item-output-tape")
					.html(`	<span class="tape-placeholder">Output tape</span>`);

				if (inputTape.length > 0 && inputs.has(inputTape)) {
					const accepted = inputs.get(inputTape).accept;
					if (accepted === undefined) {
						$(item).children(".inputs-form-item-output").children(".unknown").show();
					} else if (accepted) {
						$(item).children(".inputs-form-item-output").children(".accepted").show();

						const resultTape = inputs.get(inputTape).tape.join("");
						const resultIndex = inputs.get(inputTape).index;
						const highlightedResultTape = `${resultTape.substring(
							0,
							resultIndex
						)}<span class="tape-highlight">${
							resultTape[resultIndex]
						}</span>${resultTape.substring(resultIndex + 1)}`;
						$(item).children(".inputs-form-item-output-tape").html(highlightedResultTape);
					} else {
						$(item).children(".inputs-form-item-output").children(".rejected").show();
					}
				}
			});
	}

	setupContainer() {
		this.inputWrap.append(`
		<h1 class="environment-sidebar-title">Test inputs
			<button class="switch-button step-switch-button" title="Step-by-step test">
				<i class="fas fa-solid fa-code-fork"></i>
			</button>
		</h1>`);
		this.inputContent = $(`
        <div class="inputs-content">
            <form class="inputs-form">
            </form>
            <div class="inputs-buttons-wrap">
                <button class="inputs-button inputs-lambda-button">${lambdaChar}</button>
                <button class="inputs-button inputs-clear-button">Clear</button>
            </div>
        </div>`);
		this.createSingleInput();
		this.inputWrap.append(this.inputContent);
	}

	setupContainerForTuringMachine() {
		this.inputContent.children(".inputs-form").empty();
		const button = $(`<button class="inputs-button inputs-blank-button">${blankTapeChar}</button>`);
		this.inputContent
			.children(".inputs-buttons-wrap")
			.children(".inputs-lambda-button")
			.replaceWith(button);
		this.createSingleInput();

		button.click((e) => {
			if (this.selection) {
				const currVal = this.selection.element.val();
				const newVal =
					currVal.slice(0, this.selection.start) +
					blankTapeChar +
					currVal.slice(this.selection.end);
				const newSelectionIndex = this.selection.start + 1;
				this.selection.element.val(newVal);
				this.selection.element[0].setSelectionRange(newSelectionIndex, newSelectionIndex);
				this.selection.element.focus();

				const lastItem = this.inputContent
					.children(".inputs-form")
					.children(".inputs-form-item")
					.last();
				if (lastItem.children(".inputs-form-item-input").val().length > 0) {
					this.createSingleInput();
				}
			} else {
				this.inputContent
					.children(".inputs-form")
					.children(".inputs-form-item")
					.last()
					.children(".inputs-form-item-input")
					.val(blankTapeChar);
				this.createSingleInput();
			}

			this.triggerTest();
		});
	}

	createSingleInput() {
		const form = this.inputContent.children(".inputs-form");

		let input, output, tapeOutput;
		if (this.environment.getType() === "turing") {
			input = $(
				`<input type="text" spellcheck="false" maxlength="256" placeholder="Input tape" class="inputs-form-item-input">`
			);
			output = $(
				`<div class="inputs-form-item-output">
					<i title="The Turing machine did not halt." class="fas fa-times-circle rejected"></i>
					<i title="The Turing machine halted successfully." class="fas fa-check-circle accepted"></i>
					<i title="Maximum number of configurations reached. Unable to determine if the Turing machine will halt." class="fas fa-question-circle unknown"></i>
				</div>`
			);
			tapeOutput = $(
				`<p class="inputs-form-item-output-tape"><span class="tape-placeholder">Output tape</span></p>`
			);
		} else {
			input = $(
				`<input type="text" spellcheck="false" maxlength="256" placeholder="Input word" class="inputs-form-item-input" >`
			);
			output = $(
				`<div class="inputs-form-item-output">
					<i title="The word is not accepted by the automaton." class="fas fa-times-circle rejected"></i>
					<i title="The word is accepted by the automaton." class="fas fa-check-circle accepted"></i>
					<i title="Maximum number of configurations reached. Unable to determine if the word is accepted." class="fas fa-question-circle unknown"></i>
				</div>`
			);
		}

		output.children().hide();
		const wrap = $(`<div class="inputs-form-item"></div>`);
		wrap.append(input);
		if (tapeOutput) {
			wrap.append(tapeOutput);
		}
		wrap.append(output);
		form.append(wrap);

		// setup typing key events for new input
		input.on("keydown", (e) => {
			e = window.event || e;
			e.stopPropagation();
			const key = e.key;

			if (key === "Tab" || key === "Enter") {
				if (input.val().length === 0) {
					// make a new input if there are no empty ones
					if (this.environment.getType() === "turing") {
						input.val(blankTapeChar);
					} else {
						input.val(lambdaChar);
					}
					let foundEmpty = false;
					form.children(".inputs-form-item")
						.toArray()
						.forEach((item) => {
							const itemInput = $(item).children(".inputs-form-item-input");
							if (itemInput.val().length === 0) {
								foundEmpty = true;
							}
						});
					if (!foundEmpty) {
						this.createSingleInput();
					}
				}

				// make enter act like tab
				if (key === "Enter") {
					wrap.next().children(".inputs-form-item-input").focus();
				}
			}

			// stop them from typing commas
			if (key === ",") {
				e.preventDefault();
			}

			// move up one input
			if (key === "ArrowUp") {
				// make sure we're not at the top
				if (input !== form.first()) {
					e.preventDefault();
					wrap.prev().children(".inputs-form-item-input").focus();
				}
			}

			// move down one input
			if (key === "ArrowDown") {
				// make sure we're not at the bottom
				if (input !== form.last()) {
					e.preventDefault();
					wrap.next().children(".inputs-form-item-input").focus();
				}
			}
		});

		input.on("keyup", (e) => {
			// create a new input if there are no empty ones
			let foundEmpty = false;
			form.children(".inputs-form-item")
				.toArray()
				.forEach((item) => {
					const itemInput = $(item).children(".inputs-form-item-input");
					if (itemInput.val().length === 0) {
						foundEmpty = true;
					}
				});
			if (!foundEmpty) {
				this.createSingleInput();
			}
			this.triggerTest();
		});

		input.on("focusout", (e) => {
			// delete empty inputs when they lose focus
			if (input.val().length === 0) {
				const allInputs = form.children(".inputs-form-item").toArray();
				if (allInputs.length > 1) {
					let foundEmpty = false;
					allInputs.reverse().forEach((item) => {
						const itemInput = $(item).children(".inputs-form-item-input");
						if (itemInput.val().length === 0) {
							if (foundEmpty) {
								$(item).remove();
							}
							foundEmpty = true;
						}
					});
				}
			}
		});

		input.on("focusin click change keyup mousedown mouseup mouseenter mouseleave", (e) => {
			if (input.is(":focus")) {
				this.selection = {
					element: input,
					start: input[0].selectionStart,
					end: input[0].selectionEnd,
				};
			}
		});

		input.on("focusout", (e) => {
			if (!this.inputContent.is(":focus-within")) {
				this.selection = undefined;
			}
		});
		return input;
	}

	setupListeners() {
		const buttonsWrap = this.inputContent.children(".inputs-buttons-wrap");

		// lambda button
		buttonsWrap.children(".inputs-lambda-button").click((e) => {
			const lastItem = this.inputContent.children(".inputs-form").children(".inputs-form-item").last();
			if (lastItem.children(".inputs-form-item-input").val().length > 0) {
				this.createSingleInput();
			}
			this.inputContent
				.children(".inputs-form")
				.children(".inputs-form-item")
				.last()
				.children(".inputs-form-item-input")
				.val(lambdaChar);
			this.createSingleInput();
			this.triggerTest();
		});

		// clear button
		buttonsWrap.children(".inputs-clear-button").click((e) => {
			this.inputContent.children(".inputs-form").empty();
			this.createSingleInput();
			this.triggerTest();
		});

		// form change
		this.inputContent.children(".inputs-form").on("change", (e) => {
			this.triggerTest();
		});

		// form submit
		this.inputContent.children(".inputs-form").on("submit", (e) => {
			e.preventDefault();
		});

		// switch to step-by-step mode
		this.inputWrap
			.children("h1")
			.children(".switch-button")
			.click((e) => {
				this.inputWrap.siblings().show();
				this.inputWrap.siblings().find("input").focus();
				this.inputWrap.hide();
				$("#menu-test-multiple-button").show();
				$("#menu-test-step-button").hide();
				this.triggerTest();
			});
	}

	isVisible() {
		return this.inputWrap.is(":visible");
	}

	loadInputs(inputs) {
		this.inputContent.children(".inputs-form").empty();
		for (const word of inputs) {
			this.createSingleInput().val(word);
		}
		this.createSingleInput();
	}
}
