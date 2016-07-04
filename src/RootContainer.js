import React, { Children, PropTypes } from 'react'
import { connect } from 'react-redux'

import { registerRootReducer, unregisterRootReducer } from './localReduxReducer'
import { LOCAL_REDUX } from './constants'
import parentReduxShape from './parentReduxShape'
import createLocalDispatch from './utils/createLocalDispatch'
import reduceChildren from './utils/reduceChildren'
import createRegisterChildReducer from './utils/createRegisterChildReducer'
import createUnregisterChildReducer from './utils/createUnregisterChildReducer'

class RootContainer extends React.Component {

	static childContextTypes = {
		parentRedux: parentReduxShape.isRequired
	};

	static propTypes = {
		dispatch: PropTypes.func.isRequired,
		children: PropTypes.element.isRequired
	};

	constructor(props, context) {
		super(props, context)

		// Get the Redux store's (global) dispatch method. 
		// This is passed in by react-redux mapDispatchToProps
		const { dispatch } = props // 
		const getGlobalState = () => this.props.reduxState

		this.fullKey = LOCAL_REDUX
		this.childReducers = {}
		this.dispatch = createLocalDispatch(this.fullKey, dispatch)
		this.getState = () => getGlobalState()
		this.getState.global = getGlobalState
		// this.dispatch.global = dispatch
		this.registerChildReducer = createRegisterChildReducer(this.childReducers)
		this.unregisterChildReducer = createUnregisterChildReducer(this.childReducers)

		let requiresLocalReduce = true
		this.onContainerDidMount = () => {
			if (requiresLocalReduce) {
				requiresLocalReduce = false
				setTimeout(() => {
					requiresLocalReduce = true
					dispatch({ type: '@@LOCAL_REDUX_CONTAINER_MOUNT' })
				}, 0)
			}
		}
	}

	getChildContext() {
		return {
			parentRedux: this
		}
	}

	componentWillMount() {
		registerRootReducer(this.localReduce)
	}

	componentWillUnmount() {
		unregisterRootReducer(this.localReduce)
	}

	localReduce = (state, action) => {
		const { childReducers } = this
		return reduceChildren(state, childReducers, action)
	};

	render() {
		return Children.only(this.props.children)
	}
}

export default connect((state) => ({ reduxState: state }))(RootContainer)
