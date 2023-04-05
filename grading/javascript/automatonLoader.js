function setupAutomatonLoader() {
	$("#load-files-button").click(() => {
		new FileParser(undefined, (file, environment) => {
			environments.delete(environment);
			automatonFiles.push(new AutomatonFile(file, environment));
		});
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
