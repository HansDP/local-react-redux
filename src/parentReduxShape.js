import { PropTypes } from 'react'

export default PropTypes.shape({
	fullKey: PropTypes.string.isRequired,
	registerChildReducer: PropTypes.func.isRequired,
	unregisterChildReducer: PropTypes.func.isRequired,
	dispatch: PropTypes.func.isRequired,
	getState: PropTypes.func.isRequired,
	onContainerDidMount: PropTypes.func.isRequired
})
