function setupGrading() {
	$(".dropdown-item").click(function (e) {
		let doClear = false;
		if (!$(this).hasClass("dropdown-selected")) {
			$(this).blur();
			const prevType = $(".dropdown-selected").text();
			const newType = $(this).text();
			doClear = prevType === "Turing" || newType === "Turing";
		}
		$(".dropdown-item").removeClass("dropdown-selected");
		$(this).addClass("dropdown-selected");
		if (doClear) {
			$("#input-clear-button").click();
		}
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

	$("#input-clear-button").click((e) => {
		testCases = [];
		$(".test-case").remove();
		createSingleInput();
		gradeAllAutomata();
	});

	// make sure the lambda button has the user's preferred character
	$("#input-lambda-button").text(lambdaChar);

	$("#input-lambda-button").click((e) => {
		console.log($(".inputs-form-item-input"));
		if ($(".inputs-form-item-input").last().val().length > 0) {
			createSingleInput();
		}
		$(".inputs-form-item-input").last().val(lambdaChar);
		createSingleInput();
		gradeAllAutomata();
	});

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
