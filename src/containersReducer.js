let rootReducer = null

// TODO: find a way to be able to register a root-container, instead of having only one.

/**
 * The redux reducer that handles all container states.
 */
export default (state = {}, action) => {
	if (rootReducer) {
		return rootReducer(state, action)
	}		
	return state
}

export const registerRootReducer = (reducer) => {
	if (rootReducer) { throw new Error('There can only be one <RootContainer>.') }
	rootReducer = reducer
}

export const unregisterRootReducer = (reducer) => {
	if (rootReducer !== reducer) { throw new Error('Cannot unregister the root reducer becaue it is not the currently registered root reducer.') }
	rootReducer = null
}
