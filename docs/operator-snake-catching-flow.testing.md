# Operator Snake Catching Flow

## Summary

| Field | Value |
|---|---|
| Feature | Operator Snake Catching Flow (Confirm, Assign Rescuer, Cancel, Monitoring) |
| Test requirement | Verify operator can process snake-catching requests on dashboard with correct status transitions, dispatch constraints, and UI feedback |
| Number of TCs | 8 |

## Testing Round Summary

| Testing Round | Passed | Failed | Pending | N/A |
|---|---:|---:|---:|---:|
| Round 1 | 0 | 0 | 8 | 0 |
| Round 2 | 0 | 0 | 8 | 0 |
| Round 3 | 0 | 0 | 8 | 0 |

## Test Cases

| Test Case ID | Test Case Description | Test Case Procedure | Expected Results | Pre-conditions | Round 1 | Test date | Tester | Round 2 | Test date | Tester | Round 3 | Test date | Tester | Note |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| TC801 | Confirm snake-catching request successfully (Pending -> Confirmed) | 1) Login with Operator account<br>2) Open Operator Dashboard<br>3) In tab "Bắt rắn", select a request with status "Chờ xác minh"<br>4) Open request detail modal<br>5) Click "Xác nhận yêu cầu" | Request is confirmed; status badge in detail becomes "Đã xác nhận"; success toast "Yêu cầu đã được xác nhận." is shown | Operator account exists; at least one active request in Pending state | Pending |  |  | Pending |  |  | Pending |  |  |  |
| TC802 | Assign rescuer successfully (Confirmed -> Assigned) | 1) Open a request already in status "Đã xác nhận"<br>2) Click "Điều phối rescuer"<br>3) In dispatch modal, select one available rescuer<br>4) Click "Xác nhận điều phối" | Dispatch completes; success toast "Điều phối đội cứu hộ thành công." is shown; request detail displays assigned rescuer id in "Rescuer được phân công" | Request is Confirmed; at least one rescuer is online and available | Pending |  |  | Pending |  |  | Pending |  |  |  |
| TC803 | Cannot dispatch when no rescuer is selected | 1) Open request detail in Confirmed state<br>2) Click "Điều phối rescuer"<br>3) Do not select any rescuer in list<br>4) Observe action button | Button "Xác nhận điều phối" remains disabled until a rescuer is selected | Request is Confirmed; dispatch modal can be opened | Pending |  |  | Pending |  |  | Pending |  |  |  |
| TC804 | Show empty-state when no eligible rescuer exists | 1) Open dispatch modal for a Confirmed request<br>2) Keep filters "Chỉ trong ca" and "Chỉ online" enabled<br>3) Ensure no rescuer satisfies current filters | Empty-state message "Không có đội cứu hộ phù hợp bộ lọc." is shown; no dispatch success toast appears | Request is Confirmed; test data has no matching rescuer by shift/online filters | Pending |  |  | Pending |  |  | Pending |  |  |  |
| TC805 | Refresh rescuer list in dispatch modal | 1) Open dispatch modal<br>2) Click retry action "Thử lại" when error appears, or close and reopen modal<br>3) Verify rescuer list reload behavior | Rescuer list reloads successfully; no stale loading state; error banner disappears when API call succeeds | Operator can open dispatch modal; backend on-duty API reachable | Pending |  |  | Pending |  |  | Pending |  |  |  |
| TC806 | Cancel request from Confirmed state | 1) Open detail of a request in Confirmed state<br>2) Click "Hủy yêu cầu"<br>3) Wait for dashboard refresh | Success toast "Yêu cầu đã được hủy." is shown; request is removed from active request list | Request is Confirmed and cancellable by operator | Pending |  |  | Pending |  |  | Pending |  |  |  |
| TC807 | Cancel request from Assigned state | 1) Open detail of a request already assigned<br>2) Click "Hủy yêu cầu"<br>3) Confirm dashboard list after action | Success toast "Yêu cầu đã được hủy." is shown; active list no longer contains cancelled request | Request is Assigned and appears in active request list | Pending |  |  | Pending |  |  | Pending |  |  |  |
| TC808 | Verify list-detail consistency for snake-catching request | 1) In dashboard tab "Bắt rắn", click any request row (format CAR-xxxxxx)<br>2) Observe detail modal data (status, address, user, media/species)<br>3) Close and reopen same request from list | Detail modal maps to selected request id; status and address are consistent between row and modal; no mismatch after reopen | At least one request exists in list | Pending |  |  | Pending |  |  | Pending |  |  |  |

## Operator SOS Snake Bite Flow

## Summary

| Field | Value |
|---|---|
| Feature | Operator Snake Bite SOS Flow (Verify, Dispatch, False Alarm, Track Mission) |
| Test requirement | Verify operator can process SOS case from Pending to Verified, dispatch rescuer from Verified, and handle false alarm or completion states with correct UI feedback |
| Number of TCs | 6 |

## Testing Round Summary

| Testing Round | Passed | Failed | Pending | N/A |
|---|---:|---:|---:|---:|
| Round 1 | 0 | 0 | 6 | 0 |
| Round 2 | 0 | 0 | 6 | 0 |
| Round 3 | 0 | 0 | 6 | 0 |

## Test Cases

| Test Case ID | Test Case Description | Test Case Procedure | Expected Results | Pre-conditions | Round 1 | Test date | Tester | Round 2 | Test date | Tester | Round 3 | Test date | Tester | Note |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| TC901 | Verify SOS case successfully (Pending -> Verified) | 1) Login with Operator account<br>2) Open Operator Dashboard<br>3) In tab "Cấp cứu", select a case with status "Chờ xử lý"<br>4) Open case detail modal<br>5) Click "Xác minh" | Case is verified; status badge changes to "Chờ điều phối"; success toast "Đã xác nhận case." is shown | Operator account exists; at least one active SOS case in Pending state | Pending |  |  | Pending |  |  | Pending |  |  |  |
| TC902 | Mark SOS case as false alarm | 1) Open a case in Pending state<br>2) Click "Báo động giả"<br>3) Confirm dashboard refresh | Case is marked as false alarm; success toast "Đã đánh dấu báo động giả." is shown; case is removed from active SOS list or no longer appears in processing queue | Case is in Pending state and operator is allowed to mark false alarm | Pending |  |  | Pending |  |  | Pending |  |  |  |
| TC903 | Dispatch rescuer for Verified SOS case | 1) Open a case already verified<br>2) Click "Điều phối đội cứu hộ"<br>3) Select one available rescuer in dispatch modal<br>4) Click "Xác nhận điều phối" | Dispatch completes; success toast "Đã điều phối đội cứu hộ." is shown; case status changes to "Đã điều phối" and assigned rescuer info is visible in detail | Case is Verified; at least one rescuer is online and available | Pending |  |  | Pending |  |  | Pending |  |  |  |
| TC904 | Prevent dispatch before verification | 1) Open a case in Pending state<br>2) Observe action buttons in detail modal<br>3) Try to find dispatch action | Dispatch button is not shown for Pending case; operator must verify case first | Case is in Pending state | Pending |  |  | Pending |  |  | Pending |  |  |  |
| TC905 | Track assigned SOS mission info | 1) Open case in Assigned state<br>2) Observe assigned rescuer block and active mission block<br>3) Check mission timestamps and rescuer info | Detail modal shows assigned rescuer information, active mission information, and completion/ETA data where available | Case is Assigned and has active mission data from backend | Pending |  |  | Pending |  |  | Pending |  |  |  |
| TC906 | Verify completed SOS case stays read-only for dispatch | 1) Open a case in Completed state<br>2) Observe action area<br>3) Confirm dispatch is no longer available | Completed case shows final state, no dispatch action is available, and history/mission summary remains readable | Case is Completed or FalseAlarm | Pending |  |  | Pending |  |  | Pending |  |  |  |
