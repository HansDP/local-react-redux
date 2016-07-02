import React, { Component, PropTypes } from 'react'
import { compose } from 'redux'
import parentReduxShape from './parentReduxShape'

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

	return (createContainer) => (reducer, mapStateToProps) => (View) => createContainer(reducer, mapStateToProps)(class ViewWithMiddleware extends Component {

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