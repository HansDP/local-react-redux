export default (childReducers) => (childKey, childReducer) => {
    if (childReducers[childKey]) { throw new Error(`Cannot register the given child reducer. The child key '${childKey}' is not unique.`) }
    childReducers[childKey] = childReducer
}