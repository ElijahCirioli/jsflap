function loadTestCaseFile() {
	new FileParser(undefined, (file, environment) => {
		if (environment === undefined) {
			// this wasn't a normal .jsf file but it may be a special one for storing test cases
			parseTestCaseJSF(file);
			return;
		}

		environments.delete(environment);
		const automataType = $(".dropdown-selected").text().toLowerCase();
		if (testCases.length === 1) {
			// if there are no existing test cases then change the type to match
			const envType = environment.getType().charAt().toUpperCase() + environment.getType().slice(1);
			$(`.dropdown-item:contains(${envType})`).click();
		} else if (
			(environment.getType() === "turing" || automataType === "turing") &&
			automataType !== environment.getType()
		) {
			// the new test cases are incompatible with the existing ones so don't add them
			return;
		}
		const inputs = environment.getInput().aggregateAllInputs().keys();
		for (const input of inputs) {
			createSingleInput().setWord(input);
		}
		removeEmptyInputs();
		gradeAllAutomata();
	});
}

function parseTestCaseJSF(file) {
	const reader = new FileReader();
	reader.onload = (e) => {
		const obj = JSON.parse(e.target.result);
		try {
			// make sure this is the right kind of file
			if (!obj.isTestCases) {
				return;
			}

			// allow or disallow non-determinism
			if (obj.allowNondeterminism) {
				$(".checkbox").addClass("checkbox-checked");
			} else {
				$(".checkbox").removeClass("checkbox-checked");
			}

			// set specified type
			$(`.dropdown-item:contains(${obj.type})`).click();

			// add words
			for (const input of obj.inputs) {
				const testCase = createSingleInput();
				testCase.setWord(input.word);
				testCase.setExpectedResult(input.accept);
			}
			removeEmptyInputs();
			gradeAllAutomata();
		} catch (ex) {
			console.log(`Failed to parse test case file ${file}:`, ex);
		}
	};
	reader.readAsText(file, "UTF-8");
}
