import React, { Children, PropTypes } from 'react'
import { connect } from 'react-redux'

import { registerRootReducer, unregisterRootReducer } from './containersReducer'
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
		this.registerChildReducer = createRegisterChildReducer(this)
		this.unregisterChildReducer = createUnregisterChildReducer(this)
        this.getChildState = createGetChildState(this)

		let requiresLocalReduce = true
		this.onChildMountChanged = () => {
			if (requiresLocalReduce) {
				requiresLocalReduce = false
				setTimeout(() => {
					requiresLocalReduce = true
					// Action type is bogus. It is just triggering a new 
					// hit on the reducers, to update redux with the new
					// state of the children.
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

		// Action type is bogus. It is just triggering a new 
		// hit on the reducers, to get the initial state for this root.
		// TODO: maybe need to integrate with onChildMountChanged (to only have
		// one reduce-hit). Or get the initial state from 'global state' (but what 
		// is the key in the state graph (the root reducer knows)? maybe 
		// rootcontainer needs a required prop 'stateKey')
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
