export default (container) => (childKey, childReducer) => {
	if (container.childReducers[childKey]) { throw new Error(`Cannot register the given child reducer. The child key '${childKey}' is not unique.`) }
	container.childReducers[childKey] = childReducer
}