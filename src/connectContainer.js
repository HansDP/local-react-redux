import warning from 'warning'
import { bindActionCreators } from 'redux'
import { createElement, Component, PropTypes } from 'react'

import { LOCAL_REDUX } from './constants'
import parentReduxShape from './parentReduxShape'
import createLocalDispatch from './utils/createLocalDispatch'
import reduceChildren from './utils/reduceChildren'
import createRegisterChildReducer from './utils/createRegisterChildReducer'
import createUnregisterChildReducer from './utils/createUnregisterChildReducer'
import createGetChildState from './utils/createGetChildState'

const noChildren = {}

/**
 * Converts a React component into a React container, which enables isolated Redux state.
 * 
 * It does not modify the component class passed to it.
 * Instead, it returns a new, connected container class, for you to use.
 *
 * @param {Function} reducer A function that handles local state changes based on Redux actions. A reducer works exactly the same as a normal Redux reducer, except that the state reduce is isolated to a container.
 * @param {Function} [mapStateToProps] Optional function. If specified, the component will subscribe to container state updates. Any time it updates, mapStateToProps will be called. Its result must be a plain object, and it will be merged into the component’s props. If you omit it, no container state will get merged into the componets' propos. If ownProps is specified as a second argument, its value will be the props passed to your component, and mapStateToProps will be re-invoked whenever the component receives new props. The signature of this method is (localState, ownProps) => object.
 * @param {Function} [mapDispatchToProps] Optional function. If an object is passed, each function inside it will be assumed to be a local action creator. An object with the same function names, but with every action creator wrapped into a dispatch call so they may be invoked directly, will be merged into the component’s props. If a function is passed, it will be given dispatch. It’s up to you to return an object that somehow uses dispatch to bind action creators in your own way. (Tip: you may use the bindActionCreators() helper from Redux.) If you omit it, the default implementation just injects dispatch into your component’s props. If ownProps is specified as a second argument, its value will be the props passed to your component, and mapDispatchToProps will be re-invoked whenever the component receives new props.
 */
export default (reducer, mapStateToProps, mapDispatchToProps) => { // , mapDispatchToProps

	mapStateToProps = mapStateToProps || (() => null)

	let finalMapDispatchToProps = 
		typeof mapDispatchToProps === 'function'
			? mapDispatchToProps // it is a function -> use as is
			: !mapDispatchToProps
				? (dispatch) => ({ dispatch }) // no mapDispatchToProps specified, use the default
				: (dispatch) => bindActionCreators(mapDispatchToProps, dispatch) // it is an object, bind it to dispatch.

	const initialReducerState = reducer(undefined, { type: LOCAL_REDUX + 'DETERMINE_ININITAL_STATE'})

	return (View) => class HocView extends Component {

		static contextTypes = {
			parentRedux: parentReduxShape.isRequired
		};

		static childContextTypes = {
			parentRedux: parentReduxShape.isRequired
		};

		getChildContext() {
			return {
				parentRedux: this
			}
		}

		constructor(props, context) {
			super(props, context)

			// todo: how to get the display name (maybe in options).
			if (!props.localKey) { throw new Error(`Container '${View.displayName}' is missing the required localKey prop.`) }

			const { parentRedux } = context

			this.localKey = props.localKey
			this.childReducers = {}

			// Ask the parent for the initial state, if any. This is to support to 
			// load state coming from the server (or replay with initial state).
			// If there is no state available, use the initial reducer state.
			this.state = {
				local: initialReducerState,
				...parentRedux.getChildState(this.localKey)
			}

			// Provide the parentReduxShape interface
			this.fullKey = parentRedux.fullKey + this.localKey + '->'
			this.getState = () => this.state.local
			this.getState.global = parentRedux.getState.global
			this.dispatch = createLocalDispatch(this.fullKey, parentRedux.dispatch.global)
			this.registerChildReducer = createRegisterChildReducer(this)
			this.unregisterChildReducer = createUnregisterChildReducer(this)
			this.onChildMountChanged = parentRedux.onChildMountChanged
	        this.getChildState = createGetChildState(this)
		}

		componentWillMount() {
			const { fullKey } = this
			const { parentRedux } = this.context

			// Make sure the parent is taking us (the child) into account.
			parentRedux.registerChildReducer(this.localKey, this.localReduce)

			// Notify the RootContainer that a new child-container is about to be added.
			// This is required to be able to reduce the complete local state again (with
			// this new addition).
			this.onChildMountChanged()
		}

		componentWillUnmount() {
			const { parentRedux } = this.context

			// Make sure the parent is taking us (the child) no longer into account.
			parentRedux.unregisterChildReducer(this.localKey, this.localReduce)

			// Clear the reducer, because if the parent is asking us the state, we don't 
			// have any more.
			this.localReduce = () => null

			// Notify the RootContainer that a new child-container is about to be removed.
			// This is required to be able to reduce the complete local state again (with)
			// this removal). 
			this.onChildMountChanged() // TODO: name should be 'unmount'
		}

		render() {
			const { parentRedux } = this.context
			const { dispatch, props } = this

			// If the render() method is hit the first time, the localReduce() method will not 
			// have been executed yet (that happens in the onChildMountChanged() of the
			// RootContainer, but that method waits until all children have been mounted -- to
			// optimize the amount of localReduce calls in the complete tree)
			//
			// But, that is ok. We already have determined our initial state (in the constructor, we 
			// ask our parent to get the initial state).

			const localState = this.getState()

			return createElement(View, {
				...mapStateToProps(localState, props),
				...finalMapDispatchToProps(dispatch, props), // TODO: only needed when props has changed -- todo
				...props
			})
		}

		localReduce = (state = { local: initialReducerState }, action) => {

			const { fullKey, childReducers } = this
			const { local, children } = state

			const { type } = action
			const isLocalAction = type && type.indexOf(LOCAL_REDUX) === 0
			const isActionForSubtree = !isLocalAction || type.indexOf(fullKey) === 0
			const isActionForReducer = !isLocalAction || !isActionForSubtree || type.indexOf('->', fullKey.length) === -1 // is local type containing an action-type for this reducer?

			warning((isLocalAction && isActionForSubtree && isActionForReducer) || !action.globalType, 'An action is being dispatched which has a property \'globalType\'. This is a reserved key for a local-react-redux container and will be overwritten.')

			// Check if this action is intended for this container (the additional information
			// has been added by the RootContainer).
			const localAction = isLocalAction && isActionForSubtree && isActionForReducer
									? { ...action, type: type.substr(fullKey.length), globalType: type }
									: action
			
			// Ask the reducer to reduce
			const newLocalState = (!isLocalAction || (isActionForSubtree && isActionForReducer)) ? reducer(local, localAction) : local
			
			// Update the state, if changed. To accomodate for immutability.
			if (local !== newLocalState) {
				state = {
					...state,
					local: newLocalState
				}
			}

			// Reduce all the registered children.

			// Make sure to only use child-state of children that are still alive.
			const finalChildrenState = removeUnmountedChildState(children, this.childReducers)

			const newChildrenState = (!isLocalAction || isActionForSubtree) ? reduceChildren(finalChildrenState || noChildren, this.childReducers, action) : children
			// Update the state, if changed. To accomodate for immutability.
			if (newChildrenState !== children) {
				state = {
					...state,
					children: newChildrenState
				}
			} 
			
			// local and children state is finialized. If anything changed, we need to 
			// update UI.
			if (this.state.local !== state.local || this.state.children !== state.children) {
				this.setState(state)
			}

			return state
		};

		shouldComponentUpdate(nextProps, nextState) {
			// Only local state is important (child-containers will handle their own update-logic -- same method of course)
			if (nextState.local !== this.state.local) {
				return true
			}
			// Accomodate for properties that come in (e.g. a higher-order connect() of Redux)
			const { props } = this
			return Object.keys(nextProps).some((key) => nextProps[key] !== props[key])
		}
	}
}

const removeUnmountedChildState = (children, childReducers) => {
	if (!children) {
		return children
	}

	let isDifferent = false

	const updatedChildren = Object.keys(children).reduce((state, childkey) => {
		if (childReducers[childkey]) {
			state[childkey] = children[childkey]
		} else {
			isDifferent = true
		}
		return state
	}, {})

	return isDifferent ? updatedChildren : children
}


