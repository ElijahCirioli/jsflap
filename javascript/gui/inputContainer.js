class InputContainer {
	constructor(content, callback) {
		this.inputWrap = content.children(".environment-sidebar").children(".inputs-wrap");
		this.triggerTest = () => {
			callback(false);
		};

		this.setupContainer();
		this.setupListeners();
	}

	aggregateAllInputs() {
		const allInputs = new Map();
		this.inputContent
			.children(".inputs-form")
			.children(".inputs-form-item")
			.toArray()
			.forEach((item) => {
				const itemInput = $(item).children(".inputs-form-item-input");
				if (itemInput.val().length > 0) {
					allInputs.set(itemInput.val(), false);
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
					if (inputs.get(word)) {
						$(item).children(".inputs-form-item-output").children(".accepted").show();
					} else {
						$(item).children(".inputs-form-item-output").children(".rejected").show();
					}
				}
			});
	}

	setupContainer() {
		this.inputWrap.append(`<h1 class="environment-sidebar-title">Test inputs</h1>`);
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

	createSingleInput() {
		const form = this.inputContent.children(".inputs-form");
		const input = $(`<input type="text" spellcheck="false" maxlength="256" class="inputs-form-item-input">`);
		const output = $(`
        <div class="inputs-form-item-output">
            <i class="fas fa-times-circle rejected"></i>
            <i class="fas fa-check-circle accepted"></i>
        </div>`);
		output.children().hide();
		const wrap = $(`<div class="inputs-form-item"></div>`);
		wrap.append(input);
		wrap.append(output);
		form.append(wrap);

		input.on("keydown", (e) => {
			e = window.event || e;
			const key = e.key;

			if (key === "Tab" || key === "Enter") {
				if (input.val().length === 0) {
					input.val(lambdaChar);
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
	}

	setupListeners() {
		const buttonsWrap = this.inputContent.children(".inputs-buttons-wrap");

		// lambda button
		buttonsWrap.children(".inputs-lambda-button").click((e) => {
			const lastItem = this.inputContent.children(".inputs-form").children(".inputs-form-item").last();
			if (lastItem.children(".inputs-form-item-input").val().length > 0) {
				this.createSingleInput();
			}
			this.inputContent.children(".inputs-form").children(".inputs-form-item").last().children(".inputs-form-item-input").val(lambdaChar);
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
	}
}
