import * as R from 'ramda';
import { createSelector } from 'reselect';
import { Action, CompositeAction, IStorage, StateMapper, Storage } from "../decorators/store";
import { AnvisaStatus } from "./AnvisaStatus";
import { EventReport } from "./EventReport";

@Storage({
  inject: ['AnvisaStatus', 'EventReport']
})
export class EventReportWithStatus implements IStorage {

  public state = {
    count: 0,
    eventWithStatus: [],
    loading: false,
  }

  constructor(
    public anvisaStatus: AnvisaStatus, 
    public eventReport: EventReport
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
    return createSelector(
    () => this.anvisaStatus.state,
    () => this.eventReport.state,
    (AnvisaStatus: any, EventReport: any) => {
      return {
        ...store,
        AnvisaStatus,
        EventReport,
        eventWithStatus: [
          ...store.eventWithStatus,
          ...EventReport.events.map((e: any) => {
            return {
              ...e,
              statusAnvisa: AnvisaStatus.indexedStatus[e.eventId]
            };
          })
        ]
      }
    })(store);
  }

}

