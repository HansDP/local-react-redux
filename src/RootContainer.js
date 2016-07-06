import React, { Children, PropTypes } from 'react'
import { connect } from 'react-redux'

import { registerRootReducer, unregisterRootReducer } from './localReduxReducer'
import { LOCAL_REDUX } from './constants'
import parentReduxShape from './parentReduxShape'
import createLocalDispatch from './utils/createLocalDispatch'
import reduceChildren from './utils/reduceChildren'
import createRegisterChildReducer from './utils/createRegisterChildReducer'
import createUnregisterChildReducer from './utils/createUnregisterChildReducer'
import createGetChildState from './utils/createGetChildState'

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

        this.state = {}

		this.fullKey = LOCAL_REDUX
		this.childReducers = {}
		this.dispatch = createLocalDispatch(this.fullKey, dispatch)
		this.getState = () => getGlobalState()
		this.getState.global = getGlobalState
		// this.dispatch.global = dispatch
		this.registerChildReducer = createRegisterChildReducer(this)
		this.unregisterChildReducer = createUnregisterChildReducer(this)
        this.getChildState = createGetChildState(this)

		let requiresLocalReduce = true
		this.onChildMountChanged = () => {
			if (requiresLocalReduce) {
				requiresLocalReduce = false
				setTimeout(() => {
					requiresLocalReduce = true
					dispatch({ type: '@@LOCAL_REDUX_CHILDCONTAINERS_MOUNT' })
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
        const { dispatch } = this.props
        dispatch({ type: '@@LOCAL_REDUX_ROOTCONTAINER_MOUNT' })
	}

	componentWillUnmount() {
		unregisterRootReducer(this.localReduce)
	}

    shouldComponentUpdate(nextProps, nextState) {
        if (nextState.children !== this.state.children) {
            return true
        }

        // Accomodate for properties that come in (e.g. a higher-order connect() of Redux)
        const { props } = this
        return Object.keys(nextProps).some((key) => nextProps[key] !== props[key])
    }    

	localReduce = (state, action) => {
		const { childReducers } = this
		const reducedChildren = reduceChildren(state, childReducers, action)

        if (this.state.children !== reducedChildren) {
            this.setState({ children: reducedChildren })
        }

        return reducedChildren
	};

	render() {
        // If not been reduced yet, wait for it.
        if (!this.state.children) {
            return null
        }
		return Children.only(this.props.children)
	}
}

export default connect((state) => ({ reduxState: state }))(RootContainer)
