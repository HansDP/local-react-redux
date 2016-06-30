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

        this.fullKey = `${LOCAL_REDUX}/`
        this.childReducers = {}
        this.dispatch = createLocalDispatch(this.fullKey, dispatch)
        this.globalDispatch = dispatch
		this.registerChildReducer = createRegisterChildReducer(this.childReducers)
		this.unregisterChildReducer = createUnregisterChildReducer(this.childReducers)

        let requiresLocalReduce = true
        this.onContainerDidMount = () => {
            if (requiresLocalReduce) {
                requiresLocalReduce = false
                setTimeout(() => {
                    requiresLocalReduce = true
                    this.dispatch({ type: 'CONTAINER_MOUNT' })
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

        action = { 
            raw: action
        }

        // check if this is a local action
        if (action.raw.type.indexOf(LOCAL_REDUX) === 0) {
            const lastIndex = action.raw.type.lastIndexOf('->')
            if (lastIndex !== -1) {
                action = {
                    ...action,
                    type: action.raw.type.substr(lastIndex + 2),
                    target: action.raw.type.substr(0, lastIndex + 2)
                }
            }
        }

        return reduceChildren(state, childReducers, action)
    };

	render() {
		return Children.only(this.props.children)
	}
}

export default connect((state) => ({ reduxState: state }))(RootContainer)
