let environments = [];
let activeEnvironment = undefined;

let controlKey = false;
let shiftKey = false;

function createEnvironment() {
	unselectAllEnvironments();
	const name = getNextEnvironmentName();
	const newTab = $(`<div class="active environment-tab">${name}</div>`);
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

function getNextEnvironmentName() {
	for (let i = 1; true; i++) {
		const name = "Untitled " + i;
		let foundMatch = false;
		for (const env of environments) {
			if (env.getName() === name) {
				foundMatch = true;
				break;
			}
		}
		if (!foundMatch) {
			return name;
		}
	}
}

$("document").ready(() => {
	createEnvironment();

	$("#new-environment-button").click((e) => {
		createEnvironment();
	});

	document.onkeydown = (e) => {
		e = window.event || e;
		e.preventDefault();

		if (e.code === "ControlLeft" || e.code === "ControlRight") {
			controlKey = true;
		} else if (e.code === "ShiftLeft" || e.code === "ShiftRight") {
			shiftKey = true;
		}
	};

	document.onkeyup = (e) => {
		e = window.event || e;
		e.preventDefault();

		if (e.code === "ControlLeft" || e.code === "ControlRight") {
			controlKey = false;
		} else if (e.code === "ShiftLeft" || e.code === "ShiftRight") {
			shiftKey = false;
		}
	};
});
