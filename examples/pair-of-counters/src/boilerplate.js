import React from 'react'
import { render } from 'react-dom'
import { createStore, compose, combineReducers } from 'redux'
import { Provider } from 'react-redux'

import { containersReducer, RootContainer } from 'local-react-redux'

export default (containerDomId, Container) => {
  const storeFactory = compose(
    window.devToolsExtension ? window.devToolsExtension() : f => f
  )(createStore)

  const store = storeFactory(combineReducers({
    containers: containersReducer
  }))

  render((
    <Provider store={store}>
      <RootContainer>
        <Container localKey='example' />
      </RootContainer>
    </Provider>
    ), document.getElementById(containerDomId))
}
