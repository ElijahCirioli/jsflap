function setupGrading() {
	$(".dropdown-item").click(function (e) {
		if (!$(this).hasClass("dropdown-selected")) {
			$(this).blur();
		}
		$(".dropdown-item").removeClass("dropdown-selected");
		$(this).addClass("dropdown-selected");
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

	$("#input-clear-button").click((e) => {
		testCases = [];
		$(".test-case").remove();
		createSingleInput();
		gradeAllAutomata();
	});

	// make sure the lambda button has the user's preferred character
	$("#input-lambda-button").text(lambdaChar);

	createSingleInput();
}

function createSingleInput() {
	const automataType = $(".dropdown-selected").text().toLowerCase();
	testCases.push(new TestCase(automataType));
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
