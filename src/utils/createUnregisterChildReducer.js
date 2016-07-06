export default (container) => (childKey, childReducer) => {
	if (container.childReducers[childKey] !== childReducer) { throw new Error(`Cannot unregister the given child reducer. The child key '${childKey}' does not match the provided child reducer.`) }
	delete container.childReducers[childKey]
}
