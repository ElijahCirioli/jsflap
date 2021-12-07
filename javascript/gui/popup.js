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

class PopupCharacterChoiceMessage extends PopupCancelMessage {
	// choose lambda character message

	constructor(onConfirm, onCancel, doReturn) {
		super(
			"Choose character",
			"",
			() => {
				onConfirm(this.choice);
			},
			onCancel,
			false
		);
		this.content.children(".popup-message-content").children(".popup-message-text").remove();
		this.choice = lambdaChar;
		const choiceButtons = $(`<div class="popup-message-buttons popup-message-characters"></div>`);
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
			this.choice = "\u03BB";
		});
		epsilonButton.click((e) => {
			epsilonButton.addClass("chosen-character");
			lambdaButton.removeClass("chosen-character");
			this.choice = "\u03B5";
		});

		choiceButtons.append(lambdaButton);
		choiceButtons.append(epsilonButton);
		this.buttons.before(choiceButtons);

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
			if (env !== activeEnvironment && env.getEditor() !== undefined && env.getEditor().getType() === "finite") {
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

		const stateChoiceButtons = $(`<div class="popup-message-buttons popup-message-characters state-color-buttons"></div>`);

		stateChoiceButtons.append(this.createColorButton("yellow"));
		stateChoiceButtons.append(this.createColorButton("red"));
		stateChoiceButtons.append(this.createColorButton("purple"));
		stateChoiceButtons.append(this.createColorButton("blue"));
		stateChoiceButtons.append(this.createColorButton("green"));
		this.buttons.before(stateChoiceButtons);

		this.content.children(".popup-message-content").children(".popup-message-text").addClass("popup-color-text");
		stateChoiceButtons.children(`.${stateColor}-color`).addClass("chosen-state-color");
		themeChoiceButtons.children(`.${editorTheme}-button`).addClass("chosen-color");

		if (doReturn) {
			return this.content;
		}
	}

	createColorButton(color) {
		const button = $(`<button class="popup-message-button state-color-button ${color}-color"><i class="fas fa-circle"></i></button>`);

		button.click((e) => {
			stateColor = color;
			$(".chosen-state-color").removeClass("chosen-state-color");
			button.addClass("chosen-state-color");
			updateColors();
		});

		return button;
	}

	createThemeButton(theme, text) {
		const button = $(`<button class="popup-message-button theme-color-button ${theme}-button">${text}</button>`);

		button.click((e) => {
			editorTheme = theme;
			$(".chosen-color").removeClass("chosen-color");
			button.addClass("chosen-color");
			updateColors();
		});

		return button;
	}
}

class PopupEditorChoiceMessage {
	// choose what type of automaton to create

	constructor(onFinite, onPushdown, doReturn) {
		this.content = $(`
        <div class="popup-message">
            <h2 class="popup-message-title">Create new</h2>
            <div class="popup-message-content">
                <div class="popup-message-vertical-buttons"></div>
            </div>
        </div>`);
		this.buttons = this.content.children(".popup-message-content").children(".popup-message-vertical-buttons");

		this.finiteButton = $(`<button class="popup-message-button vertical-button">Finite State Automaton</button>`);
		this.buttons.append(this.finiteButton);
		this.finiteButton.click((e) => {
			onFinite();
		});

		this.pushdownButton = $(`<button class="popup-message-button vertical-button">Pushdown Automaton</button>`);
		this.buttons.append(this.pushdownButton);
		this.pushdownButton.click((e) => {
			onPushdown();
		});

		if (doReturn) {
			return this.content;
		}
	}
}

class PopupSettingsMessage extends PopupCancelMessage {
	// pushdown automata settings menu

	constructor(onConfirm, onCancel, doReturn) {
		super(
			"Parsing Settings",
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

		this.settings = {
			maxConfigurations: maxConfigurations,
			initialStackChar: initialStackChar,
		};

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

		const slider = sliderWrap.children(".popup-message-form-range-wrap").children(".popup-message-form-range");
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
