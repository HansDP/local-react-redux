import React from 'react'
import { render } from 'react-dom'
import { createStore, compose, combineReducers } from 'redux'
import { Provider } from 'react-redux'

import { localReduxReducer, RootContainer } from 'local-react-redux'

export default (containerDomId, Container) => {
  const storeFactory = compose(
    window.devToolsExtension ? window.devToolsExtension() : f => f
  )(createStore)

  const store = storeFactory(combineReducers({
    localRedux: localReduxReducer
  }))

  render((
    <Provider store={store}>
      <RootContainer>
        <Container localKey='example' />
      </RootContainer>
    </Provider>
    ), document.getElementById(containerDomId))
}
