import React, { Component, PropTypes } from 'react'
import { compose } from 'redux'
import parentReduxShape from './parentReduxShape'

/**
 * Creates a container enhancer that applies middleware to the local dispatch 
 * method of the container. This is handy for a variety of tasks, such as 
 * expressing asynchronous actions in a concise manner, or logging every action 
 * payload.
 *
 * Most redux middlewares can be applied to a container, because they share the
 * same API (dispatch and getState).
 *
 * In the middleware, the `dispatch(...)` and `getState()` are performed localy
 * on the current container. If you need perform those actions on a global level
 * (thus using Redux store's dispatch and getState), you should use `global`
 * property of the passed methods.
 *
 * ```javascript
 * const middleWare = ({dispatch, getState}) => (next) => (action) => {
 *   
 *   // Local scope
 *   cosnt localState = getState()
 *   dispatch({ type: 'LOCAL_ACTION' })
 *
 *   // Global scope
 *   cosnt globalState = getState.global()
 *   dispatch.global({ type: 'GLOBAL_ACTION' })
 * }
 * ``` 
 *
 * Because middleware is potentially asynchronous, this should be the first
 * container enhancer in the composition chain.
 *
 * @param {...Function} middlewares The middleware chain to be applied.
 * @returns {Function} A container enhancer applying the middleware.
 */
export default (...middlewares) => {

	const createDispatch = (parentRedux) => {
		const middlewareAPI = {
			dispatch: parentRedux.dispatch,
			getState: parentRedux.getState,
		}

		const chain = middlewares.map(middleware => middleware(middlewareAPI))
		const finalDispatch = compose(...chain)(parentRedux.dispatch)
		finalDispatch.global = parentRedux.dispatch.global
		return finalDispatch
	}

	return (createContainer) => (...args) => (View) => createContainer(...args)(class ViewWithMiddleware extends Component {

		static contextTypes = {
			parentRedux: parentReduxShape.isRequired
		};

		static childContextTypes = {
			parentRedux: parentReduxShape.isRequired
		};

		getChildContext() {
			return {
				parentRedux: this.parentRedux
			}
		}

		constructor(props, context) {
			super(props, context)

			const { parentRedux: originalParentRedux } = context

			// Override the dispatch method to go through the middleware.
			this.parentRedux = {
				...originalParentRedux,
				dispatch: createDispatch(originalParentRedux)
			}
		}

		render() {
			const { dispatch } = this.parentRedux
			return React.createElement(View, { ...this.props, dispatch })
		}
	})
}