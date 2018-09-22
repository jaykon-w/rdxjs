import * as R from 'ramda';
import * as React from 'react';
import { connect } from 'react-redux';
import { Action as ReduxAction, combineReducers, Store } from 'redux';
import { BehaviorSubject } from 'rxjs';

const actions = {};
const compositeAction = {};
const reducers = {};
const injectables = {};

const actionsSymbol = Symbol('actions');
const stateMappersSymbol = Symbol('stateMapper');
const injectsSymbol = Symbol('injects');

export function createReducers() {
  const initialState = {};
  const combinedReducers = {};

  Object.keys(injectables).forEach(e => {
    const instance = injectables[e].getInstance();
    initialState[e] = instance.state;
  });

  Object.keys(reducers).forEach(e => {
    const instance = injectables[e].getInstance();
    Object.keys(reducers[e]).forEach(k => {
      reducers[e][k] = reducers[e][k].bind(instance);
    });

    combinedReducers[e] = (state = initialState[e], action: ReduxAction & {payload: any[]}) => {
      const newState = reducers[e][action.type] ? 
        ((payload) => reducers[e][action.type](...payload))(action.payload) : 
        state;
      
      return newState;
    }
  });

  return combineReducers(combinedReducers);
}

export const ReduxWrapper = (props: {store: Store, children: React.ReactElement<any>}) => {

  Object.keys(actions).forEach(e => {
    Object.keys(actions[e]).forEach(k => {
      const original = actions[e][k];
      actions[e][k] = (...args: any[]) => {
        props.store.dispatch(original(...args))
      }
    });
  });

  Object.keys(compositeAction).forEach(e => {
    Object.keys(compositeAction[e]).forEach(k => {
      compositeAction[e][k] = compositeAction[e][k].bind(injectables[e].getInstance());
    });
  });

  let lastState = {};
  const syncState = () => {
    if (R.equals(lastState, props.store.getState())) {
      return;
    }
    
    lastState = props.store.getState();
    Object.keys(lastState).forEach(e => {
      const instance = injectables[e] && injectables[e].getInstance();
      if (!instance) {
        return;
      }
      instance.state$.next(lastState[e]);
    })
  };

  props.store.subscribe(syncState);
  syncState();

  return props.children;
}

export interface IStorage {
  state: {[key: string]: any};
}

interface IStorageConfig {
  inject: string[];
}

export function Storage(param: IStorageConfig|any) {
  let hasInjects: boolean;
  const wrapped = (target: any ) => {
    if (hasInjects) {
      target[injectsSymbol] = (param as IStorageConfig).inject;
    }

    class Wrapper extends target {

      public static instance: Wrapper;

      public static getInstance() {
        if (Wrapper.instance) {
          return Wrapper.instance;
        }

        const dependencies = [] as any[];
        const dependenciesNames = target[injectsSymbol] || [] as any[];

        dependenciesNames.forEach((e: any) => {
          dependencies.push(injectables[e].getInstance());
        });

        return Wrapper.instance = new Wrapper(...dependencies);
      }

      public state$ = new BehaviorSubject(this.state);

      constructor(...args: any[]) {
        super(...args);
        this.state$.subscribe((newState: any) => {
          this.state = {...newState};
        });
      }
    }

    injectables[target.name] = Wrapper;
    return target;
  }

  if (typeof(param) !== "function") {
    hasInjects = true;
    return wrapped;
  } else {
    return wrapped(param);
  }
}

export function Action(actionNameOrTarget: any, key?: string, descriptor?: any) {
  let hasActionName = false
  const wrapped = (target: any, key?: string, descriptor?: any) => {

    const originalMethod = descriptor.value;

    const action = `${target.constructor.name}/${hasActionName ? actionNameOrTarget : key}`;
    
    actions[target.constructor.name] = actions[target.constructor.name] || {};
    actions[target.constructor.name][key!] = (...args: any[]) => ({
      payload: args,
      type: action,
    });

    reducers[target.constructor.name] = reducers[target.constructor.name] || {};
    reducers[target.constructor.name][action] = originalMethod;

    target[actionsSymbol] = target[actionsSymbol] || {};
    target[actionsSymbol][key!] = descriptor;

    descriptor.value = function (...args: any[]) {
      actions[target.constructor.name][key!](...args);
      return originalMethod.call(this, ...args);
    };

    return descriptor;
  };

  if (typeof(actionNameOrTarget) === 'string') {
    hasActionName = true;
    return wrapped;
  } else {
    return wrapped(actionNameOrTarget, key, descriptor);
  }

}

export function CompositeAction(target: any, key: string, descriptor: any) {

  compositeAction[target.constructor.name] = compositeAction[target.constructor.name] || {};
  compositeAction[target.constructor.name][key!] = descriptor.value;

  target[actionsSymbol] = target[actionsSymbol] || {};
  target[actionsSymbol][key] = descriptor;

  return descriptor;
}

export function StateMapper(target: any, key: string, descriptor: any) {
  target.constructor[stateMappersSymbol] = target.constructor[stateMappersSymbol] || [];
  target.constructor[stateMappersSymbol].push((store: any) => ({
    [target.constructor.name]: descriptor.value.call(injectables[target.constructor.name].getInstance(), store[target.constructor.name]),
  }));
    
  return descriptor;
}

export function StorageProvider(config: {
  combine: any[],
  mapStateToProps?: (store: any) => any,
}) {
  return (target: any) => {
    return connect((store) => {
      const selectedStore = {
        ...config.combine.map(e => ({[e.name]: store[e.name]})).reduce((a, b) => ({...a, ...b}), {})
      };

      const selectors = config.combine.map(e => e[stateMappersSymbol]).reduce((a, b) => [...a, ...b], []);
      
      const withSelectors = (selectedStore: any) => (selectors).reduce((val: any, selector: (store: any) => any) => {
        return selector(val);
      }, selectedStore);

      return {
        ...(config.mapStateToProps ? config.mapStateToProps(withSelectors(selectedStore)) : withSelectors(selectedStore)),
        actions: config.combine.map(e => ({
          [e.name]: {
            ...actions[e.name], 
            ...compositeAction[e.name]
          }
        })).reduce((a, b) => ({...a, ...b}), {})
      };
    })(target) as any;
  }
}
