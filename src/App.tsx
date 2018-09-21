import * as React from 'react';
import './App.css';

import MyComponent from './MyComponent';

class App extends React.Component {
  public render() {
    return (
      <div className="App">
        <MyComponent />
      </div>
    );
  }
}

export default App;
