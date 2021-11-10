class FileParser {
	constructor() {
		const input = $(`<input type="file" class="file-input" multiple>`);
		$("#content-wrap").append(input);
		input.click();
		input.remove();
		input.on("change", this.handleFileInputs);
	}

	handleFileInputs() {
		// helper function to read in .jff files
		function parseJFF(file) {
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
							setStateName(state, name);
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
					console.log(`failed to parse file ${file.name}:`);
					console.log(ex);
				}
			};
		}

		// helper function to read in .jsf files
		function parseJSF(file) {
			const reader = new FileReader();
			reader.readAsText(file, "UTF-8");
			reader.onload = (e) => {
				try {
					const obj = JSON.parse(e.target.result);
					const env = createEnvironment();
					const editor = env.getEditor();
					const elementMap = new Map();

					env.setName(obj.name);

					for (const s of obj.states) {
						const pos = new Point(s.x, s.y);
						const state = editor.createState(pos, false);
						setStateName(state, s.name);
						if (s.final) {
							editor.getAutomaton().addFinalState(state);
						}
						if (s.initial) {
							editor.getAutomaton().setInitialState(state);
						}
						elementMap.set(s.id, state.getElement());
					}

					for (const t of obj.transitions) {
						const fromState = elementMap.get(t.from);
						const toState = elementMap.get(t.to);
						if (fromState && toState) {
							editor.startTransition(fromState);
							const transitionObj = editor.endTransition(toState, false);
							for (const label of t.labels) {
								transitionObj.addLabel(label);
							}
						}
					}

					editor.zoomFit();
				} catch (ex) {
					console.log(`failed to parse file ${file.name}:`);
					console.log(ex);
				}
			};
		}

		function setStateName(state, newName) {
			state.setName(newName);
			const nameElement = state.getElement().children(".state-name");
			nameElement.text(newName);
			if (newName.length > 5) {
				nameElement.addClass("state-name-small");
			} else {
				nameElement.removeClass("state-name-small");
			}
		}

		const automata = [];
		for (const f of this.files) {
			if (f.name.endsWith(".jff")) {
				automata.push(parseJFF(f));
			} else if (f.name.endsWith(".jsf")) {
				automata.push(parseJSF(f));
			}
		}
	}
}
