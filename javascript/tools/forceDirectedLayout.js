class ForceDirectedLayout {
	constructor() {}

	static action(environment) {
		const NUM_ITERATIONS = 500;

		const editor = environment.getEditor();
		if (!editor) {
			return;
		}
		const automaton = editor.getAutomaton();
		const states = automaton.getStates();
		if (states.size === 0) {
			return;
		}

		// randomly scatter the states
		states.forEach((s) => {
			s.getPos().x = Math.random() * 600 - 300;
			s.getPos().y = Math.random() * 600 - 300;
		});

		// construct neighborhood by making transitions bidirectional
		const neighborhoods = new Map();
		states.forEach((s) => {
			const id = s.getId();
			if (!neighborhoods.has(id)) {
				neighborhoods.set(id, new Set());
			}

			s.getTransitions().forEach((t) => {
				const toId = t.getToState().getId();
				// ignore self-transitions
				if (toId == id) {
					return;
				}

				neighborhoods.get(id).add(toId);
				if (!neighborhoods.has(toId)) {
					neighborhoods.set(toId, new Set());
				}
				neighborhoods.get(toId).add(id);
			});
		});

		// add fake connections if the graph is disconnected
		const [firstId] = states.keys();
		const connections = ForceDirectedLayout.getConnected(firstId, neighborhoods);
		if (states.size != connections.size) {
			states.forEach((s, id) => {
				/* if this vertex is disconnected from the first state */
				if (!connections.has(id)) {
					/* add it to the first state's neighborhood */
					neighborhoods.get(firstId).add(id);
					neighborhoods.get(id).add(firstId);
				}
			});
		}

		// calculate constants
		const width = editor.canvas.width;
		const height = editor.canvas.height;
		const area = width * height;
		// tuples need a little more space
		const minDistance = editor.getType() === "finite" ? 100 : 140;
		// constant controlling ideal spacing between states
		const k = Math.min(Math.sqrt(area / states.size), minDistance);

		for (let i = 0; i < NUM_ITERATIONS; i++) {
			/* temperature cools over time and describes how much the vertices can move */
			const temperature = (width / (5 * Math.sqrt(NUM_ITERATIONS))) * Math.sqrt(NUM_ITERATIONS - i);
			ForceDirectedLayout.applyForces(states, neighborhoods, k, temperature);
		}

		if (editor.isAlignToGrid()) {
			AlignToGrid.action(environment);
		}
		editor.draw();
		editor.zoomFit();
		environment.updateHistory();
		editor.editorWrap.focus();
	}

	static getConnected(start, neighborhoods) {
		const visited = new Set();
		const queue = [start];
		visited.add(start);

		while (queue.length > 0) {
			const curr = queue.shift();
			neighborhoods.get(curr).forEach((state) => {
				if (!visited.has(state)) {
					visited.add(state);
					queue.push(state);
				}
			});
		}

		return visited;
	}

	static applyForces(states, neighborhoods, k, temperature) {
		states.forEach((s) => {
			const neighborhood = neighborhoods.get(s.getId());
			const displacement = new Point();

			// apply forces from all other states
			states.forEach((other) => {
				if (other === s) {
					return;
				}

				// repel from all states
				const repulsionForce = ForceDirectedLayout.repulsionForce(s, other, k);
				displacement.add(repulsionForce);

				// attract to neighbors
				if (neighborhood.has(other.getId())) {
					const attractionForce = ForceDirectedLayout.attractionForce(s, other, k);
					displacement.add(attractionForce);
				}
			});

			const centeringForce = ForceDirectedLayout.centeringForce(s, k);
			displacement.add(centeringForce);

			/* cap max length of displacement at temperature */
			if (displacement.magnitude() > temperature) {
				displacement.normalize(temperature);
			}

			/* move the vertex */
			s.getPos().add(displacement);
		});
	}

	static repulsionForce(s, other, k) {
		const difference = other.getPos().clone().subtract(s.getPos());
		const distance = Math.max(difference.magnitude(), 1);

		const strength = -Math.pow(k, 2) / distance;
		difference.normalize(strength);
		return difference;
	}

	static attractionForce(s, other, k) {
		const difference = other.getPos().clone().subtract(s.getPos());
		const distance = Math.max(difference.magnitude(), 1);

		const strength = Math.pow(distance, 2) / k;
		difference.normalize(strength);
		return difference;
	}

	static centeringForce(s, k) {
		const distance = s.getPos().magnitude();
		const force = s.getPos().clone();
		force.normalize(-distance / k);

		return force;
	}
}
