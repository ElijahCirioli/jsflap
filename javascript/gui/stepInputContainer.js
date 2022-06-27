class StepInputContainer {
	constructor(content, callback) {
		this.stepWrap = content.children(".environment-sidebar").children(".step-wrap");
		this.layers = [];

		this.setupContainer();
		this.setupListeners();
	}

	setupContainer() {
		this.stepWrap[0].innerHTML = `
        <h1 class="environment-sidebar-title">Step-by-step test</h1>
        <div class="step-input">
            <form class="inputs-form">
                <input type="text" spellcheck="false" maxlength="256" class="inputs-form-item-input single-line-input">
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
        <div class="step-table">
        </div>`;

		this.canvas = this.stepWrap.children(".step-tree-wrap").children("canvas");
		this.context = this.canvas[0].getContext("2d");
		this.nodesWrap = this.stepWrap.children(".step-tree-wrap").children(".step-tree-nodes-wrap");
	}

	setupListeners() {}

	drawTree(layers) {
		this.layers = layers;

		// resize canvas
		const margin = 20;
		const defaultWidth = this.stepWrap.children(".step-tree-wrap").width() - 2 * margin;
		const defaultHeight = this.stepWrap.children(".step-tree-wrap").height() - 2 * margin;

		let nodeWidth = 24;
		for (let i = 1; i < layers.length; i++) {
			const numChildren = new Array(layers[i - 1].length).fill(0);
			for (const step of layers[i]) {
				numChildren[step.predecessor]++;
			}
			nodeWidth *= Math.max(...numChildren);
		}

		const width = Math.max(nodeWidth, defaultWidth);
		const height = Math.max(layers.length * 28 + 2 * margin, defaultHeight);
		this.canvas.attr("width", width + 2 * margin);
		this.canvas.attr("height", height);

		// create the nodes
		this.nodesWrap.empty();

		// setup head node
		const head = layers[0][0];
		head.width = width;
		head.leftEdge = 0;
		this.createNode(head, new Point(width / 2, 0));

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
					step.width = parent.width / steps.length;
					step.leftEdge = (j / steps.length) * parent.width + parent.leftEdge;
					const xPos = step.leftEdge + step.width / 2;
					console.log(i, j, step.width, step.leftEdge, xPos);
					this.createNode(step, new Point(xPos, i * 30));
				}
			});

			// draw the lines
			for (const step of layers[i]) {
				this.context.beginPath();
				this.context.moveTo(step.canvasPos.x, step.canvasPos.y);
				const parent = layers[i - 1][step.predecessor];
				this.context.lineTo(parent.canvasPos.x, parent.canvasPos.y);
				this.context.stroke();
			}
		}
	}

	createNode(step, pos) {
		const margin = 20;
		const node = $(`<div class="step-tree-node"></div>`);
		step.canvasPos = new Point(pos.x + margin, pos.y + margin);
		node.css("left", step.canvasPos.x - 7 + "px");
		node.css("top", step.canvasPos.y - 7 + "px");

		this.nodesWrap.append(node);
	}
}
