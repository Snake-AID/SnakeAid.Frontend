#---
doc_role: baseline
module: wallet-withdrawal
kind: flow
doc_type: usageguide
status: active
last_updated: 2026-04-04
api_version: v1
owners: [backend-team]
verification_status: code-verified
---

# Wallet Withdrawal API

## 1. Table Of Contents

- [1. Table Of Contents](#1-table-of-contents)
- [2. Overview](#2-overview)
- [3. Authentication & Authorization](#3-authentication--authorization)
- [4. Expert/Member Business + Expert/Member APIs](#4-expertmember-business--expertmember-apis)
- [5. Admin Business + Admin APIs](#5-admin-business--admin-apis)
- [6. Shared Data Models](#6-shared-data-models)
- [7. Verified Endpoint List](#7-verified-endpoint-list)
- [8. Changelog](#8-changelog)

## 2. Overview

Flow withdrawal hiện tại trong code hỗ trợ:
- User tạo yêu cầu rút tiền từ ví
- User xem danh sách và chi tiết withdrawal của chính mình
- User hủy withdrawal khi còn `Pending`
- Admin xem toàn bộ withdrawal hoặc chỉ `Pending`
- Admin `approve`, `reject`, `complete`, `fail`
- QR VietQR được sinh khi admin `approve`
- Số dư ví bị trừ khi admin `approve`
- `complete` là bước xác nhận đã chuyển khoản xong ngoài hệ thống

Client-visible behavior cần nắm ngay:
- User APIs luôn trả `bankAccount` đã được mask
- Admin APIs trả `bankAccount` đầy đủ, không mask
- `vietQrPayload` và `vietQrImageBase64` chỉ có sau khi `Approved`
- `vietQrImageBase64` có thể là `null` dù `vietQrPayload` đã có
- User cancel dùng `POST /api/withdrawals/{id}/cancel`, không phải `DELETE`
- Withdrawal mới tạo chưa trừ tiền; tiền bị trừ khi admin `approve`
- Bank directory hiện load từ `VietQRHelper` và được cache ở backend
- Public error codes cho withdrawal flow đã ổn định để FE/mobile branch UI theo mã lỗi
- `GET /api/withdrawals/{id}` trả `404 WITHDRAWAL_NOT_FOUND` cho cả trường hợp không tồn tại và trường hợp withdrawal không thuộc user hiện tại
- Notification transport failure sau khi DB commit không làm request thành công bị đổi thành lỗi API

## 3. Authentication & Authorization

### Expert/Member Operations
- JWT Bearer token bắt buộc
- `Expert` và `Member` dùng cùng nhóm user-facing APIs cho flow này

### Admin Operations
- JWT Bearer token bắt buộc
- Bắt buộc role `Admin`

## 4. Expert/Member Business + Expert/Member APIs

### 4.1 Business Scope

- Xem ví hiện tại để đọc số dư
- Lấy danh sách ngân hàng hỗ trợ
- Tạo yêu cầu rút tiền
- Xem danh sách withdrawal của chính mình
- Xem chi tiết từng withdrawal của chính mình
- Hủy withdrawal khi còn `Pending`

### 4.2 Actual Status Lifecycle

Các trạng thái có trong code:
- `Pending`
- `Approved`
- `Rejected`
- `Completed`
- `Failed`

Các transition đã được code support:
- `Pending -> Approved`
- `Pending -> Rejected`
- `Pending -> Cancel` được lưu thành `Rejected` với reason `Cancelled by user`
- `Approved -> Rejected`
- `Approved -> Completed`
- `Approved -> Failed`

Lưu ý:
- `ProcessedAt` được set khi cancel / approve / reject / complete / fail

### 4.3 Business Rules

#### Create Withdrawal
- Validate request model:
  - `amount`: `50000` đến `5000000`
  - `bankAccount`: `8-20` chữ số
  - `bankName`: bắt buộc, tối đa `100` ký tự
  - `accountHolderName`: bắt buộc, tối đa `150` ký tự
  - `bankBin`: bắt buộc, đúng `6` chữ số
- Service kiểm tra:
  - số dư ví khả dụng đủ để tạo request
  - tổng withdrawal hợp lệ trong ngày không vượt `10000000`
- Khi tạo request:
  - withdrawal được tạo với trạng thái `Pending`
  - chưa trừ tiền khỏi ví
  - chưa sinh QR

#### Cancel
- User chỉ cancel được withdrawal của chính mình
- Chỉ cancel được withdrawal đang `Pending`
- Cancel được lưu thành:
  - `Status = Rejected`
  - `RejectionReason = "Cancelled by user"`

### 4.4 Wrapper Response Convention

Nhóm endpoint wallet/withdrawal dùng `ApiResponse<T>`:

```json
{
  "status_code": 200,
  "message": "Operation successful",
  "is_success": true,
  "data": {},
  "error": null
}
```

### 4.5 Expert/Member APIs

#### 4.5.1 `GET /api/wallet/me`

Mục đích:
- Lấy ví hiện tại của user để đọc số dư trước khi tạo withdrawal

Auth:
- JWT Bearer token bắt buộc

Success response:
- `ApiResponse<WalletResponse>`

Example response:
```json
{
  "status_code": 200,
  "message": "Wallet retrieved successfully",
  "is_success": true,
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440010",
    "userId": "550e8400-e29b-41d4-a716-446655440001",
    "balance": 2500000,
    "createdAt": "2026-03-25T08:00:00Z",
    "updatedAt": "2026-04-03T12:45:00Z"
  },
  "error": null
}
```

Field notes:
- `balance` là số dư hiện tại của ví tại thời điểm gọi API
- UI nên dùng endpoint này để hiển thị available balance trước khi user nhập amount
- Validation submit vẫn phải dựa vào response lỗi từ `POST /api/withdrawals/create`, không giả định client-side check là đủ

#### 4.5.2 `GET /api/wallet/banks`

Mục đích:
- Lấy danh sách ngân hàng hỗ trợ hiển thị cho user

Auth:
- JWT Bearer token bắt buộc

Ghi chú:
- Dữ liệu hiện tại load từ `VietQRHelper.BankApp.BanksObject`
- Backend cache bank directory để tránh parse lại ở mỗi request

Success response:
- `ApiResponse<List<BankDirectoryResponse>>`

Example response:
```json
{
  "status_code": 200,
  "message": "Bank directory retrieved successfully",
  "is_success": true,
  "data": [
    {
      "key": "vietcombank",
      "code": "VCB",
      "shortName": "Vietcombank",
      "bin": "970400",
      "name": "Ngân hàng TMCP Ngoại thương Việt Nam",
      "vietQrStatus": "TransferSupported",
      "lookupSupported": true,
      "swiftCode": "BFTVVNVX"
    },
    {
      "key": "mbbank",
      "code": "MB",
      "shortName": "MB Bank",
      "bin": "970422",
      "name": "Ngân hàng TMCP Quân đội (MB Bank)",
      "vietQrStatus": "TransferSupported",
      "lookupSupported": true,
      "swiftCode": null
    }
  ],
  "error": null
}
```

Field notes:
- `key`, `code`, `shortName`, `lookupSupported`, `swiftCode` là metadata bổ sung; client có thể dùng cho search, display, hoặc fallback mapping
- `bin` là giá trị client cần map vào `bankBin` khi gọi `POST /api/withdrawals/create`
- `name` là giá trị có thể bind vào `bankName`
- `vietQrStatus` hiện có các giá trị:
  - `TransferSupported`
  - `ReceiveOnly`
  - `NotSupported`
- Với flow hiện tại, client nên ưu tiên cho user chọn bank có `vietQrStatus = TransferSupported`

#### 4.5.3 `POST /api/withdrawals/create`

Mục đích:
- Tạo yêu cầu rút tiền

Request body:
```json
{
  "amount": 50000,
  "bankAccount": "1234567890",
  "bankName": "Ngân hàng TMCP Sài Gòn Thương Tín (Sacombank)",
  "accountHolderName": "NGUYEN VAN A",
  "bankBin": "970400"
}
```

Request constraints:
- `amount`: `50000` đến `5000000`
- `bankAccount`: `8-20` chữ số
- `bankName`: tối đa `100` ký tự
- `accountHolderName`: tối đa `150` ký tự
- `bankBin`: đúng `6` chữ số

Success response:
```json
{
  "status_code": 200,
  "message": "Operation successful",
  "is_success": true,
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "userId": "550e8400-e29b-41d4-a716-446655440001",
    "amount": 50000,
    "bankAccount": "******7890",
    "bankName": "Ngân hàng TMCP Sài Gòn Thương Tín (Sacombank)",
    "accountHolderName": "NGUYEN VAN A",
    "bankBin": "970400",
    "status": "Pending",
    "processedAt": null,
    "rejectionReason": null,
    "vietQrPayload": null,
    "vietQrImageBase64": null,
    "createdAt": "2026-04-03T12:30:00Z"
  },
  "error": null
}
```

Lưu ý:
- User response có mask `bankAccount`
- QR fields sẽ là `null` khi mới tạo

#### 4.5.4 `GET /api/withdrawals/me`

Mục đích:
- Lấy toàn bộ withdrawal của user hiện tại

Success response:
- `ApiResponse<IEnumerable<WithdrawalResponse>>`

Example response:
```json
{
  "status_code": 200,
  "message": "Operation successful",
  "is_success": true,
  "data": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "userId": "550e8400-e29b-41d4-a716-446655440001",
      "amount": 50000,
      "bankAccount": "******7890",
      "bankName": "Ngân hàng TMCP Sài Gòn Thương Tín (Sacombank)",
      "accountHolderName": "NGUYEN VAN A",
      "bankBin": "970400",
      "status": "Pending",
      "processedAt": null,
      "rejectionReason": null,
      "vietQrPayload": null,
      "vietQrImageBase64": null,
      "createdAt": "2026-04-03T12:30:00Z"
    }
  ],
  "error": null
}
```

UI notes:
- Endpoint trả theo thứ tự mới nhất trước
- Dùng endpoint này cho màn list/history; gọi detail khi cần QR hoặc trạng thái mới nhất của một item cụ thể

#### 4.5.5 `GET /api/withdrawals/{id}`

Mục đích:
- Lấy chi tiết một withdrawal cụ thể của chính user

Authorization:
- Chỉ owner mới xem được

Failure behavior:
- Nếu withdrawal không tồn tại, trả `404 WITHDRAWAL_NOT_FOUND`
- Nếu withdrawal tồn tại nhưng không thuộc user hiện tại, backend cũng trả `404 WITHDRAWAL_NOT_FOUND`
- Client không nên dựa vào endpoint này để phân biệt `not found` với `not yours`

Success response sau khi approve:
```json
{
  "status_code": 200,
  "message": "Operation successful",
  "is_success": true,
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "userId": "550e8400-e29b-41d4-a716-446655440001",
    "amount": 50000,
    "bankAccount": "******7890",
    "bankName": "Ngân hàng TMCP Sài Gòn Thương Tín (Sacombank)",
    "accountHolderName": "NGUYEN VAN A",
    "bankBin": "970400",
    "status": "Approved",
    "processedAt": "2026-04-03T12:45:00Z",
    "rejectionReason": null,
    "vietQrPayload": "00020101021138550010A0000007270125000697045601139704005802VN1234567890540650000.005802VN6304XXXX",
    "vietQrImageBase64": "iVBORw0KGgoAAAANSUhEUgAA...",
    "createdAt": "2026-04-03T12:30:00Z"
  },
  "error": null
}
```

#### 4.5.6 `POST /api/withdrawals/{id}/cancel`

Mục đích:
- User hủy withdrawal của chính mình

Success response:
- `ApiResponse<WithdrawalResponse>`
- `status = "Rejected"`
- `rejectionReason = "Cancelled by user"`

Example response:
```json
{
  "status_code": 200,
  "message": "Operation successful",
  "is_success": true,
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "userId": "550e8400-e29b-41d4-a716-446655440001",
    "amount": 50000,
    "bankAccount": "******7890",
    "bankName": "Ngân hàng TMCP Sài Gòn Thương Tín (Sacombank)",
    "accountHolderName": "NGUYEN VAN A",
    "bankBin": "970400",
    "status": "Rejected",
    "processedAt": "2026-04-03T12:35:00Z",
    "rejectionReason": "Cancelled by user",
    "vietQrPayload": null,
    "vietQrImageBase64": null,
    "createdAt": "2026-04-03T12:30:00Z"
  },
  "error": null
}
```

## 5. Admin Business + Admin APIs

### 5.1 Business Scope

- Xem toàn bộ withdrawal
- Lấy riêng các withdrawal đang `Pending`
- Approve request để sinh QR và trừ tiền khỏi ví
- Reject request
- Complete request để xác nhận transfer đã hoàn tất
- Fail request khi xử lý không thành công

### 5.2 Business Rules

#### Approve
- Chỉ approve được withdrawal đang `Pending`
- Khi approve:
  - trừ tiền khỏi `Wallet.Balance`
  - tạo `Transaction` với `TransactionType = WalletWithdraw`
  - sinh `VietQrPayload`
  - cố gắng sinh `VietQrImageBase64`
  - set status `Approved`
  - lưu `ProcessedByAdminId`
  - có thể lưu `AdminNotes`

#### Complete
- Chỉ complete được withdrawal đang `Approved`
- Khi complete:
  - set status `Completed`
  - không trừ tiền lần nữa
  - có thể cập nhật `AdminNotes`

#### Reject / Fail
- `Reject`: admin reject được trạng thái `Pending` hoặc `Approved`
- `Fail`: admin fail được trạng thái `Approved`
- Nếu reject/fail từ trạng thái `Approved`:
  - hệ thống hoàn tiền lại vào ví
  - tạo `Transaction` hoàn tiền bằng `AdminAdjustment`
  - xóa QR fields

### 5.3 Admin APIs

#### 5.3.1 `GET /api/admin/withdrawals`
- Trả `ApiResponse<IEnumerable<AdminWithdrawalResponse>>`
- Admin response hiện không mask `bankAccount`
- Sắp xếp mới nhất trước

#### 5.3.2 `GET /api/admin/withdrawals/pending`
- Trả `ApiResponse<IEnumerable<AdminWithdrawalResponse>>`
- Sắp xếp cũ nhất trước để admin xử lý queue pending

#### 5.3.3 `GET /api/admin/withdrawals/{id}`
- Trả `ApiResponse<AdminWithdrawalResponse>`

Example response:
```json
{
  "status_code": 200,
  "message": "Operation successful",
  "is_success": true,
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "userId": "550e8400-e29b-41d4-a716-446655440001",
    "amount": 50000,
    "bankAccount": "1234567890",
    "bankName": "Ngân hàng TMCP Sài Gòn Thương Tín (Sacombank)",
    "accountHolderName": "NGUYEN VAN A",
    "bankBin": "970400",
    "status": "Approved",
    "processedAt": "2026-04-03T12:45:00Z",
    "rejectionReason": null,
    "vietQrPayload": "00020101021138550010A0000007270125000697045601139704005802VN1234567890540650000.005802VN6304XXXX",
    "vietQrImageBase64": "iVBORw0KGgoAAAANSUhEUgAA...",
    "createdAt": "2026-04-03T12:30:00Z",
    "processedByAdminId": "550e8400-e29b-41d4-a716-446655440999",
    "adminNotes": "Verified bank details"
  },
  "error": null
}
```

#### 5.3.4 `POST /api/admin/withdrawals/{id}/approve`

Request body:
```json
{
  "adminNotes": "Verified bank details"
}
```

Field notes:
- body được phép bỏ trống
- nếu truyền `adminNotes`, max `1000` ký tự

Success response:
- Trả `ApiResponse<AdminWithdrawalResponse>`
- Có thêm `processedByAdminId` và `adminNotes`

Example response:
```json
{
  "status_code": 200,
  "message": "Operation successful",
  "is_success": true,
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "userId": "550e8400-e29b-41d4-a716-446655440001",
    "amount": 50000,
    "bankAccount": "1234567890",
    "bankName": "Ngân hàng TMCP Sài Gòn Thương Tín (Sacombank)",
    "accountHolderName": "NGUYEN VAN A",
    "bankBin": "970400",
    "status": "Approved",
    "processedAt": "2026-04-03T12:45:00Z",
    "rejectionReason": null,
    "vietQrPayload": "00020101021138550010A0000007270125000697045601139704005802VN1234567890540650000.005802VN6304XXXX",
    "vietQrImageBase64": "iVBORw0KGgoAAAANSUhEUgAA...",
    "createdAt": "2026-04-03T12:30:00Z",
    "processedByAdminId": "550e8400-e29b-41d4-a716-446655440999",
    "adminNotes": "Verified bank details"
  },
  "error": null
}
```

#### 5.3.5 `POST /api/admin/withdrawals/{id}/reject`

Request body:
```json
{
  "reason": "Invalid bank account",
  "adminNotes": "Name mismatch during review"
}
```

Field notes:
- `reason` là bắt buộc, max `500` ký tự
- nếu truyền `adminNotes`, max `1000` ký tự

Success response:
- Trả `ApiResponse<AdminWithdrawalResponse>`
- `status = "Rejected"`
- nếu reject từ `Approved`, response sẽ có QR fields = `null`

#### 5.3.6 `POST /api/admin/withdrawals/{id}/complete`

Request body:
```json
{
  "adminNotes": "Transfer confirmed in banking app"
}
```

Field notes:
- body được phép bỏ trống
- nếu truyền `adminNotes`, max `1000` ký tự

Success response:
- Trả `ApiResponse<AdminWithdrawalResponse>`
- `status = "Completed"`

#### 5.3.7 `POST /api/admin/withdrawals/{id}/fail`

Request body:
```json
{
  "reason": "Bank transfer failed",
  "adminNotes": "Destination bank unavailable"
}
```

Field notes:
- `reason` là bắt buộc, max `500` ký tự
- nếu truyền `adminNotes`, max `1000` ký tự

Success response:
- Trả `ApiResponse<AdminWithdrawalResponse>`
- `status = "Failed"`
- response sẽ có QR fields = `null`

## 6. Shared Data Models

### CreateWithdrawalRequest
| Field | Type | Required | Constraints |
|-------|------|----------|-------------|
| amount | decimal | Yes | 50000-5000000 |
| bankAccount | string | Yes | 8-20 digits |
| bankName | string | Yes | max 100 chars |
| accountHolderName | string | Yes | max 150 chars |
| bankBin | string | Yes | 6 digits |

### WithdrawalResponse
| Field | Type | Description |
|-------|------|-------------|
| id | Guid | Withdrawal ID |
| userId | Guid | Owner user ID |
| amount | decimal | Withdrawal amount |
| bankAccount | string | User endpoints mask số tài khoản |
| bankName | string | Bank name |
| accountHolderName | string | Account holder name |
| bankBin | string? | Bank BIN được lưu cùng withdrawal |
| status | enum | `Pending/Approved/Rejected/Completed/Failed` |
| processedAt | datetime? | Thời điểm xử lý |
| rejectionReason | string? | Lý do reject/fail/cancel |
| vietQrPayload | string? | QR payload sau khi approve |
| vietQrImageBase64 | string? | Base64 QR image sau khi approve, có thể `null` nếu fallback payload-only |
| createdAt | datetime | Thời điểm tạo |

State-oriented notes:
- `Pending`: chưa có QR, `processedAt = null`
- `Approved`: có thể có QR payload, image có thể `null`
- `Rejected`: `rejectionReason` có thể là admin reason hoặc `Cancelled by user`
- `Completed`: giữ trạng thái hoàn tất xử lý ngoài hệ thống
- `Failed`: có `rejectionReason`, QR fields bị clear

### AdminWithdrawalResponse
| Field | Type | Description |
|-------|------|-------------|
| ...WithdrawalResponse | object | Toàn bộ field của `WithdrawalResponse` |
| processedByAdminId | Guid? | Admin xử lý gần nhất |
| adminNotes | string? | Ghi chú nội bộ admin |

Admin-only notes:
- `bankAccount` không bị mask
- `processedByAdminId` và `adminNotes` có thể `null` nếu request chưa qua bước xử lý admin

### ApiResponse<T>
| Field | Type | Description |
|-------|------|-------------|
| status_code | int | HTTP-like status code in body |
| message | string | Human-readable message |
| is_success | bool | Success flag |
| data | T | Payload |
| error | object? | Error detail khi thất bại |

### BankDirectoryResponse
| Field | Type | Description |
|-------|------|-------------|
| key | string? | Stable key từ `VietQRHelper` |
| code | string? | Mã ngân hàng ngắn |
| shortName | string? | Tên ngắn phù hợp cho dropdown/search |
| bin | string | Giá trị map sang `bankBin` khi create withdrawal |
| name | string | Tên ngân hàng đầy đủ |
| vietQrStatus | enum | `TransferSupported/ReceiveOnly/NotSupported` |
| lookupSupported | bool | Gợi ý backend/source có hỗ trợ tra cứu |
| swiftCode | string? | Swift code nếu source có trả về |

### Common Public Error Codes
| Code | Khi nào dùng |
|------|--------------|
| `WITHDRAWAL_NOT_FOUND` | Không tìm thấy withdrawal |
| `WITHDRAWAL_FORBIDDEN` | User không được xem/chỉnh withdrawal đó |
| `WITHDRAWAL_INVALID_STATUS` | Action không hợp lệ với trạng thái hiện tại |
| `WITHDRAWAL_INSUFFICIENT_BALANCE` | Không đủ số dư để create/approve |
| `WITHDRAWAL_DAILY_LIMIT_EXCEEDED` | Vượt limit rút trong ngày |
| `WITHDRAWAL_BANK_BIN_MISSING` | Thiếu `bankBin`, backend không thể generate QR |

Notes:
- Đây là nhóm `withdrawal-specific business error codes` đã được ổn định cho FE/mobile branch UI.
- Ngoài các mã trên, hệ thống vẫn có thể trả các generic error code ở envelope hiện tại cho các lỗi không đặc thù riêng của withdrawal flow.
- Mobile nên ưu tiên branch business flow theo các mã `WITHDRAWAL_*`; không nên parse `message`.

## 7. Verified Endpoint List

### Expert/Member
- `GET /api/wallet/me`
- `GET /api/wallet/banks`
- `POST /api/withdrawals/create`
- `GET /api/withdrawals/me`
- `GET /api/withdrawals/{id}`
- `POST /api/withdrawals/{id}/cancel`

### Admin
- `GET /api/admin/withdrawals`
- `GET /api/admin/withdrawals/pending`
- `GET /api/admin/withdrawals/{id}`
- `POST /api/admin/withdrawals/{id}/approve`
- `POST /api/admin/withdrawals/{id}/reject`
- `POST /api/admin/withdrawals/{id}/complete`
- `POST /api/admin/withdrawals/{id}/fail`

## 8. Changelog

### 2026-04-03
- Finalized Phase 2 withdrawal contract
- Added required `accountHolderName` to create/request-response flow
- Changed amount limits to `50000` to `5000000`
- Added daily withdrawal limit `10000000`
- Moved wallet balance deduction from `complete` to `approve`
- Added `processedByAdminId` and `adminNotes` for admin responses
- `complete` now confirms transfer instead of deducting balance
- Standardized all withdrawal endpoints to `ApiResponse<T>`
- Added `bankBin` to withdrawal response contract
- Added `GET /api/admin/withdrawals/{id}`
- Kept cancel contract as `POST /api/withdrawals/{id}/cancel`
- Replaced mock bank directory note with actual `VietQRHelper` integration contract
- Added richer `BankDirectoryResponse` fields for client mapping/search
- Added stable public withdrawal error codes for FE/mobile error handling

### 2026-04-04
- Documented that user detail endpoint returns `404 WITHDRAWAL_NOT_FOUND` for both not-found and non-owner cases
- Documented that notification publish failures after DB commit do not change a successful withdrawal API response into an error
