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
	constructor(title, message, onConfirm, onCancel) {
		super(title, message, onConfirm, false);

		this.cancelButton = $(`<button class="popup-message-button">Cancel</button>`);
		this.buttons.prepend(this.cancelButton);
		this.cancelButton.click((e) => {
			onCancel();
		});
		return this.content;
	}
}
