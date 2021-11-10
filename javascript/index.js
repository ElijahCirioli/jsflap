let environments = new Set();
let activeEnvironment = undefined;
let lambdaChar = "\u03BB";

let controlKey = false;
let shiftKey = false;

function createEnvironment() {
	unselectAllEnvironments();
	$(".environment-tab").children(".environment-tab-name").attr("contenteditable", false);
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

	return newEnv;
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

	// control and shift key flags
	document.onkeydown = (e) => {
		e = window.event || e;
		const key = e.key;

		if (key === "Control") {
			controlKey = true;
		} else if (key === "Shift") {
			shiftKey = true;
		}
	};

	document.onkeyup = (e) => {
		e = window.event || e;
		const key = e.key;

		if (key === "Control") {
			controlKey = false;
		} else if (key === "Shift") {
			shiftKey = false;
		}
	};

	// tab new button
	$("#new-environment-button").click((e) => {
		createEnvironment();
	});

	// file menu
	$("#menu-new-button").click((e) => {
		hideDropdowns();
		createEnvironment();
	});

	$("#menu-open-button").click((e) => {
		hideDropdowns();
		new FileParser();
	});

	$("#menu-save-button").on("mouseenter focus", (e) => {
		new EnvironmentSaver(activeEnvironment);
	});

	$("#menu-save-button").click((e) => {
		hideDropdowns();
	});

	$("#menu-close-button").click((e) => {
		hideDropdowns();
		removeEnvironment(activeEnvironment);
	});

	// view menu
	$("#menu-zoom-in-button").click((e) => {
		hideDropdowns();
		activeEnvironment.getEditor().zoomIn();
	});

	$("#menu-zoom-out-button").click((e) => {
		hideDropdowns();
		activeEnvironment.getEditor().zoomOut();
	});

	$("#menu-zoom-fit-button").click((e) => {
		hideDropdowns();
		activeEnvironment.getEditor().zoomFit();
	});
});
