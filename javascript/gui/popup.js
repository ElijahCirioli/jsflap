class PopupMessage {
	// normal confirm message

	constructor(title, message, onConfirm, doReturn) {
		this.content = $(`
        <div class="popup-message">
            <h2 class="popup-message-title">${title}</h2>
            <div class="popup-message-content">
                <p class="popup-message-text">${message}</p>
                <div class="popup-message-buttons"></div>
            </div>
        </div>`);
		this.buttons = this.content.children(".popup-message-content").children(".popup-message-buttons");
		this.confirmButton = $(`<button class="popup-message-button">Okay</button>`);
		this.buttons.append(this.confirmButton);
		this.confirmButton.click((e) => {
			onConfirm();
		});

		if (doReturn) {
			return this.content;
		}
	}
}

class PopupCancelMessage extends PopupMessage {
	// confirm or cancel message

	constructor(title, message, onConfirm, onCancel, doReturn) {
		super(title, message, onConfirm, false);

		this.cancelButton = $(`<button class="popup-message-button">Cancel</button>`);
		this.buttons.prepend(this.cancelButton);
		this.cancelButton.click((e) => {
			onCancel();
		});

		if (doReturn) {
			return this.content;
		}
	}
}

class PopupEnvironmentChoiceMessage extends PopupCancelMessage {
	// choose an environment message

	constructor(onConfirm, onCancel, doReturn) {
		super(
			"Choose automaton",
			"",
			() => {
				onConfirm(this.choice);
			},
			onCancel,
			false
		);

		this.content.children(".popup-message-content").children(".popup-message-text").remove();

		let count = 0;
		const dropdown = $(`<div class="environment-dropdown" tabindex="1"></div>`);
		environments.forEach((env) => {
			if (
				env !== activeEnvironment &&
				env.getEditor() !== undefined &&
				env.getEditor().getType() === "finite"
			) {
				const button = $(`<button class="dropdown-item">${env.getName()}</button>`);
				button.click((e) => {
					if (this.choice !== env) {
						button.blur();
					}
					this.choice = env;
					dropdown.children().removeClass("dropdown-selected");
					button.addClass("dropdown-selected");
				});
				dropdown.append(button);
				if (count === 0) {
					this.choice = env;
				}
				count++;
			}
		});
		dropdown.children().first().addClass("dropdown-selected");
		const dropdownContainer = $(`<div class="environment-dropdown-container">
			<div class="dropdown-down-arrow">
				<i class="fas fa-chevron-down"></i>
			</div>
			<div class="dropdown-up-arrow">
				<i class="fas fa-chevron-up"></i>
			</div>
		</div>`);
		dropdownContainer.append(dropdown);

		this.buttons.before(dropdownContainer);

		if (doReturn) {
			return this.content;
		}
	}
}

class PopupThemeChoiceMessage extends PopupCancelMessage {
	// choose different color options message

	constructor(onConfirm, onCancel, doReturn) {
		super("Choose theme", "Editor theme", onConfirm, onCancel, false);

		const themeChoiceButtons = $(`<div class="popup-message-buttons popup-message-characters"></div>`);

		themeChoiceButtons.append(this.createThemeButton("dark", "Dark"));
		themeChoiceButtons.append(this.createThemeButton("light", "Light"));
		this.buttons.before(themeChoiceButtons);

		this.buttons.before(`<p class="popup-message-text">State color</p>`);

		const stateChoiceButtons = $(
			`<div class="popup-message-buttons popup-message-characters state-color-buttons"></div>`
		);

		stateChoiceButtons.append(this.createColorButton("yellow"));
		stateChoiceButtons.append(this.createColorButton("red"));
		stateChoiceButtons.append(this.createColorButton("purple"));
		stateChoiceButtons.append(this.createColorButton("blue"));
		stateChoiceButtons.append(this.createColorButton("green"));
		this.buttons.before(stateChoiceButtons);

		this.content
			.children(".popup-message-content")
			.children(".popup-message-text")
			.addClass("popup-color-text");
		stateChoiceButtons.children(`.${stateColor}-color`).addClass("chosen-state-color");
		themeChoiceButtons.children(`.${editorTheme}-button`).addClass("chosen-color");

		if (doReturn) {
			return this.content;
		}
	}

	createColorButton(color) {
		const button = $(
			`<button class="popup-message-button state-color-button ${color}-color"><i class="fas fa-circle"></i></button>`
		);

		button.click((e) => {
			stateColor = color;
			$(".chosen-state-color").removeClass("chosen-state-color");
			button.addClass("chosen-state-color");
			Colors.update();
		});

		return button;
	}

	createThemeButton(theme, text) {
		const button = $(
			`<button class="popup-message-button theme-color-button ${theme}-button">${text}</button>`
		);

		button.click((e) => {
			editorTheme = theme;
			$(".chosen-color").removeClass("chosen-color");
			button.addClass("chosen-color");
			Colors.update();
		});

		return button;
	}
}

class PopupEditorChoiceMessage {
	// choose what type of automaton to create

	constructor(onFinite, onPushdown, onTuring, doReturn) {
		this.content = $(`
        <div class="popup-message">
            <h2 class="popup-message-title">Create new</h2>
            <div class="popup-message-content">
                <div class="popup-message-vertical-buttons popup-editor-choice-buttons"></div>
            </div>
        </div>`);
		this.buttons = this.content
			.children(".popup-message-content")
			.children(".popup-message-vertical-buttons");

		this.finiteButton = $(
			`<button class="popup-message-button vertical-button">Finite State Automaton</button>`
		);
		this.buttons.append(this.finiteButton);
		this.finiteButton.click((e) => {
			onFinite();
		});

		this.pushdownButton = $(
			`<button class="popup-message-button vertical-button">Pushdown Automaton</button>`
		);
		this.buttons.append(this.pushdownButton);
		this.pushdownButton.click((e) => {
			onPushdown();
		});

		this.turingButton = $(`<button class="popup-message-button vertical-button">Turing Machine</button>`);
		this.buttons.append(this.turingButton);
		this.turingButton.click((e) => {
			onTuring();
		});

		if (doReturn) {
			return this.content;
		}
	}
}

class PopupSettingsMessage extends PopupCancelMessage {
	// settings menu

	constructor(onConfirm, onCancel, doReturn) {
		super(
			"Settings",
			"",
			() => {
				if (this.settings.initialStackChar === "" || this.settings.initialStackChar === ",") {
					this.settings.initialStackChar = initialStackChar;
				}
				onConfirm(this.settings);
			},
			onCancel,
			false
		);
		this.content.children(".popup-message-content").children(".popup-message-text").remove();
		this.content.children(".popup-message-content").css("gap", "20px");

		this.settings = {
			lambdaChar: lambdaChar,
			blankTapeChar: blankTapeChar,
			maxConfigurations: maxConfigurations,
			initialStackChar: initialStackChar,
		};

		const lambdaChoiceButtons = $(`
		<div class="popup-message-buttons-wrap">
			<p class="popup-message-form-label" title="The character representing the empty string.">Lambda character:</p>
			<div class="popup-message-buttons popup-message-characters"></div>
		</div>`);
		const lambdaButton = $(`<button class="popup-message-button character-button">\u03BB</button>`);
		const epsilonButton = $(`<button class="popup-message-button character-button">\u03B5</button>`);

		if (lambdaChar === "\u03BB") {
			lambdaButton.addClass("chosen-character");
		} else {
			epsilonButton.addClass("chosen-character");
		}

		lambdaButton.click((e) => {
			lambdaButton.addClass("chosen-character");
			epsilonButton.removeClass("chosen-character");
			this.settings.lambdaChar = "\u03BB";
		});
		epsilonButton.click((e) => {
			epsilonButton.addClass("chosen-character");
			lambdaButton.removeClass("chosen-character");
			this.settings.lambdaChar = "\u03B5";
		});

		lambdaChoiceButtons.children(".popup-message-characters").append(lambdaButton);
		lambdaChoiceButtons.children(".popup-message-characters").append(epsilonButton);
		this.buttons.before(lambdaChoiceButtons);

		const blankTapeChoiceButtons = $(`
		<div class="popup-message-buttons-wrap">
			<p class="popup-message-form-label" title="The character representing a blank cell on the tape.">Blank tape character:</p>
			<div class="popup-message-buttons popup-message-characters"></div>
		</div>`);
		const boxButton = $(
			`<button class="popup-message-button character-button character-button-box">\u2610</button>`
		);
		const nullButton = $(`<button class="popup-message-button character-button">\u2205</button>`);

		if (blankTapeChar === "\u2610") {
			boxButton.addClass("chosen-character");
		} else {
			nullButton.addClass("chosen-character");
		}

		boxButton.click((e) => {
			boxButton.addClass("chosen-character");
			nullButton.removeClass("chosen-character");
			this.settings.blankTapeChar = "\u2610";
		});
		nullButton.click((e) => {
			nullButton.addClass("chosen-character");
			boxButton.removeClass("chosen-character");
			this.settings.blankTapeChar = "\u2205";
		});

		blankTapeChoiceButtons.children(".popup-message-characters").append(boxButton);
		blankTapeChoiceButtons.children(".popup-message-characters").append(nullButton);
		this.buttons.before(blankTapeChoiceButtons);

		const form = $(`
		<form class="popup-message-form">
			<p class="popup-message-form-label" title="The character that signifies the bottom of the stack for pushdown automata.">Initial stack contents: </p>
			<input type="text" spellcheck="false" maxlength="1" class="popup-message-form-input" value="${initialStackChar}">
		</form>`);
		form.on("submit", (e) => {
			e.preventDefault();
		});

		const input = form.children(".popup-message-form-input");
		input.on("focusout", (e) => {
			if (input.val() === "" || input.val() === ",") {
				input.val(initialStackChar);
			}
		});
		input.on("keyup change", (e) => {
			if (input.val().length > 0) {
				this.settings.initialStackChar = input.val();
			}
		});

		const sliderWrap = $(`
		<div class="popup-message-form popup-message-form-bottom">
			<p class="popup-message-form-label" title="The maximum number of configurations that will be examined when parsing words with pushdown automata. More non-determinism can lead to more configurations.">Maximum configurations: </p>
			<div class="popup-message-form-range-wrap">
				<input type="range" min="5" max="500" value="${maxConfigurations / 10}" class="popup-message-form-range">
				<p class="popup-message-form-label" class="num-configurations-label">${maxConfigurations}</p>
			</div>
		</div>`);

		const slider = sliderWrap
			.children(".popup-message-form-range-wrap")
			.children(".popup-message-form-range");
		slider.on("change mousedown mousemove", (e) => {
			const num = parseInt(slider.val()) * 10;
			this.settings.maxConfigurations = num;
			slider.next().text(num);
		});

		this.buttons.before(form);
		this.buttons.before(sliderWrap);

		if (doReturn) {
			return this.content;
		}
	}
}

class PopupRegexInputMessage extends PopupCancelMessage {
	// input a regular expression message

	constructor(onConfirm, onCancel, doReturn) {
		super(
			"Construct from RegEx",
			"This will remove the existing finite state automaton.",
			() => {
				const expression = this.form.children("input").val();
				onConfirm(expression);
			},
			onCancel,
			false
		);

		this.form = $(`
		<form>
			<input id="regex-input" type="text" spellcheck="false" maxlength="60" placeholder="Input regular expression" autocomplete="off">
		</form>`);

		this.form.on("submit", (e) => {
			e.preventDefault();
		});

		this.content.children(".popup-message-content").children(".popup-message-text").before(this.form);

		const helpWindow = $(`
		<div id="regex-help-wrap">
			<div id="regex-help-icon">
				<i class="fas fa-solid fa-circle-question"></i>
			</div>
			<div id="regex-help-window">
				<div class="regex-help-line">
					<p><span>ABC</span></p>
					<p>Matches <span>ABC</span></p>
				</div>
				<div class="regex-help-line">
					<p><span>A|B</span></p>
					<p>Matches either <span>A</span> or <span>B</span></p>
				</div>
				<div class="regex-help-line">
					<p><span>(AB)|[CD]</span></p>
					<p>Matches either <span>AB</span> or <span>CD</span></p>
				</div>
				<div class="regex-help-line">
					<p><span>A*</span></p>
					<p>Matches 0 or more <span>A</span>s</p>
				</div>
				<div class="regex-help-line">
					<p><span>A+</span></p>
					<p>Matches 1 or more <span>A</span>s</p>
				</div>
			</div>
		</div>
		`);
		this.form.before(helpWindow);

		this.content
			.children(".popup-message-content")
			.children(".popup-message-buttons")
			.children()
			.last()
			.html("Construct NFA");

		if (doReturn) {
			return this.content;
		}
	}
}
