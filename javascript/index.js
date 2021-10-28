let environments = [];
let activeEnvironment = undefined;

function createEnvironment() {
	unselectAllEnvironments();
	const newTab = $("<div class='active environment-tab'>Untitled 1</div>");
	$("#new-environment-button").before(newTab);
	const newEnv = new Environment(newTab);
	environments.push(newEnv);
	activeEnvironment = newEnv;
	newTab.click((e) => {
		unselectAllEnvironments();
		newEnv.getContent().show();
		newTab.addClass("active");
		activeEnvironment = newEnv;
	});
}

function unselectAllEnvironments() {
	$(".environment-tab").removeClass("active");
	$(".environment-wrap").hide();
	activeEnvironment = undefined;
}

$("document").ready(() => {
	createEnvironment();

	$("#new-environment-button").click((e) => {
		createEnvironment();
	});
});
