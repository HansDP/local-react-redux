export default (state, childReducers, action) => {
    const keys = Object.keys(childReducers)
    return keys.reduce((reducedState, childKey) => {
    	const newChildState = childReducers[childKey](state[childKey], action)
    	if (newChildState !== state[childKey]) {
    		return {
    			...reducedState,
    			[childKey]: newChildState
    		}
    	}

    	return reducedState
    }, state)
}