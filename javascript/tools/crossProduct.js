class CrossProduct {
	constructor() {}

	static createProductAutomaton(env1, env2, isFinalFunction, operationIcon) {
		const a1 = env1.getEditor().getAutomaton();
		const a2 = env2.getEditor().getAutomaton();

		// make sure both automata have an initial state
		if (!a2.hasInitialState() || !a1.hasInitialState()) {
			env1.addPopupMessage(
				new PopupMessage(
					"Error",
					"At least one automaton does not have an initial state.",
					() => {
						env1.removePopupMessages();
					},
					true
				)
			);
			return;
		}

		// create the new NFA environment
		const productEnv = createEnvironment();
		productEnv.createFiniteEditor();
		const productEditor = productEnv.getEditor();
		const productAutomaton = productEditor.getAutomaton();
		productEnv.setName(`${env1.getName()} ${operationIcon} ${env2.getName()}`);

		const states1 = Array.from(a1.getStates().values());
		const states2 = Array.from(a2.getStates().values());
		const combinedStates = new Map();

		// create all the product states
		for (const s1 of states1) {
			for (const s2 of states2) {
				const productName = s1.getName() + "," + s2.getName();
				const productState = productEditor.createState(new Point(), false);
				productState.setName(productName);

				if (isFinalFunction(s1.isFinal(), s2.isFinal())) {
					productAutomaton.addFinalState(productState);
				}
				combinedStates.set(CrossProduct.getProductId(s1, s2), productState);
			}
		}

		let warningNeeded = false;

		// create all the transitions
		for (const s1 of states1) {
			const allLabels1 = new Set();
			for (const s2 of states2) {
				const allLabels2 = new Set();

				// this combination of states represents one state in the product FSA
				const fromId = CrossProduct.getProductId(s1, s2);

				// take note of all the possible labels in a2 from this state
				s2.getTransitions().forEach((t) => {
					t.getLabels().forEach((label) => {
						allLabels2.add(label);
					});
				});

				// product transitions
				s1.getTransitions().forEach((t1) => {
					t1.getLabels().forEach((label1) => {
						// take note of all the possible labels in a1 from this state
						allLabels1.add(label1);

						s2.getTransitions().forEach((t2) => {
							t2.getLabels().forEach((label2) => {
								//this combination of transitions represents one transition in the product FSA

								// make sure these transitions have the same label or one is lambda
								if (label1 == label2) {
									const toId = CrossProduct.getProductId(t1.getToState(), t2.getToState());
									productEditor.startTransition(combinedStates.get(fromId).getElement());
									const transitionObj = productEditor.endTransition(
										combinedStates.get(toId).getElement(),
										false
									);
									transitionObj.addLabel(label1);
								}
								if (label1 === "") {
									const toId = CrossProduct.getProductId(t1.getToState(), s2);
									productEditor.startTransition(combinedStates.get(fromId).getElement());
									const transitionObj = productEditor.endTransition(
										combinedStates.get(toId).getElement(),
										false
									);
									transitionObj.addLabel("");
								}
								if (label2 === "") {
									const toId = CrossProduct.getProductId(s1, t2.getToState());
									productEditor.startTransition(combinedStates.get(fromId).getElement());
									const transitionObj = productEditor.endTransition(
										combinedStates.get(toId).getElement(),
										false
									);
									transitionObj.addLabel("");
								}
							});
						});
					});
				});

				// add all one dimensional states and transitions that are needed

				// automaton 1 x null
				s1.getTransitions().forEach((t) => {
					const s = t.getToState();
					t.getLabels().forEach((label) => {
						if (!allLabels2.has(label)) {
							CrossProduct.createOneDimensionalAutomaton(
								s,
								true,
								productAutomaton,
								productEditor,
								combinedStates,
								fromId,
								label,
								isFinalFunction
							);
							warningNeeded = true;
						}
					});
				});

				// null x automaton 2
				s2.getTransitions().forEach((t) => {
					const s = t.getToState();
					t.getLabels().forEach((label) => {
						if (!allLabels1.has(label)) {
							CrossProduct.createOneDimensionalAutomaton(
								s,
								false,
								productAutomaton,
								productEditor,
								combinedStates,
								fromId,
								label,
								isFinalFunction
							);
							warningNeeded = true;
						}
					});
				});
			}
		}

		// let the user know if 1D states had to be created
		if (warningNeeded) {
			productEnv.addPopupMessage(
				new PopupMessage(
					"Warning",
					"The automata are missing equivalent transitions from all states",
					() => {
						productEnv.removePopupMessages();
					},
					true
				)
			);
		}

		const initialId = CrossProduct.getProductId(a1.getInitialState(), a2.getInitialState());
		productAutomaton.setInitialState(combinedStates.get(initialId));

		RemoveUnreachableStates.action(productEnv);
		TreeLayout.action(productEnv);
		productEnv.testAllInputs(true);
	}

	static getProductId(state1, state2) {
		return state1.getId() + " " + state2.getId();
	}

	static createOneDimensionalAutomaton(
		firstState,
		firstDim,
		productAutomaton,
		productEditor,
		allStates,
		fromId,
		fromLabel,
		isFinalFunction
	) {
		// create states with BFS
		const queue = [firstState];
		while (queue.length > 0) {
			const curr = queue.shift();
			const stateId = firstDim ? curr.getId() + " " : " " + curr.getId();

			// this acts as a visited check but it also shows us if this state already exists
			if (!allStates.has(stateId)) {
				// create the new 1D state
				const stateName = firstDim ? curr.getName() + ",Ø" : "Ø," + curr.getName();
				const state = productEditor.createState(new Point(), false);
				state.setName(stateName);

				if (firstDim && isFinalFunction(curr.isFinal(), false)) {
					productAutomaton.addFinalState(state);
				} else if (!firstDim && isFinalFunction(false, curr.isFinal())) {
					productAutomaton.addFinalState(state);
				}
				allStates.set(stateId, state);

				// crawl to all of its neighbors
				curr.getTransitions().forEach((t) => {
					queue.push(t.getToState());
				});
			}
		}

		// create transition linking this to the main product automaton
		const firstId = firstDim ? firstState.getId() + " " : " " + firstState.getId();
		productEditor.startTransition(allStates.get(fromId).getElement());
		const transitionObj = productEditor.endTransition(allStates.get(firstId).getElement(), false);
		transitionObj.addLabel(fromLabel);

		// create transitions with BFS again
		const visited = new Set();
		queue.push(firstState);
		while (queue.length > 0) {
			const curr = queue.shift();
			const stateId = firstDim ? curr.getId() + " " : " " + curr.getId();
			const fromState = allStates.get(stateId);

			curr.getTransitions().forEach((t) => {
				const subDest = t.getToState();
				if (!visited.has(subDest)) {
					queue.push(subDest);
					visited.add(subDest);
					const destId = firstDim ? subDest.getId() + " " : " " + subDest.getId();
					const dest = allStates.get(destId);

					productEditor.startTransition(fromState.getElement());
					const transitionObj = productEditor.endTransition(dest.getElement(), false);
					t.getLabels().forEach((label) => {
						transitionObj.addLabel(label);
					});
				}
			});
		}
	}

	static createUnionAutomaton(env1, env2) {
		const isFinal = (isFinal1, isFinal2) => {
			return isFinal1 || isFinal2;
		};

		CrossProduct.createProductAutomaton(env1, env2, isFinal, "\u222A");
	}

	static createIntersectionAutomaton(env1, env2) {
		const isFinal = (isFinal1, isFinal2) => {
			return isFinal1 && isFinal2;
		};

		CrossProduct.createProductAutomaton(env1, env2, isFinal, "\u2229");
	}

	static createDifferenceAutomaton(env1, env2) {
		const isFinal = (isFinal1, isFinal2) => {
			return isFinal1 && !isFinal2;
		};

		CrossProduct.createProductAutomaton(env1, env2, isFinal, "-");
	}

	static isApplicable() {
		let numFinite = 0;
		for (const env of environments) {
			if (env.getType() === "finite") {
				numFinite++;
			}
		}
		return numFinite > 1;
	}
}
