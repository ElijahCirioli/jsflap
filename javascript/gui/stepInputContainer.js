class StepInputContainer {
	constructor(content, callback) {
		this.stepWrap = content.children(".environment-sidebar").children(".step-wrap");
		this.layers = [];
		this.margin = 20;

		this.setupContainer();
		this.setupListeners();
	}

	setupContainer() {
		this.stepWrap[0].innerHTML = `
        <h1 class="environment-sidebar-title">Step-by-step test</h1>
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
        <div class="step-tree-buttons-wrap"></div>
        <div class="step-table-wrap">
            <table class="step-table"></table>
        </div>`;

		this.canvas = this.stepWrap.children(".step-tree-wrap").children("canvas");
		this.context = this.canvas[0].getContext("2d");
		this.nodesWrap = this.stepWrap.children(".step-tree-wrap").children(".step-tree-nodes-wrap");
		this.table = this.stepWrap.children(".step-table-wrap").children("table");
	}

	setupListeners() {
		const textInput = this.stepWrap.children(".step-input").children(".inputs-form").children("input");
		textInput.on("keyup change", (e) => {
			const word = textInput.val();

			if (word.length === 0) {
				this.restoreDefault();
				return;
			}

			const editor = activeEnvironment.getEditor();
			if (!editor) {
				return;
			}

			const parseSteps = editor.getAutomaton().getParseSteps(word);
			if (parseSteps.length > 0) {
				this.drawTree(parseSteps);
			}
		});
	}

	drawTree(layers) {
		this.layers = layers;
		let nodeHeight = 20;

		// calculate required width to fit all nodes
		const defaultWidth = this.stepWrap.children(".step-tree-wrap").width() - 2 * this.margin;
		const defaultHeight =
			parseInt(this.stepWrap.children(".step-tree-wrap").css("min-height")) - 2 * this.margin;
		for (let i = 1; i < layers.length; i++) {
			const numChildren = new Array(layers[i - 1].length).fill(0);
			for (const step of layers[i]) {
				numChildren[step.predecessor]++;
			}
			nodeHeight *= Math.max(...numChildren);
		}

		// resize canvas
		const width = Math.max(layers.length * 26, defaultWidth);
		const height = Math.max(nodeHeight, defaultHeight);
		this.canvas.attr("width", width + 2 * this.margin);
		this.canvas.attr("height", height + 2 * this.margin);

		// create the nodes
		this.nodesWrap.empty();

		// setup head node
		const head = layers[0][0];
		head.height = height;
		head.topEdge = 0;
		this.createNode(head, new Point(0, height / 2));

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
			groups.forEach((steps, parentIndex) => {
				const parent = layers[i - 1][parentIndex];
				for (let j = 0; j < steps.length; j++) {
					const step = steps[j];
					step.height = parent.height / steps.length;
					step.topEdge = (j / steps.length) * parent.height + parent.topEdge;
					const yPos = step.topEdge + step.height / 2;
					this.createNode(step, new Point(i * 30, yPos));
				}
			});
		}

		this.drawLines();
		this.centerView(head);
	}

	createNode(step, pos) {
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

		// create listeners
		node.on("mouseenter", (e) => {
			this.highlightLayer(step.canvasPos.x);
			this.populateTable(this.layers[step.depth]);
		});

		node.on("mouseleave", (e) => {
			this.drawLines();
		});
	}

	drawLines() {
		this.context.clearRect(0, 0, this.canvas.width(), this.canvas.height());
		this.context.lineWidth = 2;
		this.context.strokeStyle = "#2c304d";
		for (let i = 1; i < this.layers.length; i++) {
			for (const step of this.layers[i]) {
				this.context.beginPath();
				this.context.moveTo(step.canvasPos.x, step.canvasPos.y);
				const parent = this.layers[i - 1][step.predecessor];
				this.context.lineTo(parent.canvasPos.x, parent.canvasPos.y);
				this.context.stroke();
			}
		}
	}

	highlightLayer(xPos) {
		this.drawLines();
		this.context.fillStyle = "rgba(250, 214, 60, 0.5)";
		this.context.fillRect(xPos - 10, 0, 20, this.canvas.height());
	}

	populateTable(layer) {
		this.table.empty();

		const editor = activeEnvironment.getEditor();
		if (!editor) {
			return;
		}

		// create the header
		const header = $("<tr><th>State</th><th>Input</th></tr>");
		if (editor instanceof PushdownEditor) {
			header.append("<th>Stack</th>");
		}
		this.table.append(header);

		// add the steps
		for (const step of layer) {
			const row = $(`<tr><td>${step.state.getName()}</td><td>${step.word}</td></tr>`);
			if (editor instanceof PushdownEditor) {
				row.append(`<td>${step.stack}</td>`);
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
		this.canvas.attr("width", 225);
		this.canvas.attr("height", 100);
		this.nodesWrap.empty();
		this.context.clearRect(0, 0, this.canvas.width(), this.canvas.height());
	}
}
