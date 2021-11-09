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
		<h2 class="environment-tab-name" contenteditable="true" spellcheck="false">${name}</h2>
		<button class="environment-tab-delete-button"><i class="fas fa-times"></i></button>
	</div>`);
	$("#new-environment-button").before(newTab);
	const newEnv = new Environment(newTab);
	environments.add(newEnv);
	activeEnvironment = newEnv;
	// make active event
	newTab.click((e) => {
		unselectAllEnvironments();
		newEnv.getContent().show();
		newTab.addClass("active");
		activeEnvironment = newEnv;
		// make the text editable
		$(".environment-tab").not(".active").children(".environment-tab-name").attr("contenteditable", false);
		newTab.children(".environment-tab-name").attr("contenteditable", true);
	});
	// x button on tab
	newTab.children(".environment-tab-delete-button").click((e) => {
		e.stopPropagation();
		removeEnvironment(newEnv);
	});
}

function unselectAllEnvironments() {
	$(".environment-tab").removeClass("active");
	$(".environment-wrap").hide();
	activeEnvironment = undefined;
}

function removeEnvironment(env) {
	if (environments.size <= 1) {
		return;
	}
	tab = env.getTab();
	if (activeEnvironment === env) {
		if (tab.prev(".environment-tab").length > 0) {
			tab.prev(".environment-tab").click();
		} else if (tab.next(".environment-tab").length > 0) {
			tab.next(".environment-tab").click();
		}
	}
	env.removeContent();
	environments.delete(env);
	tab.remove();
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

function hideDropdowns() {
	// there's probably a better way to do this, but this is okay
	$(".menu-child-wrap").css("display", "none");
	setTimeout(() => {
		$(".menu-child-wrap").css("display", "");
	}, 10);
}

$("document").ready(() => {
	createEnvironment();

	$("#new-environment-button").click((e) => {
		createEnvironment();
	});

	$("#menu-new-button").click((e) => {
		hideDropdowns();
		createEnvironment();
	});

	$("#menu-close-button").click((e) => {
		hideDropdowns();
		removeEnvironment(activeEnvironment);
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
