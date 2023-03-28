let environments = new Set();
let automatonFiles = [];
let testCases = [];

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
}

function gradeAutomaton(automatonFile) {
	const automaton = automatonFile.getAutomaton();
	const testResults = [];
	const wordResults = new Map();
	const deterministic = automaton ? automaton.isDeterministic(automaton.getAlphabet()) : false;

	for (const testCase of testCases) {
		if (testCase.isEmpty()) {
			continue;
		}

		if (automaton && automatonFile.getType() === testCase.getType()) {
			const word = testCase.getWord().replaceAll(lambdaChar, "");
			const actual = automatonFile.getCachedResult(word) ?? automaton.languageContains(word);
			wordResults.set(word, actual);
			const wordPass = actual === testCase.getExpectedResult();
			console.log(testCase.isNondeterminismAllowed(), deterministic);
			const determinismPass = testCase.isNondeterminismAllowed() || deterministic;
			testResults.push({
				pass: wordPass && determinismPass,
				actual: actual,
			});
		} else {
			testResults.push({
				pass: false,
				actual: undefined,
			});
		}
	}
	automatonFile.setCachedResults(wordResults);
	automatonFile.setTestOutput(testResults);
}

$("document").ready(() => {
	Colors.update();
	setupAutomatonLoader();
	setupGrading();
});
