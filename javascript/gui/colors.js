class Colors {
	static update() {
		const body = $(document.body);
		// editor theme
		body.css("--background-color", editorTheme === "dark" ? "#181b2f" : "#b5bcc4");
		body.css("--regular-color", editorTheme === "dark" ? "#2c304d" : "#6d7082");

		//state colors
		const stateColors = {
			yellow: ["#ffbe39", "#ffd659"],
			red: ["#e65c5a", "#ed6a68"],
			blue: ["#55a1ed", "#60a8f0"],
			green: ["#72c961", "#87de76"],
			purple: ["#bc71de", "#c57ce6"],
		};
		body.css("--state-color", stateColors[stateColor][0]);
		body.css("--selected-state-color", stateColors[stateColor][1]);

		// update local storage
		window.localStorage.setItem("jsflap theme color", editorTheme);
		window.localStorage.setItem("jsflap state color", stateColor);
	}
}
