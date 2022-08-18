class RegexConstructor {
	constructor() {}

	static action(environment, expression) {
		if (environment.getType() !== "finite") {
			return;
		}

		const editor = environment.getEditor();
		const automaton = editor.getAutomaton();

		// remove the existing automaton
		automaton.getStates().forEach((s) => {
			automaton.removeState(s);
		});

		const processedExpression = RegexConstructor.insertExtraBrackets(expression);
		const states = RegexConstructor.createNFA(processedExpression, editor, environment);

		automaton.setInitialState(states[0]);
		automaton.addFinalState(states[states.length - 1]);

		TreeLayout.action(environment);
		environment.testAllInputs(true);
	}

	static insertExtraBrackets(expression) {
		const expArr = expression.split("");

		for (let i = expArr[0] === "\\" ? 2 : 1; i < expArr.length; i++) {
			// ignore escaped unions
			if (expArr[i] === "\\") {
				i++;
				continue;
			}

			if (expArr[i] === "|") {
				// before union
				if (expArr[i - 1] !== ")" && expArr[i - 1] !== "]") {
					expArr.splice(i, 0, ")");
					for (let j = i - 1; j >= 0; j--) {
						if (expArr[j] !== "*" && expArr[j] !== "+") {
							expArr.splice(j, 0, "(");
							break;
						}
					}
					i += 2;
				}

				// after union
				if (i + 1 < expArr.length && expArr[i + 1] !== "(" && expArr[i + 1] !== "[") {
					if (i + 2 < expArr.length && (expArr[i + 2] === "*" || expArr[i + 2] === "+")) {
						expArr.splice(i + 3, 0, ")");
					} else {
						expArr.splice(i + 2, 0, ")");
					}
					expArr.splice(i + 1, 0, "(");
				}
			}
		}
		return expArr.join("");
	}

	static createNFA(expression, editor, environment) {
		const states = [editor.createState(new Point(0, 0), false)];
		let lastChunk = states.slice(0);

		for (let i = 0; i < expression.length; i++) {
			const c = expression[i];
			if (c === "(" || c === "[") {
				// recursively handle grouping
				const closingBracket = RegexConstructor.getBracketPair(expression, i);
				if (closingBracket < 0) {
					RegexConstructor.createErrorMessage(environment);
					return states;
				}
				const subExpression = expression.substring(i + 1, closingBracket);
				lastChunk = RegexConstructor.createNFA(subExpression, editor, environment);
				RegexConstructor.createTransition(states[states.length - 1], lastChunk[0], "", editor);
				lastChunk.forEach((s) => states.push(s));
				i = closingBracket;
			} else if (c === ")" || c === "]") {
				// something has gone wrong
				RegexConstructor.createErrorMessage(environment);
				return states;
			} else if (c === "*") {
				// Kleene star (match 0 or more times)
				const preceding = states.length - lastChunk.length - 1;
				if (preceding >= 0) {
					RegexConstructor.createTransition(
						states[preceding],
						lastChunk[lastChunk.length - 1],
						"",
						editor
					);
					RegexConstructor.createTransition(
						lastChunk[lastChunk.length - 1],
						states[preceding],
						"",
						editor
					);
				}
			} else if (c === "+") {
				// Kleene plus (match 1 or more times)
				const preceding = states.length - lastChunk.length - 1;
				if (preceding >= 0) {
					RegexConstructor.createTransition(
						lastChunk[lastChunk.length - 1],
						states[preceding],
						"",
						editor
					);
				}
			} else if (c === "|") {
				// union
				const preceding = states.length - lastChunk.length - 1;
				if (preceding >= 0 && i + 1 < expression.length) {
					const subExpression = expression.substring(
						i + 2,
						RegexConstructor.getBracketPair(expression, i + 1)
					);
					const subAutomaton = RegexConstructor.createNFA(subExpression, editor, environment);
					RegexConstructor.createTransition(states[preceding], subAutomaton[0], "", editor);
					subAutomaton.forEach((s) => states.push(s));
					i += subExpression.length + 2;

					const newState = editor.createState(new Point(0, 0), false);
					RegexConstructor.createTransition(
						subAutomaton[subAutomaton.length - 1],
						newState,
						"",
						editor
					);
					RegexConstructor.createTransition(lastChunk[lastChunk.length - 1], newState, "", editor);
					subAutomaton.forEach((s) => lastChunk.push(s));
					lastChunk.push(newState);
					states.push(newState);
				}
			} else {
				// regular character
				const newState = editor.createState(new Point(0, 0), false);
				if (c === "\\" && i + 1 < expression.length) {
					i++;
					RegexConstructor.createTransition(
						lastChunk[lastChunk.length - 1],
						newState,
						expression[i],
						editor
					);
				} else {
					RegexConstructor.createTransition(lastChunk[lastChunk.length - 1], newState, c, editor);
				}
				lastChunk = [newState];
				states.push(newState);
			}
		}

		return states;
	}

	static createErrorMessage(environment) {
		environment.addPopupMessage(
			new PopupMessage(
				"Error",
				"Unable to parse regular expression: invalid grouping",
				() => {
					environment.removePopupMessages();
				},
				true
			)
		);
	}

	static createTransition(fromState, toState, label, editor) {
		editor.startTransition(fromState.getElement());
		const transitionObj = editor.endTransition(toState.getElement(), false);
		transitionObj.addLabel(label);
	}

	static getBracketPair(expression, startIndex) {
		const openingType = expression[startIndex];
		const closingType = openingType === "(" ? ")" : "]";

		let depth = 1;
		for (let i = startIndex + 1; i < expression.length; i++) {
			const c = expression[i];
			if (c === "\\") {
				i++;
				continue;
			} else if (c === openingType) {
				depth++;
			} else if (c === closingType) {
				depth--;
				if (depth === 0) {
					return i;
				}
			}
		}

		return -1;
	}
}
