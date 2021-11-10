class EnvironmentSaver {
	constructor(env) {
		if (!env) {
			return;
		}

		this.saveEnvironment(env);
	}

	saveEnvironment(env) {
		const data = {
			name: env.getName(),
			states: [],
			transitions: [],
		};
		const automaton = env.getEditor().getAutomaton();

		automaton.getStates().forEach((s) => {
			data.states.push({
				x: s.getPos().x,
				y: s.getPos().y,
				name: s.getName(),
				id: s.getId(),
				final: s.isFinal(),
				initial: s.isInitial(),
			});

			s.getTransitions().forEach((t) => {
				data.transitions.push({
					from: t.getFromState().getId(),
					to: t.getToState().getId(),
					labels: Array.from(t.getLabels()),
				});
			});
		});

		const file = new Blob([JSON.stringify(data, null, 4)], { type: "text/plain" });
		const link = $("#menu-save-button");
		link.attr("href", URL.createObjectURL(file));
		link.attr("download", data.name + ".jsf");
	}
}
