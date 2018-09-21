/* @flow */
import * as React from 'react';
import { connect } from 'react-redux';
import { Action, combineReducers, Store } from 'redux';
import { BehaviorSubject, combineLatest } from 'rxjs';
import { map, share, withLatestFrom } from 'rxjs/operators';


const actions = {};
const compositeAction = {};

const reducers = {};

const injectables = {};

const actionsSymbol = Symbol('actions');
// const stateSymbol = Symbol('state');
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

    combinedReducers[e] = (state = initialState[e], action: Action & {payload: any[]}) => {
      const newState = reducers[e][action.type] ? 
        ((payload) => reducers[e][action.type](...payload))(action.payload) : 
        state;
      
      instance.state$.next(newState);
      return newState;
    }
  });

  return combineReducers(combinedReducers);
}

export const ReduxWrapper = (props: {store: Store, children: React.ReactElement<any>}) => {
  Object.keys(actions).forEach(e => {
    Object.keys(actions[e]).forEach(k => {
      const original = actions[e][k];
      actions[e][k] = (...args: any[]) => props.store.dispatch(original(...args));
    });
  });

  Object.keys(compositeAction).forEach(e => {
    Object.keys(compositeAction[e]).forEach(k => {
      compositeAction[e][k] = compositeAction[e][k].bind(injectables[e].getInstance());
    });
  });

  return props.children;
}

export interface IStorage {
  state: {[key: string]: any};
}

export function Storage<T>(target: any ) {
  class Wrapper extends target {

    public static instance: Wrapper;

    public static getInstance() {
      if (Wrapper.instance) {
        return Wrapper.instance;
      }
      return Wrapper.instance = new Wrapper();
    }

    public state$ = new BehaviorSubject(this.state);

    constructor() {
      super();
      this.state$.subscribe((newState: any) => this.state = {...newState});
    }
    
  }

  injectables[target.name] = Wrapper;
  return target;
}

export function CompositeStorage(target: any) {
  class CompositeWrapper extends target {

    public static instance: CompositeWrapper;

    public static getInstance() {
      if (CompositeWrapper.instance) {
        return CompositeWrapper.instance;
      }

      const dependencies = [] as any[];
      const states = {};
      const dependenciesNames = target[injectsSymbol] || [] as any[];

      dependenciesNames.forEach((e: any) => {
        dependencies.push(injectables[e].getInstance());
        states[e.depencency] = injectables[e].getInstance().state;
      });

      CompositeWrapper.instance = new CompositeWrapper(...dependencies);
      CompositeWrapper.instance.state = {
        ...CompositeWrapper.instance.state,
        ...dependenciesNames
          .map((e: string) => injectables[e].getInstance().state)
          .reduce((a: any, b: any) => ({...a, ...b}), {})
      }

      CompositeWrapper.instance.state$
        .pipe(
          withLatestFrom(
            combineLatest(
              ...dependenciesNames.map((e: string) => injectables[e].getInstance().state$)
            )
          ),
          map(([myNewState, compositeStates]) => {
            return {
              ...myNewState,
              ...dependenciesNames.map((e: string, i: number) => {
                return {[e]: compositeStates[i]}
              }).reduce((a: any, b: any) => ({...a, ...b}), {}),
            };
          })
        ).subscribe(newState => {
          CompositeWrapper.instance.state = {...newState};
        });

      return CompositeWrapper.instance;
    }

    public state$ = new BehaviorSubject(this.state);

    constructor(...args: any[]) {
      super(...args);
    }
    
  }
  
  injectables[target.name] = CompositeWrapper;
  return target;
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
};

export function Inject(dependency: string) {
  return (target: any) => {
    target[injectsSymbol] = [
      ...(target[injectsSymbol] || []),
      dependency,
    ]
  }
}

export function StateMapper(target: any, key: string, descriptor: any) {
  target.constructor[stateMappersSymbol] = target.constructor[stateMappersSymbol] || [];
  target.constructor[stateMappersSymbol].push((store: any) => ({
    [target.constructor.name]: descriptor.value(store[target.constructor.name]),
  }));
    
  return descriptor;
}

export function StorageProvider(config: {
  combine: any[],
  mapStateToProps: (store: any) => any,
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
