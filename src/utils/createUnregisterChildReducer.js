export default (childReducers) => (childKey, childReducer) => {
    if (childReducers[childKey] !== childReducer) { throw new Error(`Cannot unregister the given child reducer. The child key '${childKey}' does not match the provided child reducer.`) }
    delete childReducers[childKey]
}
