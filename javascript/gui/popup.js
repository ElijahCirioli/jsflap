class PopupMessage {
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

class PopupThemeChoiceMessage extends PopupCancelMessage {
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
