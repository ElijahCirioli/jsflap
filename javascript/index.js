let environments = new Set();
let activeEnvironment = undefined;
let clipboard;

let controlKey = false;
let shiftKey = false;

let lambdaChar = window.localStorage.getItem("jsflap lambda character") || "\u03BB";
let editorTheme = window.localStorage.getItem("jsflap theme color") || "dark";
let stateColor = window.localStorage.getItem("jsflap state color") || "yellow";
let initialStackChar = window.localStorage.getItem("jsflap initial stack character") || "Z";
let maxConfigurations = window.localStorage.getItem("jsflap max configurations") || 500;

function createEnvironment() {
	unselectAllEnvironments();
	$(".environment-tab").children(".environment-tab-name").attr("contenteditable", false);
	const name = getNextEnvironmentName();
	const newTab = $(`
	<div class="active environment-tab">
		<h2 class="environment-tab-name" contenteditable="true" spellcheck="false">${name}</h2>
		<button title="Delete environment" class="environment-tab-delete-button"><i class="fas fa-times"></i></button>
	</div>`);
	$("#new-environment-button").before(newTab);
	const newEnv = new Environment(newTab);
	environments.add(newEnv);
	activeEnvironment = newEnv;
	// make active event
	newTab.click((e) => {
		unselectAllEnvironments();
		newEnv.getContent().show();
		newEnv.forgetMousePos();
		newEnv.testAllInputs(true);
		newTab.addClass("active");
		activeEnvironment = newEnv;
		// make the text editable
		$(".environment-tab").not(".active").children(".environment-tab-name").attr("contenteditable", false);
		newTab.children(".environment-tab-name").attr("contenteditable", true);
	});
	// x button on tab
	newTab.children(".environment-tab-delete-button").click((e) => {
		e.stopPropagation();
		if (newEnv.isEmpty()) {
			removeEnvironment(newEnv);
		} else if (environments.size > 1) {
			if (newEnv !== activeEnvironment) {
				newTab.click();
			}
			newEnv.addPopupMessage(
				new PopupCancelMessage(
					"Warning",
					"Any unsaved work in this tab may be lost.",
					() => {
						removeEnvironment(newEnv);
					},
					() => {
						newEnv.removePopupMessages();
					},
					true
				)
			);
		}
	});

	return newEnv;
}

function unselectAllEnvironments() {
	$(".environment-tab").removeClass("active");
	$(".environment-wrap").hide();
	activeEnvironment = undefined;
}

function removeEnvironment(env) {
	// don't remove if it's the only one
	if (environments.size <= 1) {
		return;
	}
	tab = env.getTab();
	if (activeEnvironment === env) {
		// select a different environment
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

function updateColors() {
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

	// file input drag and drop
	$("#content-wrap").on("dragenter dragover", (e) => {
		e.preventDefault();
	});

	$("#content-wrap").on("drop", (e) => {
		e.preventDefault();
		const files = e.originalEvent.dataTransfer.files;
		new FileParser(files);
	});

	// tab new button
	$("#new-environment-button").click((e) => {
		createEnvironment();
	});

	// file menu
	$("#file-menu").on("mouseenter focus pointerenter", (e) => {
		// update recent projects selection
		$("#menu-open-recent-subgroup").empty();
		const allProjects = [];
		Object.keys(window.localStorage).forEach((key) => {
			const project = window.localStorage.getItem(key);
			if (project.includes("transitions") && project.includes("states")) {
				allProjects.push(JSON.parse(project));
			}
		});
		allProjects.sort((a, b) => {
			return b.updated - a.updated;
		});

		const numToDisplay = 6;
		for (let i = 0; i < allProjects.length; i++) {
			const project = allProjects[i];
			if (i < numToDisplay) {
				const button = $(
					`<button class="menu-child-item menu-child-subgroup-item">${project.name}</button>`
				);
				$("#menu-open-recent-subgroup").append(button);
				button.click((e) => {
					hideDropdowns();
					FileParser.parseJSON(project, false);
					activeEnvironment.updateHistory();
				});
			} else {
				window.localStorage.removeItem(project.id);
			}
		}
	});

	$("#menu-new-button").click((e) => {
		hideDropdowns();
		createEnvironment();
	});

	$("#menu-open-button").click((e) => {
		hideDropdowns();
		new FileParser();
	});

	$("#menu-settings-button").click((e) => {
		hideDropdowns();
		activeEnvironment.addPopupMessage(
			new PopupSettingsMessage(
				(settings) => {
					activeEnvironment.removePopupMessages();

					$(".inputs-form-item-input").val((i, v) => {
						return v.replaceAll(lambdaChar, settings.lambdaChar);
					});
					$(".inputs-lambda-button").text(settings.lambdaChar);

					lambdaChar = settings.lambdaChar;
					initialStackChar = settings.initialStackChar;
					maxConfigurations = settings.maxConfigurations;

					window.localStorage.setItem("jsflap initial stack character", initialStackChar);
					window.localStorage.setItem("jsflap max configurations", maxConfigurations);
					window.localStorage.setItem("jsflap lambda character", lambdaChar);

					environments.forEach((env) => {
						env.getContent().show();
						if (env.hasEditor()) {
							env.getEditor().draw(true);
						}
						env.getContent().hide();
					});

					activeEnvironment.getContent().show();
					activeEnvironment.testAllInputs(false);
				},
				() => {
					activeEnvironment.removePopupMessages();
				},
				true
			)
		);
	});

	$("#menu-save-button").on("mouseenter focus", (e) => {
		const data = activeEnvironment.getSaveObject();
		const file = new Blob([JSON.stringify(data, null, 4)], { type: "text/plain" });
		const link = $("#menu-save-button");
		link.attr("href", URL.createObjectURL(file));
		link.attr("download", data.name + ".jsf");
	});

	$("#menu-save-button").click((e) => {
		hideDropdowns();
	});

	$("#menu-close-button").click((e) => {
		hideDropdowns();
		removeEnvironment(activeEnvironment);
	});

	// edit menu
	$("#menu-select-all-button").click((e) => {
		hideDropdowns();
		if (activeEnvironment.hasEditor()) {
			activeEnvironment.getEditor().selectAll();
		}
	});

	$("#menu-cut-button").click((e) => {
		hideDropdowns();
		ClipboardTools.cut();
	});

	$("#menu-copy-button").click((e) => {
		hideDropdowns();
		ClipboardTools.copy();
	});

	$("#menu-paste-button").click((e) => {
		hideDropdowns();
		ClipboardTools.paste();
	});

	$("#menu-undo-button").click((e) => {
		hideDropdowns();
		activeEnvironment.undo();
	});

	$("#menu-redo-button").click((e) => {
		hideDropdowns();
		activeEnvironment.redo();
	});

	// view menu
	$("#menu-zoom-in-button").click((e) => {
		hideDropdowns();
		if (activeEnvironment.hasEditor()) {
			activeEnvironment.getEditor().zoomIn();
		}
	});

	$("#menu-zoom-out-button").click((e) => {
		hideDropdowns();
		if (activeEnvironment.hasEditor()) {
			activeEnvironment.getEditor().zoomOut();
		}
	});

	$("#menu-zoom-fit-button").click((e) => {
		hideDropdowns();
		if (activeEnvironment.hasEditor()) {
			activeEnvironment.getEditor().zoomFit();
		}
	});

	$("#menu-theme-choice-button").click((e) => {
		hideDropdowns();
		oldTheme = editorTheme;
		oldStateColor = stateColor;
		activeEnvironment.addPopupMessage(
			new PopupThemeChoiceMessage(
				() => {
					activeEnvironment.removePopupMessages();
				},
				() => {
					activeEnvironment.removePopupMessages();
					editorTheme = oldTheme;
					stateColor = oldStateColor;
					updateColors();
				},
				true
			)
		);
	});

	// tools menu
	$("#tools-menu").on("mouseenter focus pointerenter", (e) => {
		if (activeEnvironment.getType() === "finite") {
			$("#menu-compare-equivalence-button").show();
			$("#menu-convert-dfa-button").show();
			$("#menu-layout-subgroup").css("top", "calc(2 * 1.3rem)");
		} else {
			$("#menu-compare-equivalence-button").hide();
			$("#menu-convert-dfa-button").hide();
			$("#menu-layout-subgroup").css("top", 0);
		}
	});

	$("#menu-compare-equivalence-button").click((e) => {
		hideDropdowns();
		if (activeEnvironment.getType() === "finite") {
			if (EquivalenceTest.isApplicable()) {
				activeEnvironment.addPopupMessage(
					new PopupEnvironmentChoiceMessage(
						(env) => {
							activeEnvironment.removePopupMessages();
							EquivalenceTest.action(activeEnvironment, env);
						},
						() => {
							activeEnvironment.removePopupMessages();
						},
						true
					)
				);
			} else {
				activeEnvironment.addPopupMessage(
					new PopupMessage(
						"Error",
						"No other finite state automata were found.",
						() => {
							activeEnvironment.removePopupMessages();
						},
						true
					)
				);
			}
		} else {
			activeEnvironment.addPopupMessage(
				new PopupMessage(
					"Error",
					"Equivalence comparison is only available for Finite State Automata.",
					() => {
						activeEnvironment.removePopupMessages();
					},
					true
				)
			);
		}
	});

	$("#menu-convert-dfa-button").click((e) => {
		hideDropdowns();
		if (DFAConverter.isApplicable()) {
			DFAConverter.action(activeEnvironment);
		} else {
			activeEnvironment.addPopupMessage(
				new PopupMessage(
					"Error",
					"Only Finite State Automata can be converted to DFAs.",
					() => {
						activeEnvironment.removePopupMessages();
					},
					true
				)
			);
		}
	});

	$("#menu-remove-unreachable-button").click((e) => {
		hideDropdowns();
		RemoveUnreachableStates.action(activeEnvironment);
	});

	$("#menu-layout-tree-button").click((e) => {
		hideDropdowns();
		TreeLayout.action(activeEnvironment);
	});

	$("#menu-layout-circle-button").click((e) => {
		hideDropdowns();
		CircleLayout.action(activeEnvironment);
	});

	updateColors();
});
