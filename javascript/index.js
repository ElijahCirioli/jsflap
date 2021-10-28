let environments = [];

function createEnvironment() {
	unselectAllEnvironments();
	const newTab = $("<div class='active environment-tab'>Untitled 1</div>");
	$("#environment-tab-bar").append(newTab);
	const newEnv = new Environment(newTab);
	environments.push(newEnv);
	newTab.click((e) => {
		unselectAllEnvironments();
		newEnv.getContent().show();
		newTab.addClass("active");
	});
}

function unselectAllEnvironments() {
	$(".environment-tab").removeClass("active");
	$(".environment-wrap").hide();
}

$("document").ready(() => {
	createEnvironment();
});
