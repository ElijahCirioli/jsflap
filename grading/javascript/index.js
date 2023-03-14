let environments = new Set();
let automatonFiles = [];
let inputs = [];

let lambdaChar = window.localStorage.getItem("jsflap lambda character") || "\u03BB";
let blankTapeChar = window.localStorage.getItem("jsflap blank tape character") || "\u2610";
let editorTheme = window.localStorage.getItem("jsflap theme color") || "dark";
let stateColor = window.localStorage.getItem("jsflap state color") || "yellow";
let initialStackChar = window.localStorage.getItem("jsflap initial stack character") || "Z";
let maxConfigurations = window.localStorage.getItem("jsflap max configurations") || 500;

function createEnvironment() {
	const tab = $(`
	<div class="active environment-tab">
		<h2 class="environment-tab-name">Dummy tab</h2>
	</div>`);
	const env = new Environment(tab);
	environments.add(env);
	env.getContent().hide();
	return env;
}

$("document").ready(() => {
	Colors.update();
	setupAutomataLoader();
});
