import * as React from 'react';
import { render } from 'react-dom';
import { Provider } from 'react-redux';
import { compose, createStore } from 'redux';
import App from './App';
import { ReduxWrapper } from './decorators/store';
import reducers from './domain';
import registerServiceWorker from './registerServiceWorker';

import './index.css';

const env = process.env.NODE_ENV || "development";
if (env === 'development'){
  console.log(env);
} 

const composeEnhancers = typeof window === 'object' && window['__REDUX_DEVTOOLS_EXTENSION_COMPOSE__'] ?
	window['__REDUX_DEVTOOLS_EXTENSION_COMPOSE__']({}) :
	compose;

let initialState = reducers(undefined, { type: null });

if (env === 'development') {
  initialState = window.localStorage.getItem('state') === null ? initialState : JSON.parse(window.localStorage.getItem('state') || '');
}
console.log(initialState);

const store = createStore(reducers, initialState, window['__REDUX_DEVTOOLS_EXTENSION__'] && window['__REDUX_DEVTOOLS_EXTENSION__']());
// if development save state to localstorage
if(env === 'development') {
  store.subscribe(() => {
    const state = store.getState();
    window.localStorage.setItem('state', JSON.stringify(state));
  });
}


render(
	<Provider store={store}>
    <ReduxWrapper store={store}>
		  <App />
    </ReduxWrapper>
	</Provider>, document.getElementById('root')
);

if (module['hot']) {
	module['hot'].accept('./App', () => {
		const NextApp = require('./App').default
		render(
			<Provider store={store}>
        <ReduxWrapper store={store}>
          <NextApp />
        </ReduxWrapper>
			</Provider>, document.getElementById('root'))
	})
}

registerServiceWorker();
