import * as R from 'ramda';
import { Action, CompositeAction, Storage } from "../decorators/store";

@Storage
export class AnvisaStatus {
  public state = {
    indexedStatus: {},
    loading: false,
    status: [],
  } 

  @CompositeAction
  public async fetchStatusByTokens(tokens: string[]) {
    this.setLoading(true);
    const response = await this.getStatus(tokens);
    const status = response as Array<{token: string}>;

    this.setStatus(status);
    this.setLoading(false);
  }

  @Action('SET_STATUS')
  public setStatus(status: Array<{token: string}>) {
    return {
      ...this.state,
      indexedStatus: R.indexBy(R.prop('token'), status),
      status,
    }
  }

  @Action
  public setLoading(loading: boolean) {
    return {
      ...this.state,
      loading
    }
  }

  private async getStatus(tokens: string[]) {
    const response = await Promise.resolve([{token: '1'}]);
    return response;
  }
}
