let environments = new Set();
let automatonFiles = [];
let testCases = [];

let selectedAutomatonFile = undefined;
let selection = undefined;

let lambdaChar = window.localStorage.getItem("jsflap lambda character") || "\u03BB";
let blankTapeChar = window.localStorage.getItem("jsflap blank tape character") || "\u2610";
let editorTheme = window.localStorage.getItem("jsflap theme color") || "dark";
let stateColor = window.localStorage.getItem("jsflap state color") || "yellow";
let initialStackChar = window.localStorage.getItem("jsflap initial stack character") || "Z";
let maxConfigurations = window.localStorage.getItem("jsflap max configurations") || 500;

function gradeAllAutomata() {
	for (const automatonFile of automatonFiles) {
		gradeAutomaton(automatonFile);
	}
	if (selectedAutomatonFile) {
		displayTestOutputs();
	}
}

function gradeAutomaton(automatonFile) {
	const automaton = automatonFile.getAutomaton();
	const testResults = [];
	const wordResults = new Map();
	const deterministic = automaton
		? automatonFile.getType() === "turing" || automaton.isDeterministic(automaton.getAlphabet())
		: false;

	for (const testCase of testCases) {
		if (testCase.isEmpty()) {
			continue;
		}

		const typePass = automaton && automatonFile.getType() === testCase.getType();
		const determinismPass = testCase.isNondeterminismAllowed() || deterministic;

		if (typePass) {
			let wordPass;
			let actual;
			if (automatonFile.getType() === "turing") {
				const inputTape = testCase.getWord();
				const turingResult =
					automatonFile.getCachedResult(inputTape) ?? automaton.parseInput(inputTape.split(""));
				wordResults.set(inputTape, turingResult);
				actual = turingResult.accept ? turingMachineStripTape(turingResult.tape.join("")) : false;
				wordPass =
					turingResult.accept && actual === turingMachineStripTape(testCase.getExpectedResult());
			} else {
				const word = testCase.getWord().replaceAll(lambdaChar, "");
				actual = automatonFile.getCachedResult(word) ?? automaton.languageContains(word);
				wordResults.set(word, actual);
				wordPass = actual === testCase.getExpectedResult();
			}
			testResults.push({
				pass: wordPass && determinismPass,
				actual: actual,
				determinism: determinismPass,
				type: typePass,
			});
		} else {
			testResults.push({
				pass: false,
				actual: undefined,
				determinism: determinismPass,
				type: typePass,
			});
		}
	}
	automatonFile.setCachedResults(wordResults);
	automatonFile.setTestOutput(testResults);
}

function turingMachineStripTape(tape) {
	let firstIndex = 0;
	let lastIndex = 0;
	let foundNonBlank = false;
	for (let i = 0; i < tape.length; i++) {
		if (tape[i] !== blankTapeChar) {
			lastIndex = i;
			if (!foundNonBlank) {
				firstIndex = i;
				foundNonBlank = true;
			}
		}
	}
	return tape.substring(firstIndex, lastIndex + 1);
}

function selectAutomatonFile(automatonFile) {
	if (selectedAutomatonFile) {
		selectedAutomatonFile.unhighlight();
	}
	selectedAutomatonFile = automatonFile;
	if (selectedAutomatonFile) {
		selectedAutomatonFile.highlight();
	}
	if (selectedAutomatonFile && selectedAutomatonFile.getType()) {
		displayTestOutputs();
	} else {
		removeTestOutputs();
	}
}

function displayTestOutputs() {
	const results = selectedAutomatonFile.getTestResults();

	// display general failure messages
	$(".test-case-failure").remove();
	if (results.length > 0 && !results[0].determinism) {
		// not deterministic when it should be
		$("#input-table-body").prepend(
			`<tr class="test-case-failure warning-message"><td colspan="4">Automaton is nondeterministic</td></tr>`
		);
	}
	if (results.length > 0 && !results[0].type) {
		// wrong type
		let errorMessage = "Automaton is Finite type";
		switch (selectedAutomatonFile.getType()) {
			case "turing":
				errorMessage = "Automaton is a Turing Machine";
				break;
			case "pushdown":
				errorMessage = "Automaton is Pushdown type";
				break;
		}
		$("#input-table-body").prepend(
			`<tr class="test-case-failure warning-message"><td colspan="4">${errorMessage}</td></tr>`
		);
	}

	for (let i = 0; i < results.length; i++) {
		testCases[i].setActualResult(results[i]);
	}
}

function removeTestOutputs() {
	$(".test-case-failure").remove();
	for (const testCase of testCases) {
		testCase.removeActualResult();
	}
}

$("document").ready(() => {
	Colors.update();
	setupAutomatonLoader();
	setupGrading();
});
