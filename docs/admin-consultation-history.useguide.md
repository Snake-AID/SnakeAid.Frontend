---
doc_role: planning
module: admin-consultation-history
kind: flow
doc_type: usageguide
status: active
last_updated: 2026-04-14
last_updated: 2026-04-15
api_version: v1
owners: [backend-team]
verification_status: code-verified
---
# Admin Consultation History API

## 1. Table Of Contents

- [1. Table Of Contents](#1-table-of-contents)
- [2. Overview](#2-overview)
- [3. Authentication &amp; Authorization](#3-authentication--authorization)
- [4. Expert/Member Business + Expert/Member APIs](#4-expertmember-business--expertmember-apis)
- [5. Admin Business + Admin APIs](#5-admin-business--admin-apis)
- [6. Shared Data Models](#6-shared-data-models)
- [7. Verified Endpoint List](#7-verified-endpoint-list)
- [8. Changelog](#8-changelog)

## 2. Overview

This document defines the API contract for the admin use case to view all consultations across the system.

Current status:

- the admin consultation history endpoint `is implemented`
- the admin consultation detail endpoint `is implemented`
- the contract below is `code-verified` against the backend implementation

Client-visible goals:

- admin can list both scheduled and emergency consultations through a single endpoint
- admin can filter by `status` and `type`
- admin can see both `user` and `expert` information
- response includes pagination metadata for admin list screens

Important business notes:

- scheduled and emergency consultations currently come from different data sources
- admin history is `booking/ping-first` and then falls back to `Consultation` for edge cases
- `price` for scheduled and emergency consultations is derived differently
- default sort order is newest `StartTime` first

## 3. Authentication & Authorization

### Admin Operations

- JWT Bearer token is required
- `Admin` role is required

## 5. Admin Business + Admin APIs

### 5.1 Business Scope

- View all consultations across the system
- Filter by consultation type
- Filter by consultation status
- Use one list screen for both scheduled and emergency consultations

### 5.2 Admin Endpoint

#### 5.2.1 `GET /api/admin/consultations`

Purpose:

- Admin retrieves a paged list of consultations across the whole system

Status:

- `Active`
- Code-verified

Auth:

- JWT Bearer token is required
- `Admin` role is required

Query params:

| Field      | Type   | Required | Notes                                                                                                                               |
| ---------- | ------ | -------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| pageNumber | int    | No       | Default `1`, range `>= 1`                                                                                                       |
| pageSize   | int    | No       | Default `10`, range `1..100`                                                                                                    |
| status     | string | No       | Supported domain statuses:`Scheduled`, `Ongoing`, `Completed`, `Cancelled`, `UserAbsent`, `ExpertAbsent`, `AllAbsent` |
| type       | string | No       | `Scheduled` or `Emergency`                                                                                                      |

Example request:

```http
GET /api/admin/consultations?pageNumber=1&pageSize=10&type=Emergency&status=Completed
Authorization: Bearer <admin-jwt>
```

Success response:

- `ApiResponse<PagingResponse<AdminConsultationResponse>>`

Example response:

```json
{
  "status_code": 200,
  "message": "Operation successful",
  "is_success": true,
  "data": {
    "items": [
      {
        "consultationId": "9fbba6ab-71ee-4a0d-b0b9-9a98d9835d12",
        "type": "Emergency",
        "status": "Completed",
        "userId": "f5c3290c-98d5-4760-bc43-f652f0c1d65b",
        "userName": "Nguyen Van A",
        "expertId": "67b6dbd9-5e6e-48f3-a270-0a0f12ea9d36",
        "expertName": "Tran Thi B",
        "roomId": "consultation-9fbba6ab-71ee-4a0d-b0b9-9a98d9835d12",
        "startTime": "2026-04-10T09:00:00Z",
        "endTime": "2026-04-10T09:25:00Z",
        "price": 200000,
        "problemDescription": null,
        "bookingId": null,
        "bookingStatus": null,
        "bookedAt": null,
        "paymentDeadline": null,
        "cancelledAt": null,
        "cancellationReason": null,
        "emergencyRequestId": "f61d7f73-17db-4fc8-a43e-0dd0d0f8a20d",
        "emergencyRequestStatus": "AcceptedByExpert",
        "requestedAt": "2026-04-10T08:55:00Z",
        "respondedAt": "2026-04-10T08:56:00Z",
        "expiresAt": "2026-04-10T09:05:00Z",
        "slotStartTime": null,
        "slotEndTime": null
      },
      {
        "consultationId": "8ce96758-71b5-4310-bc35-d83525b2c54f",
        "type": "Scheduled",
        "status": "Completed",
        "userId": "9f5d88cd-09a4-4fe6-b6d3-84fe67fe7dbf",
        "userName": "Le Van C",
        "expertId": "ba833fc7-6856-48b2-b032-9c5d985729d1",
        "expertName": "Pham Thi D",
        "roomId": "consultation-8ce96758-71b5-4310-bc35-d83525b2c54f",
        "startTime": "2026-04-09T14:00:00Z",
        "endTime": "2026-04-09T14:30:00Z",
        "price": 150000,
        "problemDescription": "Snakebite on finger",
        "bookingId": "ef54ec06-bb65-47d1-a7c5-db86aad6a49b",
        "bookingStatus": "Completed",
        "bookedAt": "2026-04-08T14:00:00Z",
        "paymentDeadline": "2026-04-09T13:45:00Z",
        "cancelledAt": null,
        "cancellationReason": null,
        "emergencyRequestId": null,
        "emergencyRequestStatus": null,
        "requestedAt": null,
        "respondedAt": null,
        "expiresAt": null,
        "slotStartTime": "2026-04-09T14:00:00Z",
        "slotEndTime": "2026-04-09T14:30:00Z"
      }
    ],
    "meta": {
      "total_pages": 4,
      "total_items": 34,
      "current_page": 1,
      "page_size": 10
    }
  },
  "error": null
}
```

Field notes:

- `type` is the primary discriminator for admin app rendering
- `problemDescription` is expected to be populated only for scheduled consultations
- `bookingId` is expected only for scheduled consultations
- `bookingStatus`, `bookedAt`, `paymentDeadline`, `cancelledAt`, `cancellationReason` are expected only for scheduled consultations
- `emergencyRequestId` is expected only for emergency consultations
- `emergencyRequestStatus`, `requestedAt`, `respondedAt`, `expiresAt` are expected only for emergency consultations
- `slotStartTime` and `slotEndTime` are expected only for scheduled consultations
- if linked booking/ping data is missing, the consultation may still be returned from `Consultation` fallback with related fields set to `null`
- scheduled `price` comes from `ConsultationBooking.Price`
- emergency `price` is resolved from `Transaction`:
  - prefer `TransactionType = ConsultationPayment` with `ReferenceId = ConsultationPingRequest.Id`
  - fallback to `TransactionType = ExpertPayout` with `ReferenceId = Consultation.Id`
  - may still be `null` if source data is insufficient

#### 5.2.2 `GET /api/admin/consultations/{consultationId}`

Purpose:

- Admin retrieves one consultation detail by `consultationId`

Status:

- `Active`
- Code-verified

Auth:

- JWT Bearer token is required
- `Admin` role is required

Route params:

| Field          | Type | Required | Notes                        |
| -------------- | ---- | -------- | ---------------------------- |
| consultationId | guid | Yes      | Existing `Consultation.Id` |

Example request:

```http
GET /api/admin/consultations/8ce96758-71b5-4310-bc35-d83525b2c54f
Authorization: Bearer <admin-jwt>
```

Success response:

- `ApiResponse<AdminConsultationResponse>`

Example response:

```json
{
  "status_code": 200,
  "message": "Operation successful",
  "is_success": true,
  "data": {
    "consultationId": "8ce96758-71b5-4310-bc35-d83525b2c54f",
    "type": "Scheduled",
    "status": "Completed",
    "userId": "9f5d88cd-09a4-4fe6-b6d3-84fe67fe7dbf",
    "userName": "Le Van C",
    "expertId": "ba833fc7-6856-48b2-b032-9c5d985729d1",
    "expertName": "Pham Thi D",
    "roomId": "consultation-8ce96758-71b5-4310-bc35-d83525b2c54f",
    "startTime": "2026-04-09T14:00:00Z",
    "endTime": "2026-04-09T14:30:00Z",
    "price": 150000,
    "problemDescription": "Snakebite on finger",
    "bookingId": "ef54ec06-bb65-47d1-a7c5-db86aad6a49b",
    "bookingStatus": "Completed",
    "bookedAt": "2026-04-08T14:00:00Z",
    "paymentDeadline": "2026-04-09T13:45:00Z",
    "cancelledAt": null,
    "cancellationReason": null,
    "emergencyRequestId": null,
    "emergencyRequestStatus": null,
    "requestedAt": null,
    "respondedAt": null,
    "expiresAt": null,
    "slotStartTime": "2026-04-09T14:00:00Z",
    "slotEndTime": "2026-04-09T14:30:00Z"
  },
  "error": null
}
```

Field notes:

- detail starts from `Consultation` and then enriches from `ConsultationBooking` or `ConsultationPingRequest`
- scheduled detail exposes `bookingStatus`, `bookedAt`, `paymentDeadline`, `cancelledAt`, `cancellationReason`
- emergency detail exposes `emergencyRequestStatus`, `requestedAt`, `respondedAt`, `expiresAt`
- orphan scheduled consultations still return successfully with booking-related fields as `null`
- orphan emergency consultations still return successfully with emergency-request-related fields as `null`
- `price` follows the same derivation rules as the admin list endpoint

### 5.3 Expected Failure Behavior

#### Validation

- `pageNumber < 1` -> validation error
- `pageSize < 1` or `pageSize > 100` -> validation error
- `type` outside `Scheduled|Emergency` -> validation error
- `status` that cannot be parsed to `ConsultationStatus` -> validation error

#### Authorization

- User without role `Admin` -> `403`
- Missing token / invalid token -> `401`

### 5.4 UI Notes For Admin App

- The list screen should branch layout by `type`
- Do not assume `problemDescription` is always present
- Do not assume `bookingId` or `emergencyRequestId` is always present for every item of that type
- Do not assume `price` is always present for emergency items
- Use `meta.total_items`, `meta.total_pages`, `meta.current_page`, `meta.page_size` for pagination

## 6. Shared Data Models

### AdminConsultationsQueryRequest

| Field      | Type   | Required | Constraints                          |
| ---------- | ------ | -------- | ------------------------------------ |
| pageNumber | int    | No       | `>= 1`, default `1`              |
| pageSize   | int    | No       | `1..100`, default `10`           |
| status     | string | No       | must parse to `ConsultationStatus` |
| type       | string | No       | `Scheduled` or `Emergency`       |

### AdminConsultationResponse

| Field                  | Type      | Description                                                 |
| ---------------------- | --------- | ----------------------------------------------------------- |
| consultationId         | Guid      | Consultation ID                                             |
| type                   | string    | `Scheduled` or `Emergency`                              |
| status                 | string    | Consultation status                                         |
| userId                 | Guid      | User / rescuer ID                                           |
| userName               | string?   | User full name                                              |
| expertId               | Guid      | Expert ID                                                   |
| expertName             | string?   | Expert full name                                            |
| roomId                 | string?   | Room code / room name                                       |
| startTime              | datetime? | Consultation start time                                     |
| endTime                | datetime? | Consultation end time                                       |
| price                  | decimal?  | Consultation price when derivable                           |
| problemDescription     | string?   | Scheduled consultation problem description                  |
| bookingId              | Guid?     | Present for scheduled consultation                          |
| bookingStatus          | string?   | Present for scheduled consultation when booking exists      |
| bookedAt               | datetime? | Present for scheduled consultation when booking exists      |
| paymentDeadline        | datetime? | Present for scheduled consultation when booking exists      |
| cancelledAt            | datetime? | Present when scheduled booking was cancelled                |
| cancellationReason     | string?   | Present when scheduled booking was cancelled                |
| emergencyRequestId     | Guid?     | Present for emergency consultation                          |
| emergencyRequestStatus | string?   | Present for emergency consultation when ping request exists |
| requestedAt            | datetime? | Present for emergency consultation when ping request exists |
| respondedAt            | datetime? | Present for emergency consultation when ping request exists |
| expiresAt              | datetime? | Present for emergency consultation when ping request exists |
| slotStartTime          | datetime? | Present for scheduled consultation                          |
| slotEndTime            | datetime? | Present for scheduled consultation                          |

### ApiResponse`<T>`

| Field       | Type    | Description                     |
| ----------- | ------- | ------------------------------- |
| status_code | int     | HTTP-like status code in body   |
| message     | string  | Human-readable message          |
| is_success  | bool    | Success flag                    |
| data        | T       | Payload                         |
| error       | object? | Error detail when request fails |

### PagingResponse`<T>`

| Field | Type   | Description         |
| ----- | ------ | ------------------- |
| items | array  | Current page items  |
| meta  | object | Pagination metadata |

### PaginationMeta

| Field        | Type | Description         |
| ------------ | ---- | ------------------- |
| total_pages  | int  | Total pages         |
| total_items  | long | Total items         |
| current_page | int  | Current page        |
| page_size    | int  | Requested page size |

## 7. Verified Endpoint List

Code-verified related endpoints that already exist:

- `GET /api/users/me/consultations`
- `GET /api/experts/me/consultations`
- `GET /api/admin/consultations`
- `GET /api/admin/consultations/{consultationId}`

## 8. Changelog

### 2026-04-13

- Initialized `useguide` for admin consultation history
- Implemented and verified `GET /api/admin/consultations`
- Confirmed active response shape for both scheduled and emergency items
- Documented emergency price resolution order used by the backend
- Clarified booking/ping-first mapping with `Consultation` fallback for edge cases

### 2026-04-14

- Implemented and verified `GET /api/admin/consultations/{consultationId}`
- Unified admin list/detail contract on `AdminConsultationResponse`
- Clarified scheduled booking detail fields and emergency request detail fields

### 2026-04-15

- Updated list example to reflect the unified `AdminConsultationResponse` shape used by both list and single-item endpoints
