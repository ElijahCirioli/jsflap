class MessagesContainer {
	constructor(content) {
		this.messagesWrap = content.children(".environment-sidebar").children(".messages-wrap");
		this.setupContainer();
	}

	setupContainer() {
		this.messagesWrap.append(`<h1 class="environment-sidebar-title">Messages</h1>`);
		this.messagesContent = $(`
        <div class="messages-content">
        </div>`);
		this.messagesWrap.append(this.messagesContent);
	}

	generateMessages(automaton) {
		// generate all of the messages in some kind of priority queue
		const messages = [];
		if (automaton.getStates().size > 0) {
			if (!automaton.hasInitialState()) {
				messages.push(new WarningMessage("The automaton has no initial state."));
			} else {
				let hasUnreachable = false;
				if (automaton.getUnreachableStates().size > 0) {
					messages.push(new WarningMessage("The automaton has unreachable states.", 1));
					hasUnreachable = true;
				}

				const alphabet = automaton.getAlphabet();
				if (alphabet.size > 0) {
					let msgString = "The alphabet is <i>";
					alphabet.forEach((char) => {
						if (char.length <= 1) {
							msgString += char === "" ? lambdaChar : char;
							msgString += ", ";
						}
					});
					msgString = msgString.substring(0, msgString.length - 2);
					msgString += "</i>.";
					messages.push(new Message(msgString));

					if (!hasUnreachable) {
						if (automaton instanceof PushdownAutomaton) {
							messages.push(new Message("The automaton is a PDA."));
						} else if (automaton instanceof Automaton) {
							if (automaton.isDFA(alphabet)) {
								messages.push(new Message("The automaton is a DFA."));
							} else {
								messages.push(new Message("The automaton is an NFA."));
							}
						}
					}

					if (automaton.containsCycle()) {
						messages.push(new Message("The automaton contains cycles."));
					} else {
						messages.push(new Message("The automaton does not contain cycles."));
					}
				}
			}
			if (!automaton.hasFinalState()) {
				messages.push(new WarningMessage("The automaton has no final states."));
			}
		}

		this.displayMessages(messages);
	}

	displayMessages(messages) {
		// add messages to DOM
		messages.sort((a, b) => {
			return a.priority - b.priority;
		});
		this.messagesContent.empty();
		for (const m of messages) {
			this.messagesContent.append(m.content);
		}
	}
}

class Message {
	constructor(string, priority) {
		this.string = string;
		this.priority = priority === undefined ? 10 : priority;
		this.content = $(`<p class="message">${string}</p>`);
	}
}

class WarningMessage extends Message {
	constructor(string, priority) {
		super(string, priority || 0);
		this.content = $(`<p class="message warning-message">${string}</p>`);
	}
}
