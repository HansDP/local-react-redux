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
			if (!props.localKey) { throw new Error(`View '${View.displayName}' is missing the required localKey prop.`) }

			const { parentRedux } = context

			this.localKey = props.localKey
			this.childReducers = {}
			// Ask the parent for the initial state
			this.state = {
				// children: {},
				local: initialReducerState,
				...parentRedux.getChildState(this.localKey)
			} //  { container: { local: initialReducerState, children: {} } }

			// parentReduxShape interface
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
			parentRedux.registerChildReducer(this.localKey, this.localReduce)

			// Notify the RootContainer that a new child-container is about to be added.
			// This is required to be able to reduce the complete local state again (with
			// this new addition).
			this.onChildMountChanged()
		}

		componentWillUnmount() {
			const { parentRedux } = this.context
			parentRedux.unregisterChildReducer(this.localKey, this.localReduce)   

			// Notify the RootContainer that a new child-container is about to be removed.
			// This is required to be able to reduce the complete local state again (with)
			// this removal). 
			this.localReduce = () => null
			this.onChildMountChanged() // TODO: name should be 'unmount'
		}

		render() {
			const { parentRedux } = this.context
			const { dispatch, props } = this

		// TODO: review comment
			// If the render() method is hit the first time, the localReduce() method will not 
			// have been executed yet (that happens in the onChildMountChanged() of the
			// RootContainer, but that method waits until all children have been mounted -- to
			// optimize the amount of localReduce calls in the complete tree)
			//
			// But, we know the state is such a case: it is the reducer's initial state.

			const localState = this.getState()

			return createElement(View, {
				...mapStateToProps(localState, props),
				...finalMapDispatchToProps(dispatch, props),
				...props
			})
		}

		localReduce = (state = { local: initialReducerState }, action) => {

// this.reduced = true

			const { fullKey, childReducers } = this
			const { local, children } = state

			const { type } = action
			const isLocalAction = type && type.indexOf(LOCAL_REDUX) === 0
			const isActionForSubtree = !isLocalAction || type.indexOf(fullKey) === 0
			const isActionForReducer = !isLocalAction || !isActionForSubtree || type.indexOf('->', fullKey.length) === -1 // is local type containing an action-type for this reducer?

			warning(isLocalAction && isActionForSubtree && isActionForReducer && action.globalType, 'An action is being dispatched which has a property \'globalType\'. This is a reserved key for a local-react-redux container and will be overwritten.')

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


