let environments = new Set();
let activeEnvironment = undefined;
let lambdaChar = "\u03BB";

let controlKey = false;
let shiftKey = false;

function createEnvironment() {
	unselectAllEnvironments();
	const name = getNextEnvironmentName();
	const newTab = $(`
	<div class="active environment-tab">
		<h2 class="environment-tab-name" contenteditable="true">${name}</h2>
		<button class="environment-tab-delete-button"><i class="fas fa-times"></i></button>
	</div>`);
	$("#new-environment-button").before(newTab);
	const newEnv = new Environment(newTab);
	environments.add(newEnv);
	activeEnvironment = newEnv;
	newTab.click((e) => {
		unselectAllEnvironments();
		newEnv.getContent().show();
		newTab.addClass("active");
		activeEnvironment = newEnv;
		$(".environment-tab").not(".active").children(".environment-tab-name").attr("contenteditable", false);
		newTab.children(".environment-tab-name").attr("contenteditable", true);
	});
	newTab.children(".environment-tab-delete-button").click((e) => {
		e.stopPropagation();
		if (environments.size <= 1) {
			return;
		}
		if (activeEnvironment === newEnv) {
			if (newTab.prev(".environment-tab")) {
				newTab.prev(".environment-tab").click();
			} else if (newTab.next(".environment-tab")) {
				newTab.next(".environment-tab").click();
			}
		}
		newEnv.removeContent();
		environments.delete(newEnv);
		newTab.remove();
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

		if (e.code === "ControlLeft" || e.code === "ControlRight") {
			controlKey = true;
		} else if (e.code === "ShiftLeft" || e.code === "ShiftRight") {
			shiftKey = true;
		}
	};

	document.onkeyup = (e) => {
		e = window.event || e;

		if (e.code === "ControlLeft" || e.code === "ControlRight") {
			controlKey = false;
		} else if (e.code === "ShiftLeft" || e.code === "ShiftRight") {
			shiftKey = false;
		}
	};
});
