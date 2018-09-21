import * as R from 'ramda';
import { createSelector } from 'reselect';
import { Action, CompositeAction, CompositeStorage, Inject, StateMapper } from "../decorators/store";
import { AnvisaStatus } from "./AnvisaStatus";
import { EventReport } from "./EventReport";

@Inject('EventReport')
@Inject('AnvisaStatus')
@CompositeStorage
export class EventReportWithStatus {

  /*
   * Uma CompositeStorage une no seu estado um ou mais estados com base nos quais foram injetados
   *
  state = {
    AnvisaStatus: this.anvisaStatus.state,
    EventReport: this.eventReport.state,
  }
  */

  public state = {
    count: 0,
    eventWithStatus: [],
    loading: false,
  } 

  constructor(public anvisaStatus: AnvisaStatus, public eventReport: EventReport
  ) {}

  @CompositeAction
  public async fetchEventWithStatus(eventIds: string[]) {
    this.setLoading(true);
    setTimeout(async () => {
      await this.eventReport.fetchEvent(eventIds);
      await this.anvisaStatus.fetchStatusByTokens(R.pluck('eventId', this.eventReport.state.events));
    
      this.setLoading(false);
    }, 2000);

  }

  @Action
  public setLoading(loading: boolean) {
    return {
      ...this.state,
      loading
    }
  }

  @Action
  public upCount() {
    return {
      ...this.state,
      count: this.state.count+1
    }
  }

  @Action
  public downCount() {
    return {
      ...this.state,
      count: Math.max(0, this.state.count-1)
    }
  }

  @StateMapper
  private getEventWithStatus(store: any) {
    return createSelector([
      (store: any) => store.EventReport.events || [],
      (store: any) => store.AnvisaStatus.indexedStatus || {}, 
    ],
    (events: any[], indexedStatus: {}) => {
      return {
        ...store,
        eventWithStatus: [
          ...store.eventWithStatus,
          ...events.map(e => {
            return {
              ...e,
              statusAnvisa: indexedStatus[e.eventId]
            };
          })
        ]
      }
    })(store);
  }

}

