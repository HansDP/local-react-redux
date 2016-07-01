import React from 'react'
import Counter from '../counter/container'
import { container } from 'local-redux'
import reducer from './reducer'

const mapStateToProps = (state, ownProps) => {
	return {
		amount: state.amount
	}
}

export default container(reducer, mapStateToProps)(({ amount, dispatch }) => {
	return (
		<div>
			<button onClick={ () => dispatch({ type: 'ADD_COUNTER'}) }>Add counter</button> or <button onClick={ () => dispatch({ type: 'REMOVE_COUNTER'}) }>Remove last counter</button>
			<div>
			{
				Array.from(Array(amount)).map((v,index) => <Counter key={ index } localKey={ 'counter_' + index } />)
			}
			</div>
		</div>
	)
})	