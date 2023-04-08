class FileParser {
	constructor(files, callback) {
		if (files) {
			this.files = files;
			this.handleFileInputs({ callback: callback });
		} else {
			// open a file select window
			const input = $(`<input type="file" class="file-input" multiple>`);
			$("#content-wrap").append(input);
			input.click();
			input.remove();
			input.on("change", { callback: callback }, this.handleFileInputs);
		}
	}

	handleFileInputs(e) {
		// "this" means different things depending on where this was called from
		// split files into .jff and .jsf
		for (const f of this.files) {
			if (f.name.endsWith(".jff")) {
				FileParser.parseJFF(f, e.data.callback);
			} else if (f.name.endsWith(".jsf")) {
				FileParser.parseJSF(f, e.data.callback);
			} else if (e.data.callback) {
				e.data.callback(f, undefined);
			}
		}
	}

	static parseJFF(file, callback) {
		// helper function to read in .jff files

		const fileName = file.name.substring(0, file.name.length - 4);
		const reader = new FileReader();
		reader.onload = (e) => {
			try {
				const parser = new DOMParser();
				const xml = parser.parseFromString(e.target.result, "text/xml");
				const body = xml.getElementsByTagName("structure")[0];
				const type = body.getElementsByTagName("type")[0].childNodes[0].nodeValue;
				if (type === "fa" || type === "pda" || type === "turing") {
					const env = createEnvironment();
					if (type === "fa") {
						env.createFiniteEditor();
					} else if (type === "pda") {
						env.createPushdownEditor();
					} else {
						env.createTuringEditor();
					}
					const editor = env.getEditor();
					const a = body.getElementsByTagName("automaton")[0];
					const states = a.getElementsByTagName("state");
					const transitions = a.getElementsByTagName("transition");
					const elementMap = new Map();

					env.setName(fileName);

					for (const s of states) {
						const name = s.getAttribute("name");
						const id = s.getAttribute("id");
						const x = s.getElementsByTagName("x")[0].childNodes[0].nodeValue * 0.75;
						const y = s.getElementsByTagName("y")[0].childNodes[0].nodeValue * 0.75;
						const pos = new Point(x, y);
						const initial = s.getElementsByTagName("initial").length > 0;
						const final = s.getElementsByTagName("final").length > 0;

						const state = editor.createState(pos, false);
						FileParser.setStateName(state, name);
						if (final) {
							editor.getAutomaton().addFinalState(state);
						}
						if (initial) {
							editor.getAutomaton().setInitialState(state);
						}
						elementMap.set(id, state.getElement());
					}

					for (const t of transitions) {
						const fromId = t.getElementsByTagName("from")[0].childNodes[0].nodeValue;
						const toId = t.getElementsByTagName("to")[0].childNodes[0].nodeValue;
						const fromState = elementMap.get(fromId);
						const toState = elementMap.get(toId);

						if (fromState && toState) {
							editor.startTransition(fromState);
							const transitionObj = editor.endTransition(toState, false);
							const char = FileParser.getTransitionElementJFF(t, "read", 1);
							if (type === "fa") {
								transitionObj.addLabel(char);
							} else if (type === "pda") {
								const pop = FileParser.getTransitionElementJFF(t, "pop", 1);
								const push = FileParser.getTransitionElementJFF(t, "push");
								const tuple = { char: char, pop: pop, push: push };
								transitionObj.addTuple(editor, tuple);
							} else {
								const write = FileParser.getTransitionElementJFF(t, "write");
								const moveLetter = FileParser.getTransitionElementJFF(t, "move", 1);
								let move = 0;
								if (moveLetter === "L") {
									move = -1;
								} else if (moveLetter === "R") {
									move = 1;
								}

								const tuple = { read: char, write: write, move: move };
								transitionObj.addTuple(editor, tuple);
							}
						}
					}

					editor.zoomFit();
					if (callback) {
						callback(file, env);
					}
				}
			} catch (ex) {
				if (typeof activeEnvironment !== "undefined") {
					activeEnvironment.addPopupMessage(
						new PopupMessage(
							"Error",
							`Unable to parse file ${file.name}`,
							() => {
								activeEnvironment.removePopupMessages();
							},
							true
						)
					);
				}
				if (callback) {
					callback(file, undefined);
				}
			}
		};
		reader.readAsText(file, "UTF-8");
	}

	static getTransitionElementJFF(transition, element, maxLength) {
		if (transition.getElementsByTagName(element)[0].childNodes.length > 0) {
			const value = transition.getElementsByTagName(element)[0].childNodes[0].nodeValue;
			if (maxLength) {
				return value.substring(0, Math.min(maxLength, value.length));
			}
			return value;
		}
		return "";
	}

	static parseJSF(file, callback) {
		// helper function to read in .jsf files

		const reader = new FileReader();
		reader.onload = (e) => {
			const obj = JSON.parse(e.target.result);
			try {
				const env = FileParser.parseJSON(obj, true);
				if (callback) {
					callback(file, env);
				}
			} catch (ex) {
				if (typeof activeEnvironment !== "undefined") {
					activeEnvironment.addPopupMessage(
						new PopupMessage(
							"Error",
							`Unable to parse file ${file.name}`,
							() => {
								activeEnvironment.removePopupMessages();
							},
							true
						)
					);
				}
				if (callback) {
					callback(file, undefined);
				}
			}
		};
		reader.readAsText(file, "UTF-8");
	}

	static parseJSON(obj, autoId, environment) {
		// parse a json object into an environment

		let env = environment;
		if (env === undefined) {
			env = createEnvironment();
			switch (obj.type) {
				case "finite":
					env.createFiniteEditor();
					break;
				case "pushdown":
					env.createPushdownEditor();
					break;
				case "turing":
					env.createTuringEditor();
					break;
				default:
					env.createFiniteEditor();
					break;
			}
		}
		const editor = env.getEditor();
		const elementMap = new Map();

		env.setName(obj.name);
		// try to reuse an old id if requested
		if (!autoId) {
			let alreadyExists = false;
			environments.forEach((e) => {
				if (obj.id === e.getId()) {
					alreadyExists = true;
				}
			});
			if (!alreadyExists) {
				env.setId(obj.id);
			}
		}

		// add all the states
		for (const s of obj.states) {
			const pos = new Point(s.x, s.y);
			const state = editor.createState(pos, false);
			FileParser.setStateName(state, s.name);
			if (s.final) {
				editor.getAutomaton().addFinalState(state);
			}
			if (s.initial) {
				editor.getAutomaton().setInitialState(state);
			}
			elementMap.set(s.id, state.getElement());
		}

		// add all the transitions
		for (const t of obj.transitions) {
			const fromState = elementMap.get(t.from);
			const toState = elementMap.get(t.to);
			if (fromState && toState) {
				editor.startTransition(fromState);
				const transitionObj = editor.endTransition(toState, false);
				for (const label of t.labels) {
					if (label !== "PREVIEW") {
						if (obj.type === "finite") {
							transitionObj.addLabel(label);
						} else {
							transitionObj.addTuple(editor, label);
						}
					}
				}
			}
		}

		// load inputs if this is a new environment
		if (environment === undefined) {
			// multiple run
			if ("inputs" in obj && obj.inputs.length > 0) {
				const normalizedInputs = obj.inputs.map(FileParser.normalizeInput);
				env.getInput().loadInputs(normalizedInputs);
			}

			// step-by-step
			if ("stepInput" in obj && obj.stepInput.length > 0) {
				env.getStepInput().loadInput(FileParser.normalizeInput(obj.stepInput));
			}
		}

		editor.getAutomaton().removeEmptyTransitions();
		env.testAllInputs(false);
		editor.draw();
		if (environment === undefined) {
			editor.zoomFit();
		}
		return env;
	}

	static setStateName(state, newName) {
		state.setName(newName);
		const nameElement = state.getElement().children(".state-name");
		nameElement.text(newName);
		if (newName.length > 5) {
			nameElement.addClass("state-name-small");
		} else {
			nameElement.removeClass("state-name-small");
		}
	}

	static normalizeInput(input) {
		// standardize the lambda and blank tape characters to whatever the user prefers
		return input
			.replaceAll("\u03BB", lambdaChar)
			.replaceAll("\u03B5", lambdaChar)
			.replaceAll("\u2610", blankTapeChar)
			.replaceAll("\u2205", blankTapeChar);
	}
}
