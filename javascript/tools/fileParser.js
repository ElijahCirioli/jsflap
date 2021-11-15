class FileParser {
	constructor(files) {
		if (files) {
			this.files = files;
			this.handleFileInputs();
		} else {
			// open a file select window
			const input = $(`<input type="file" class="file-input" multiple>`);
			$("#content-wrap").append(input);
			input.click();
			input.remove();
			input.on("change", this.handleFileInputs);
		}
	}

	handleFileInputs() {
		// "this" means different things depending on where this was called from
		// split files into .jff and .jsf
		for (const f of this.files) {
			if (f.name.endsWith(".jff")) {
				FileParser.parseJFF(f);
			} else if (f.name.endsWith(".jsf")) {
				FileParser.parseJSF(f);
			}
		}
	}

	static parseJFF(file) {
		// helper function to read in .jff files

		const fileName = file.name.substring(0, file.name.length - 4);
		const reader = new FileReader();
		reader.readAsText(file, "UTF-8");
		reader.onload = (e) => {
			try {
				const parser = new DOMParser();
				const xml = parser.parseFromString(e.target.result, "text/xml");
				const body = xml.getElementsByTagName("structure")[0];
				const type = body.getElementsByTagName("type")[0].childNodes[0].nodeValue;
				if (type === "fa") {
					const env = createEnvironment();
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
						const label = t.getElementsByTagName("read")[0].childNodes[0].nodeValue;

						const fromState = elementMap.get(fromId);
						const toState = elementMap.get(toId);
						if (fromState && toState) {
							editor.startTransition(fromState);
							const transitionObj = editor.endTransition(toState, false);
							transitionObj.addLabel(label);
						}
					}

					editor.zoomFit();
				}
			} catch (ex) {
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
		};
	}

	static parseJSF(file) {
		// helper function to read in .jsf files

		const reader = new FileReader();
		reader.readAsText(file, "UTF-8");
		reader.onload = (e) => {
			const obj = JSON.parse(e.target.result);
			try {
				FileParser.parseJSON(obj, true);
			} catch (ex) {
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
		};
	}

	static parseJSON(obj, autoId, environment) {
		// parse a json object into an environment

		const env = environment || createEnvironment();
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
						transitionObj.addLabel(label);
					}
				}
			}
		}

		editor.getAutomaton().removeEmptyTransitions();
		env.testAllInputs(false);
		editor.draw();
		if (environment === undefined) {
			editor.zoomFit();
		}
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
}
