// @flow
import * as React from 'react';
import { StorageProvider } from "./decorators/store";
import { EventReportWithStatus } from './domain';

@StorageProvider({
  combine: [EventReportWithStatus]
})
export default class MyComponent extends React.Component<any, any> {

  public onClick = () => this.props.actions.EventReportWithStatus.fetchEventWithStatus(['evt1', 'evt2'])
  public onClickCountUp = () => this.props.actions.EventReportWithStatus.upCount();
  public onClickCountDown = () => this.props.actions.EventReportWithStatus.downCount();

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