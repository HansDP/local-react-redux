import React from 'react'
import connectContainer from 'local-react-redux'

import reducer from './reducer'


const mapStateToProps = (state, ownProps) => {
	return {
		counter: state.counter
	}
}

export default connectContainer(reducer, mapStateToProps)(({ dispatch, counter }) => (
	<div>
		<button onClick={() => dispatch({ type: 'DECREMENT_COUNTER' })}>-</button>
		<div style={countStyle}>{counter}</div>
		<button onClick={() => dispatch({ type: 'INCREMENT_COUNTER' })}>+</button>
	</div>
))

const countStyle = {
	fontSize: '20px',
	fontFamily: 'monospace',
	display: 'inline-block',
	width: '50px',
	textAlign: 'center'
}
