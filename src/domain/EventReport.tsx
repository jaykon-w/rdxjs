import { Action, CompositeAction, Storage } from "../decorators/store";

@Storage
export class EventReport {
  public state = {
    events: [] as Array<{eventId: string}>,
    loading: false,
  }

  @CompositeAction
  public async fetchEvent(eventIds: string[]) {
    this.setLoading(true);
    const response = await this.getEvents(eventIds);
    const events = response;

    this.setEvents(events);
    this.setLoading(false);
  }

  @Action
  public setEvents(events: any[]) {
    return {
      ...this.state,
      events
    }
  }

  @Action
  public setLoading(loading: boolean) {
    return {
      ...this.state,
      loading
    }
  }

  private async getEvents(eventIds: string[]) {
    return new Promise<Array<{eventId: string}>>(res => {
      setTimeout(() => {
        res([{eventId: '1'}])
      }, 1000);
    });
  }
}
