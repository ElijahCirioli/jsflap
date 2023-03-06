class StepInputContainer {
	constructor(environment, callback) {
		this.stepWrap = environment.getContent().children(".environment-sidebar").children(".step-wrap");
		this.layers = []; // the layers of parsing steps
		this.margin = 22; // the margin around the tree
		this.prevWord = undefined; // the previous word parsed (to cut down on duplicate work)
		this.selection = undefined;
		this.environment = environment;

		this.triggerTest = () => {
			callback(false);
		};

		this.setupContainer();
		this.setupListeners();
	}

	setupContainer() {
		this.stepWrap.html(`
        <h1 class="environment-sidebar-title">Step-by-step test 
			<button class="switch-button multiple-switch-button" title="Test multiple inputs">
				<i class="fas fa-solid fa-align-justify"></i>
			</button>
		</h1>
        <div class="step-input">
            <form class="inputs-form">
                <input type="text" spellcheck="false" maxlength="256" placeholder="Input word" class="inputs-form-item-input single-line-input">
            </form>
            <div class="inputs-buttons-wrap">
                <button class="inputs-button inputs-lambda-button">${lambdaChar}</button>
                <button class="inputs-button inputs-clear-button">Clear</button>
            </div>
        </div>
        <div class="step-tree-wrap">
            <div class="step-tree-nodes-wrap"></div>
            <canvas class="step-tree-canvas" width="225" height="100"></canvas>
        </div>
        <div class="step-tree-buttons-wrap">
            <button class="inputs-button step-tree-back-button">
                <i class="fas fa-solid fa-backward-step"></i>
            </button>
            <p class="step-tree-buttons-label">Step</p>
            <button class="inputs-button step-tree-forward-button">
                <i class="fas fa-solid fa-forward-step"></i>
            </button>
        </div>
        <div class="step-table-wrap">
            <table class="step-table"></table>
        </div>`);

		this.canvas = this.stepWrap.children(".step-tree-wrap").children("canvas");
		this.context = this.canvas[0].getContext("2d");
		this.nodesWrap = this.stepWrap.children(".step-tree-wrap").children(".step-tree-nodes-wrap");
		this.table = this.stepWrap.children(".step-table-wrap").children("table");
	}

	setupContainerForTuringMachine() {
		this.stepWrap.find(".inputs-form-item-input").attr("placeholder", "Input tape");

		const button = $(`<button class="inputs-button inputs-blank-button">${blankTapeChar}</button>`);
		this.stepWrap
			.children(".step-input")
			.children(".inputs-buttons-wrap")
			.children(".inputs-lambda-button")
			.replaceWith(button);

		const textInput = this.stepWrap.children(".step-input").children(".inputs-form").children("input");
		button.click((e) => {
			if (this.selection) {
				const currVal = textInput.val();
				const newVal =
					currVal.slice(0, this.selection.start) +
					blankTapeChar +
					currVal.slice(this.selection.end);
				const newSelectionIndex = this.selection.start + 1;
				textInput.val(newVal);
				textInput[0].setSelectionRange(newSelectionIndex, newSelectionIndex);
				textInput.focus();
			} else {
				textInput.val(blankTapeChar);
			}

			this.triggerTest();
		});
	}

	setupListeners() {
		const textInput = this.stepWrap.children(".step-input").children(".inputs-form").children("input");

		// input text box
		textInput.on("keyup change", (e) => {
			this.triggerTest();
		});

		textInput.on("keydown", (e) => {
			e = window.event || e;
			e.stopPropagation();
			const key = e.key;
			const empty = textInput.val().length === 0;

			if (key === ",") {
				e.preventDefault();
				if (empty) {
					textInput.val(lambdaChar);
					this.triggerTest();
				}
			} else if (empty && (key === "Tab" || key === "Enter")) {
				e.preventDefault();
				textInput.val(lambdaChar);
				this.triggerTest();
			}
		});

		textInput.on("focusin click change keyup mousedown mouseup mouseenter mouseleave", (e) => {
			if (textInput.is(":focus")) {
				this.selection = {
					start: textInput[0].selectionStart,
					end: textInput[0].selectionEnd,
				};
			}
		});

		textInput.on("focusout", (e) => {
			if (!this.stepWrap.children(".step-input").is(":focus-within")) {
				this.selection = undefined;
			}
		});

		textInput.parent().on("submit", (e) => {
			e.preventDefault();
		});

		const buttonsWrap = this.stepWrap.children(".step-input").children(".inputs-buttons-wrap");

		// lambda button
		buttonsWrap.children(".inputs-lambda-button").click((e) => {
			textInput.val(lambdaChar);
			this.triggerTest();
		});

		// clear button
		buttonsWrap.children(".inputs-clear-button").click((e) => {
			textInput.val("");
			this.triggerTest();
		});

		const treeButtonsWrap = this.stepWrap.children(".step-tree-buttons-wrap");

		// step forward button
		treeButtonsWrap.children(".step-tree-forward-button").click((e) => {
			if (this.layers.length === 0) {
				return;
			}

			// go to start
			if (!this.selectedStep) {
				this.selectStep(0, 0, true, true);
				return;
			}

			// go to next step
			if (this.selectedStep.layer < this.layers.length - 1) {
				const nextLayer = this.selectedStep.layer + 1;
				const nextIndex = this.getNextIndex();

				this.selectStep(nextLayer, nextIndex, true, true);
			}
		});

		// step backward button
		treeButtonsWrap.children(".step-tree-back-button").click((e) => {
			if (this.layers.length === 0) {
				return;
			}

			// go to end
			if (!this.selectedStep) {
				if (this.layers && this.layers.length > 0) {
					this.selectStep(this.layers.length - 1, 0, true, true);
				}
				return;
			}

			// go to next step
			if (this.selectedStep.layer > 0) {
				const step = this.layers[this.selectedStep.layer][this.selectedStep.index];
				this.selectStep(this.selectedStep.layer - 1, step.predecessor, true, true);
			}
		});

		// switch to multiple run mode
		this.stepWrap
			.children("h1")
			.children(".switch-button")
			.click((e) => {
				this.stepWrap.siblings().show();
				this.stepWrap.siblings().find("input").last().focus();
				this.stepWrap.hide();
				$("#menu-test-multiple-button").hide();
				$("#menu-test-step-button").show();
				this.triggerTest();
			});
	}

	setupNodeListeners(step, index) {
		step.element.click((e) => {
			this.selectStep(step.depth, index, true, true);
		});

		step.element.on("mouseenter", (e) => {
			this.highlightLayer(step.canvasPos.x);
			this.populateTable(this.layers[step.depth], index);
		});

		step.element.on("mouseleave", (e) => {
			this.selectStep(this.selectedStep.layer, this.selectedStep.index, false, false);
		});
	}

	getNextIndex() {
		// look for actual successor
		const nextLayer = this.layers[this.selectedStep.layer + 1];
		for (let i = 0; i < nextLayer.length; i++) {
			if (nextLayer[i].predecessor === this.selectedStep.index) {
				return i;
			}
		}

		// go to the next closest node
		const currStep = this.layers[this.selectedStep.layer][this.selectedStep.index];
		let closestIndex = 0;
		for (let i = 1; i < nextLayer.length; i++) {
			const currDist = Math.abs(currStep.canvasPos.y - nextLayer[closestIndex].canvasPos.y);
			const newDist = Math.abs(currStep.canvasPos.y - nextLayer[i].canvasPos.y);
			if (newDist < currDist) {
				closestIndex = i;
			}
		}

		return closestIndex;
	}

	drawTree(layers) {
		this.layers = layers; // remember these steps
		const nodeSize = 18; // the height taken up by a single tree node
		let totalNodeHeight = nodeSize; // the height of all the nodes combined

		// resize canvas width to fit all nodes
		const defaultWidth = this.stepWrap.children(".step-tree-wrap").width() - 2 * this.margin;
		const width = Math.max((layers.length - 1) * 30, defaultWidth);
		this.canvas.attr("width", width + 2 * this.margin);

		// resize canvas height to fit all nodes
		const defaultHeight =
			parseInt(this.stepWrap.children(".step-tree-wrap").css("min-height")) - 2 * this.margin;
		// calculate the height needed if every node in the layer had the same highest amount of children
		for (let i = 1; i < layers.length; i++) {
			const numChildren = new Array(layers[i - 1].length).fill(0);
			for (const step of layers[i]) {
				numChildren[step.predecessor]++;
			}
			totalNodeHeight *= Math.max(...numChildren);
		}
		const height = Math.max(totalNodeHeight, defaultHeight);
		this.canvas.attr("height", height + 2 * this.margin);

		// keep track of maximum and minimum node heights to further crop canvas later
		let maxHeight = 0;
		let minHeight = height;

		// create the nodes
		this.nodesWrap.empty();

		// setup head node
		const head = layers[0][0];
		head.height = height;
		head.topEdge = 0;
		this.createNode(head, new Point(0, height / 2), 0);

		// position one layer at a time
		for (let i = 1; i < layers.length; i++) {
			// create the groupings based on parent nodes
			const groups = new Map();
			for (const step of layers[i]) {
				const group = groups.get(step.predecessor);
				if (group) {
					group.push(step);
				} else {
					groups.set(step.predecessor, [step]);
				}
			}

			// place the nodes within their bounding boxes
			let globalIndex = 0;
			groups.forEach((steps, parentIndex) => {
				const parent = layers[i - 1][parentIndex];
				for (let j = 0; j < steps.length; j++) {
					const step = steps[j];
					// divide the parent's height among its children
					step.height = parent.height / steps.length;
					step.topEdge = (j / steps.length) * parent.height + parent.topEdge;

					// position the node in the center of its box
					const yPos = step.topEdge + step.height / 2;
					this.createNode(step, new Point(i * 30, yPos), globalIndex);
					globalIndex++;

					// update max and min heights
					maxHeight = Math.max(maxHeight, yPos + 9);
					minHeight = Math.min(minHeight, yPos - 9);
				}
			});
		}

		// crop canvas if the nodes didn't take up as much space as expected
		if (maxHeight < height && maxHeight > defaultHeight) {
			this.canvas.attr("height", maxHeight + 2 * this.margin);
		}

		if (minHeight > 0 && height - minHeight > defaultHeight) {
			this.canvas.attr("height", height - minHeight + 2 * this.margin);
			// shift all nodes to match
			for (const layer of this.layers) {
				for (const step of layer) {
					step.canvasPos.y -= minHeight;
					step.element.css("top", step.canvasPos.y - 7 + "px");
				}
			}
		}

		this.drawLines(); // add the lines between nodes
		this.selectStep(0, 0, true, false);
	}

	createNode(step, pos, index) {
		const node = $(`<div class="step-tree-node"></div>`);
		step.canvasPos = new Point(pos.x + this.margin, pos.y + this.margin);
		node.css("left", step.canvasPos.x - 7 + "px");
		node.css("top", step.canvasPos.y - 7 + "px");

		if (step.accept === true) {
			node.addClass("step-tree-node-accept");
		} else if (step.accept === false) {
			node.addClass("step-tree-node-reject");
		}

		// add to div
		this.nodesWrap.append(node);
		step.element = node;

		this.setupNodeListeners(step, index);
	}

	drawLines() {
		this.context.clearRect(0, 0, this.canvas.width(), this.canvas.height());
		this.context.lineWidth = 2;
		this.context.strokeStyle = "#2c304d";
		for (let i = 1; i < this.layers.length; i++) {
			for (const step of this.layers[i]) {
				const parent = this.layers[i - 1][step.predecessor];
				this.context.beginPath();
				this.context.moveTo(step.canvasPos.x, step.canvasPos.y);
				this.context.lineTo(parent.canvasPos.x, parent.canvasPos.y);
				this.context.stroke();
			}
		}
	}

	selectStep(layer, index, centerView, selectState) {
		if (!this.layers) {
			return;
		}

		this.selectedStep = { layer: layer, index: index };
		const step = this.layers[layer][index];

		// add specific class
		this.nodesWrap.children().removeClass("step-tree-node-selected");
		step.element.addClass("step-tree-node-selected");

		// center the div on the step
		if (centerView) {
			this.centerView(step);
		}

		// select the automata state
		if (selectState) {
			const editor = activeEnvironment.getEditor();
			editor.unselectAllStates();
			editor.selectState(step.state);
		}

		this.populateTable(this.layers[layer], index); // fill the table with step data
		this.highlightLayer(step.canvasPos.x); // highlight the layer on the tree
	}

	highlightLayer(xPos) {
		this.drawLines();
		this.context.fillStyle = "rgba(250, 214, 60, 0.5)";
		this.context.fillRect(xPos - 10, 0, 20, this.canvas.height());
	}

	populateTable(layer, index) {
		this.table.empty();

		if (this.environment.getType() === "none") {
			return;
		}

		// create the header
		const header = $("<tr><th>State</th></tr>");
		if (this.environment.getType() === "turing") {
			header.append("<th>Tape</th><th>Cell</th>");
		} else {
			header.append("<th>Input</th>");
		}
		if (this.environment.getType() === "pushdown") {
			header.append("<th>Stack</th>");
		}

		this.table.append(header);

		// add the steps
		for (let i = 0; i < layer.length; i++) {
			const step = layer[i];
			const row = $(`<tr><td>${step.state.getName()}</td></tr>`);
			if (this.environment.getType() === "turing") {
				const stringTape = step.tape.join("");
				const highlightedTape = `${stringTape.substring(0, step.index)}<span class="tape-highlight">${
					step.tape[step.index]
				}</span>${stringTape.substring(step.index + 1)}`;
				row.append(`<td>${highlightedTape}</td><td>${step.tape[step.index]}</td>`);
			} else {
				row.append(`<td>${step.word}</td>`);
			}
			if (this.environment.getType() === "pushdown") {
				row.append(`<td>${step.stack}</td>`);
			}

			if (step.accept) {
				row.children().first().addClass("step-table-accept");
			} else if (step.accept === false) {
				row.children().first().addClass("step-table-reject");
			}

			if (i === index) {
				row.addClass("step-table-highlighted");
			}

			this.table.append(row);
		}
	}

	centerView(step) {
		const height = this.stepWrap.children(".step-tree-wrap").height();
		const scroll = {
			scrollTop: step.canvasPos.y - height / 2,
			scrollLeft: step.canvasPos.x - this.margin,
		};

		this.stepWrap.children(".step-tree-wrap").animate(scroll, 0);
	}

	restoreDefault() {
		// reset the canvas and table to their default state
		this.canvas.attr("width", 225);
		this.canvas.attr("height", 100);
		this.nodesWrap.empty();
		this.table.empty();
		this.context.clearRect(0, 0, this.canvas.width(), this.canvas.height());
		this.layers = [];
	}

	isVisible() {
		return this.stepWrap.is(":visible");
	}

	getInput() {
		return this.stepWrap.children(".step-input").children(".inputs-form").children("input").val();
	}

	getNewInput() {
		const word = this.getInput();
		if (this.prevWord === undefined || this.prevWord !== word) {
			return word;
		}
		return undefined;
	}

	loadInput(input) {
		this.stepWrap.children(".step-input").children(".inputs-form").children("input").val(input);
	}
}
