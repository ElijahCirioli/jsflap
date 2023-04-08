function setupAutomatonLoader() {
	$("#load-files-button").click(() => {
		new FileParser(undefined, (file, environment) => {
			environments.delete(environment);
			automatonFiles.push(new AutomatonFile(file, environment));
		});
	});

	$("#automata-panel").on("keydown", (e) => {
		e = window.event || e;
		e.stopPropagation();
		const key = e.key;

		if (key === "ArrowRight" || key === "ArrowDown" || key === "Tab") {
			if (selectedAutomatonFile) {
				const index = automatonFiles.indexOf(selectedAutomatonFile);
				if (index < 0 || index >= automatonFiles.length - 1) {
					return;
				} else {
					selectAutomatonFile(automatonFiles[index + 1]);
				}
			} else if (automatonFiles.length > 0) {
				selectAutomatonFile(automatonFiles[0]);
			}
			$(".selected-automaton-file")[0].scrollIntoView(false);
		} else if (key === "ArrowLeft" || key === "ArrowUp") {
			if (selectedAutomatonFile) {
				const index = automatonFiles.indexOf(selectedAutomatonFile);
				if (index <= 0) {
					return;
				} else {
					selectAutomatonFile(automatonFiles[index - 1]);
				}
			} else if (automatonFiles.length > 0) {
				selectAutomatonFile(automatonFiles[automatonFiles.length - 1]);
			}
			$(".selected-automaton-file")[0].scrollIntoView();
		} else if ((key === "Delete" || key === "Backspace") && selectedAutomatonFile) {
			selectedAutomatonFile.delete();
		}
	});
}

function createEnvironment() {
	const tab = $(
		`<div class="active environment-tab">
			<h2 class="environment-tab-name">Dummy tab</h2>
		</div>`
	);
	const env = new Environment(tab);
	environments.add(env);
	env.getContent().hide();
	return env;
}
