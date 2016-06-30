export default (state, childReducers, action) => Object.keys(childReducers).reduce((reducedState, childKey) => {
    const newChildState = childReducers[childKey](state[childKey], action)
    if (newChildState !== state[childKey]) {
        return {
            ...reducedState,
            [childKey]: newChildState
        }
    }
    return reducedState
}, state)