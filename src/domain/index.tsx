import { AnvisaStatus } from './AnvisaStatus';
import { EventReport } from './EventReport';
import { EventReportWithStatus } from './EventReportWithStatus';

import { createReducers } from '../decorators/store';


export {
  AnvisaStatus,
  EventReport,
  EventReportWithStatus,
};
export default createReducers({
  AnvisaStatus,
  EventReport,
  EventReportWithStatus
});