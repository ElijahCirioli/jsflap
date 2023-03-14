function setupAutomataLoader() {
	$("#load-files-button").click(() => {
		new FileParser(undefined, (file, environment) => {
			environments.delete(environment);
			automatonFiles.push(new AutomatonFile(file, environment));
		});
	});
}
