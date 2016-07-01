
export default (state = { amount: 0 }, action) => {

	if (action.isLocal) {
		switch (action.type) {
			case 'ADD_COUNTER': 
				return {
					...state,
					amount: state.amount + 1
				}

			case 'REMOVE_COUNTER':
				return {
					...state,
					amount: Math.max(0, state.amount - 1)
				}
		}
	}

	return state
}