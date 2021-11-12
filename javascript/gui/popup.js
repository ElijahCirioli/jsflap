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
