# [local-redux](https://github.com/HansDP/local-redux)

This project enables you to work with local ([React](https://facebook.github.io/react/)) container component state, using one global [Redux](https://github.com/reactjs/redux/) store.

#### What is this project trying to solve?

In Redux, state is considered global. That makes it hard to create isolated and reusable container components, which require their own local state. This projects tries to abstract away the complexity to handle this problem, without breaking all the great tooling of Redux.

#### Influences

Most of the inspiration was found in the ideas of [redux-elm](http://salsita.github.io/redux-elm/). Because `local-redux` is influenced by `redux-elm`, which is in its term highly influenced by [The Elm Architecture](https://github.com/evancz/elm-architecture-tutorial/), a lot of concepts will be familiar to both projects.

There are however some key differences to `redux-elm`: 

1. This library avoids opinions about specific implementations of Side Effects.
2. In Redux world, you create [Reducers](http://redux.js.org/docs/basics/Reducers.html), which  specify the application state in response of an action. With [local-redux](https://github.com/HansDP/local-redux), local reducers are no different.


## The Gist

We are working on documentation and examples. 

Please stay tuned. 

For the moment, take a look at the code sample below, it should give you an idea of how it will look like.

#### Counter

##### The React container component

If you have ever user Redux with React, the container component will be very familiar. And that is by choice: you should be able to create local containers with the skillset you gained when you started using Redux and React.

The main difference is that your component must be wrapped with a higher-order component: a `container()`

The `container()` takes two arguments:

1. The reducer for this container component.
2. How local state is mapped to props of your React component.


```javascript
import React from 'react'
import { container } from 'local-redux'

import reducer from './reducer'

const mapStateToProps = (localState, ownProps) => {
  return {
    counter: localState.counter
  }
}

export default container(reducer, mapStateToProps)(({ dispatch, counter }) => (
  <div>
    <div>
      <div>Count: { counter }</div>
      <button onClick={ () => dispatch({ type: 'INCREMENT_COUNTER'}) }>Increment counter</button>
    </div>  
  </div>
))

```

##### The reducer -- a Redux reducer that is aware of the local nature of your component

The action has an additional property: `isLocal`. This flag will be true if the globaly dispatched action is targetted at a specific container.
In your reducer, you are still capable of inspecting other, globaly dispatched actions.

```javascript
export default (state = { counter: 0 }, action) => {

  if (action.isLocal) {
    switch (action.type) {
      case 'INCREMENT_COUNTER': 
        return {
          ...state,
          counter: state.counter + 1
        }
    }
  }

  return state
}

```

## Examples

*Coming up*


## Installation & Usage

You can install `local-redux` via npm.

```
npm install local-redux --save
```