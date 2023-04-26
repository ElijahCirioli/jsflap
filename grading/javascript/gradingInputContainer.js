function setupGrading() {
	$(".dropdown-item").click(function (e) {
		if ($(this).hasClass("dropdown-selected")) {
			return;
		}
		$(this).blur();
		const prevType = $(".dropdown-selected").text();
		const newType = $(this).text();
		$(".dropdown-item").removeClass("dropdown-selected");
		$(this).addClass("dropdown-selected");
		if (prevType === "Turing" || newType === "Turing") {
			$("#input-clear-button").click();
			setupLambdaButton();
		} else {
			for (const testCase of testCases) {
				testCase.setType(newType.toLowerCase());
			}
		}
		if (newType === "Turing") {
			$("#allow-nondeterminism-label").hide();
			$("#allow-nondeterminism").hide();
		} else {
			$("#allow-nondeterminism-label").show();
			$("#allow-nondeterminism").show();
		}
		gradeAllAutomata();
	});

	$(".checkbox").click(function (e) {
		if ($(this).hasClass("checkbox-checked")) {
			$(this).removeClass("checkbox-checked");
		} else {
			$(this).addClass("checkbox-checked");
		}
		gradeAllAutomata();
	});

	$("#grading-input-form").on("submit", (e) => {
		e.preventDefault();
	});

	$("#automata-panel").click((e) => {
		selectAutomatonFile(undefined);
	});

	$("#load-input-file-button").click(() => {
		loadTestCaseFile();
	});

	$("#save-input-file-button").on("mouseenter focus", (e) => {
		const file = generateTestCasesFile();
		const link = $("#save-input-file-button");
		link.attr("href", URL.createObjectURL(file));
		link.attr("download", "jsFLAP Grading Inputs.jsf");
	});

	$("#input-clear-button").click((e) => {
		testCases = [];
		$(".test-case").remove();
		createSingleInput();
		gradeAllAutomata();
	});

	setupLambdaButton();

	createSingleInput();
}

function createSingleInput() {
	const automataType = $(".dropdown-selected").text().toLowerCase();
	const testCase = new TestCase(automataType);
	testCases.push(testCase);
	return testCase;
}

function createSingleInputIfNeeded() {
	if (testCases.length === 0 || !testCases[testCases.length - 1].isEmpty()) {
		createSingleInput();
	}
	gradeAllAutomata();
}

function removeEmptyInputs() {
	testCases = testCases.filter((testCase) => {
		if (testCase.isEmpty() && !testCase.isLast()) {
			testCase.removeElement();
			return false;
		}
		return true;
	});
	createSingleInputIfNeeded();
}

function setupLambdaButton() {
	// make sure the lambda button has the user's preferred character
	if ($(".dropdown-selected").text() === "Turing") {
		$("#input-lambda-button").text(blankTapeChar);
	} else {
		$("#input-lambda-button").text(lambdaChar);
	}

	selection = undefined;
	$("#input-lambda-button").off("click");
	$("#input-lambda-button").click((e) => {
		if ($(".inputs-form-item-input").last().val().length > 0) {
			createSingleInput();
		}
		if ($(".dropdown-selected").text() === "Turing") {
			if (selection) {
				const currVal = selection.element.val();
				const newVal =
					currVal.slice(0, selection.start) + blankTapeChar + currVal.slice(selection.end);
				const newSelectionIndex = selection.start + 1;
				selection.element.val(newVal);
				selection.element[0].setSelectionRange(newSelectionIndex, newSelectionIndex);
				selection.element.focus();
			} else {
				$(".test-case-input").last().children().val(blankTapeChar);
				$(".test-case-output-expected").last().children().val(blankTapeChar);
			}
		} else {
			$(".inputs-form-item-input").last().val(lambdaChar);
		}
		createSingleInputIfNeeded();
		gradeAllAutomata();
	});
}

function generateTestCasesFile() {
	const allowNondeterminism = $("#allow-nondeterminism").hasClass("checkbox-checked");
	const type = $(".dropdown-selected").text();
	const data = {
		isTestCases: true,
		allowNondeterminism: allowNondeterminism,
		type: type,
		inputs: [],
	};

	for (const testCase of testCases) {
		const word = testCase.getWord();
		if (word.length === 0) {
			continue;
		}
		data.inputs.push({
			word: word,
			accept: testCase.getExpectedResult(),
		});
	}

	return new Blob([JSON.stringify(data, null, 4)], { type: "text/plain" });
}
