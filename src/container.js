import warning from 'warning'
import { createElement, Component, PropTypes } from 'react'

import { LOCAL_REDUX } from './constants'
import parentReduxShape from './parentReduxShape'
import createLocalDispatch from './utils/createLocalDispatch'
import reduceChildren from './utils/reduceChildren'
import createRegisterChildReducer from './utils/createRegisterChildReducer'
import createUnregisterChildReducer from './utils/createUnregisterChildReducer'

const defaultStateGraph = {
	children: {}
}

export default (reducer, mapStateToProps) => {

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

			// TODO: what if the original state-graph has some state (like server-side rendered state graph)
			this.state = { container: { local: initialReducerState, children: {} } }

			// parentReduxShape interface
			this.fullKey = parentRedux.fullKey + this.localKey + '->'
			this.getState = () => this.state.container.local
			this.getState.global = parentRedux.getState.global
			this.dispatch = createLocalDispatch(this.fullKey, parentRedux.dispatch.global)
			this.registerChildReducer = createRegisterChildReducer(this.childReducers)
			this.unregisterChildReducer = createUnregisterChildReducer(this.childReducers)
			this.onContainerDidMount = parentRedux.onContainerDidMount
		}

		componentWillMount() {
			const { fullKey } = this
			const { parentRedux } = this.context
			parentRedux.registerChildReducer(this.localKey, this.localReduce)

			// Notify the RootContainer that a new child-container is about to be added.
			// This is required to be able to reduce the complete local state again (with
			// this new addition).
			this.onContainerDidMount()
		}

		componentWillUnmount() {
			const { parentRedux } = this.context
			parentRedux.unregisterChildReducer(this.localKey, this.localReduce)   

			// TODO: Test this:
			// Notify the RootContainer that a new child-container is about to be removed.
			// This is required to be able to reduce the complete local state again (with)
			// this removal). 
			// this.lastState = null
			this.localReduce = () => null
			this.onContainerDidMount()
		}

		render() {
			const { parentRedux } = this.context
			const { dispatch, props } = this

// if (!this.reduced) return null 

			// If the render() method is hit the first time, the localReduce() method will not 
			// have been executed yet (that happens in the onContainerDidMount() of the
			// RootContainer, but that method waits until all children have been mounted -- to
			// optimize the amount of localReduce calls in the complete tree)
			//
			// But, we know the state is such a case: it is the reducer's initial state.
			//
			// const state = this.lastState 
			//				 ? this.lastState.local 
			//				 : initialReducerState
			const state = this.state.container.local

			return createElement(View, {
				...mapStateToProps(state, props),
				...props,
				dispatch
			})
		}

		localReduce = (state, action) => {

// this.reduced = true

			const { fullKey, childReducers } = this
			const initialState = (state || this.state.container.local )
			const { local, children = defaultStateGraph.children } = initialState

			const { type } = action
			const isLocalAction = type && type.indexOf(LOCAL_REDUX) === 0
			const isActionForSubtree = !isLocalAction || type.indexOf(fullKey) === 0
			const isActionForReducer = !isLocalAction || !isActionForSubtree || type.indexOf('->', fullKey.length) === -1 // is local type containing an action-type for this reducer?

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
			const newChildrenState = (!isLocalAction || isActionForSubtree) ? reduceChildren(children, this.childReducers, action) : children
			// Update the state, if changed. To accomodate for immutability.
			if (newChildrenState !== children) {
				state = {
					...state,
					children: newChildrenState
				}
			} 
			
			// local and children state is finialized. If anything changed, we need to 
			// update UI.

			// this.stateNotChanged = initialState === state

			if (initialState !== state) {
				this.setState({ container: state })
			}
			// // Last reduced state. We can re-use this in the render phase.
			// this.lastState = state

			return state
		};

		shouldComponentUpdate(nextProps, nextState) {
			if (nextState.container.local !== this.state.container.local) {
				return true
			}
			// Accomodate for properties that come in (e.g. a higher-order connect() of Redux)
			const { props } = this
			return Object.keys(nextProps).some((key) => nextProps[key] !== props[key])
		}
	}
}