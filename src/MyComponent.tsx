// @flow
import * as React from 'react';
import { StorageProvider } from "./decorators/store";
import { EventReportWithStatus } from './domain';

@StorageProvider({
  combine: [EventReportWithStatus],
  mapStateToProps: (store) => (
    {
      ...store,
    }
  )
})
export default class MyComponent extends React.Component<any, any> {

  public onClick = () => {
    this.props.actions.EventReportWithStatus.fetchEventWithStatus(['evt1', 'evt2'])
  }

  public onClickCount = (val: 'up'|'down') => {
    if(val === 'up') {
      this.props.actions.EventReportWithStatus.upCount();  
    } else{
      this.props.actions.EventReportWithStatus.downCount();
    }
  }

  public onClickCountUp = () => this.onClickCount('up');
  public onClickCountDown = () => this.onClickCount('down');

  public render() {
    return (
      <div>
        {
          this.props.EventReportWithStatus.loading ? <div>Carregando...</div> :
          <h1>{this.props.EventReportWithStatus.eventWithStatus.map((e: any, i: number) => (
            <div key={i}>
              <p>event: {e.eventId}</p>
              <p>statusAnvisa: {e.statusAnvisa.token}</p>
            </div>
          ))}</h1>
        }
        
        <button onClick={this.onClick}>Clica Ai</button>
        <div>
          <button onClick={this.onClickCountUp}> + </button>
          {this.props.EventReportWithStatus.count}
          <button onClick={this.onClickCountDown}> - </button>
        </div>
        
      </div>
    );
  }
}