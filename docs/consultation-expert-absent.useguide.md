---
doc_role: planning
module: consultation-expert-absent
kind: flow
doc_type: usageguide
status: active
last_updated: 2026-05-04
api_version: v1
owners: [backend-team]
verification_status: code-verified
---

# Consultation Expert Absent API

## 1. Table Of Contents

- [1. Table Of Contents](#1-table-of-contents)
- [2. Overview](#2-overview)
- [3. Authentication & Authorization](#3-authentication--authorization)
- [4. Expert/Member Business + Expert/Member APIs](#4-expertmember-business--expertmember-apis)
- [5. Admin Business + Admin APIs](#5-admin-business--admin-apis)
- [6. Shared Data Models](#6-shared-data-models)
- [7. Verified Endpoint List](#7-verified-endpoint-list)
- [8. Follow-up Decisions](#8-follow-up-decisions)
- [9. Changelog](#9-changelog)

## 2. Overview

This document records the `current verified backend contract` relevant to the expert-absent reporting use case.

Current status:

- the absent-report feature is `implemented`
- there is an active member API to report absent expert for scheduled consultation
- there is an active admin API to mark absent-expert cases as handled
- `Customer Report` is present in member and admin consultation DTOs
- `CustomerReportSubmittedAt` is present in member and admin consultation DTOs
- scheduled auto-complete does not convert `ExpertAbsent` or `ExpertAbsentHandled` consultations to `Completed`
- admin handled-confirmation refunds the scheduled consultation escrow to the member and sets booking status to `Refunded`

## 3. Authentication & Authorization

### Expert/Member Operations

- JWT Bearer token is required
- `User` role is required for member consultation history
- `Expert` role is required for expert consultation history

### Admin Operations

- JWT Bearer token is required
- `Admin` role is required

## 4. Expert/Member Business + Expert/Member APIs

### 4.1 Business Scope

Current member consultation behavior:

- member can list their consultations
- member can see consultation status and room information
- member can submit an expert-absent report through a consultation API after `StartTime`

### 4.2 Member Endpoint

#### 4.2.1 `GET /api/users/me/consultations`

Purpose:

- member retrieves their own consultation history

Status:

- `Active`
- Code-verified

Auth:

- JWT Bearer token is required
- `User` role is required

Query params:

| Field      | Type   | Required | Notes                                                                 |
| ---------- | ------ | -------- | --------------------------------------------------------------------- |
| pageNumber | int    | No       | Default `1`, range `>= 1`                                             |
| pageSize   | int    | No       | Default `10`, range `1..100`                                          |
| status     | string | No       | `Scheduled`, `Ongoing`, `Completed`, `Cancelled`, `UserAbsent`, `ExpertAbsent`, `ExpertAbsentHandled`, `AllAbsent` |
| type       | string | No       | `Scheduled` or `Emergency`                                            |

Example request:

```http
GET /api/users/me/consultations?pageNumber=1&pageSize=10&type=Scheduled
Authorization: Bearer <member-jwt>
```

Success response:

- `ApiResponse<PagingResponse<MyConsultationResponse>>`

Verified example response shape:

```json
{
  "status_code": 200,
  "message": "Operation successful",
  "is_success": true,
  "data": {
    "items": [
      {
        "consultationId": "8ce96758-71b5-4310-bc35-d83525b2c54f",
        "type": "Scheduled",
        "status": "Completed",
        "expertId": "ba833fc7-6856-48b2-b032-9c5d985729d1",
        "expertName": "Pham Thi D",
        "roomId": "consultation-8ce96758-71b5-4310-bc35-d83525b2c54f",
        "startTime": "2026-04-09T14:00:00Z",
        "endTime": "2026-04-09T14:30:00Z",
        "price": 150000,
        "problemDescription": "Snakebite on finger",
        "bookingId": "ef54ec06-bb65-47d1-a7c5-db86aad6a49b",
        "slotStartTime": "2026-04-09T14:00:00Z",
        "slotEndTime": "2026-04-09T14:30:00Z",
        "emergencyRequestId": null
      }
    ],
    "meta": {
      "total_pages": 1,
      "total_items": 1,
      "current_page": 1,
      "page_size": 10
    }
  },
  "error": null
}
```

Field notes:

- `customerReport` is present when expert absence has been reported for that consultation
- `problemDescription` is booking problem content, not an expert-absent report
- successful absent-report submission sets consultation `status` to `ExpertAbsent`
- after a successful absent report, calling `POST /api/consultations/{consultationId}/end` closes the call and sets `endTime` without changing `status` from `ExpertAbsent`

#### 4.2.2 `POST /api/consultations/{consultationId}/expert-absent-report`

Purpose:

- member reports that the expert did not join the scheduled consultation

Status:

- `Active`
- Code-verified

Auth:

- JWT Bearer token is required
- `User` role is required

Route params:

| Field          | Type | Required | Notes                    |
| -------------- | ---- | -------- | ------------------------ |
| consultationId | guid | Yes      | Existing `Consultation.Id` |

Request body:

| Field          | Type   | Required | Notes                    |
| -------------- | ------ | -------- | ------------------------ |
| customerReport | string | Yes      | `1..2000` chars after trim |

Business rules:

- only the member/caller of the consultation can report
- only `Scheduled` consultations are supported
- current time must be after `StartTime`
- duplicate report is rejected
- successful report sets `Consultation.Status = ExpertAbsent`
- normal end-call after an expert-absent report preserves `Consultation.Status = ExpertAbsent`
- end-call cleanup for `ExpertAbsent` or `ExpertAbsentHandled` sets `EndTime` but does not mark the consultation `Completed`
- end-call cleanup for `ExpertAbsent` or `ExpertAbsentHandled` does not complete the scheduled booking or settle escrow
- scheduled auto-complete also preserves `ExpertAbsent` and `ExpertAbsentHandled`; it does not complete the booking or settle escrow for those statuses

Example request:

```http
POST /api/consultations/8ce96758-71b5-4310-bc35-d83525b2c54f/expert-absent-report
Authorization: Bearer <member-jwt>
Content-Type: application/json

{
  "customerReport": "Expert did not join the room."
}
```

#### 4.2.3 `POST /api/consultations/{consultationId}/end` after expert-absent report

Purpose:

- member closes the consultation call after submitting an expert-absent report

Status:

- `Active`
- Code-verified for `ExpertAbsent` / `ExpertAbsentHandled` status preservation

Auth:

- JWT Bearer token is required
- caller must be a participant of the consultation

Route params:

| Field          | Type | Required | Notes                    |
| -------------- | ---- | -------- | ------------------------ |
| consultationId | guid | Yes      | Existing `Consultation.Id` |

Business rules for expert-absent cases:

- when current consultation status is `ExpertAbsent` or `ExpertAbsentHandled`, this endpoint preserves that status
- endpoint sets `EndTime` when ending the call
- endpoint still performs runtime cleanup such as realtime end-call notification and LiveKit room deletion when configured
- endpoint does not set `Consultation.Status = Completed`
- endpoint does not set `ConsultationBooking.Status = Completed`
- endpoint does not settle consultation escrow

Example request:

```http
POST /api/consultations/8ce96758-71b5-4310-bc35-d83525b2c54f/end
Authorization: Bearer <member-jwt>
```

Success response:

- `ApiResponse<string>`

Example response:

```json
{
  "status_code": 200,
  "message": "Consultation ended successfully.",
  "is_success": true,
  "data": "Consultation ended successfully.",
  "error": null
}
```

Success response:

- `ApiResponse<MyConsultationResponse>`

Example response:

```json
{
  "status_code": 200,
  "message": "Operation successful",
  "is_success": true,
  "data": {
    "consultationId": "8ce96758-71b5-4310-bc35-d83525b2c54f",
    "type": "Scheduled",
    "status": "ExpertAbsent",
    "expertId": "ba833fc7-6856-48b2-b032-9c5d985729d1",
    "expertName": "Pham Thi D",
    "roomId": "consultation-8ce96758-71b5-4310-bc35-d83525b2c54f",
    "startTime": "2026-04-09T14:00:00Z",
    "endTime": null,
        "price": 150000,
        "problemDescription": "Snakebite on finger",
        "customerReport": "Expert did not join the room.",
        "customerReportSubmittedAt": "2026-04-09T14:05:00Z",
        "bookingId": "ef54ec06-bb65-47d1-a7c5-db86aad6a49b",
        "slotStartTime": "2026-04-09T14:00:00Z",
        "slotEndTime": "2026-04-09T14:30:00Z",
        "emergencyRequestId": null
  },
  "error": null
}
```

## 5. Admin Business + Admin APIs

### 5.1 Business Scope

Current admin consultation behavior:

- admin can list consultations across the system
- admin can open one consultation detail
- admin can see `Customer Report` in consultation responses when it exists
- admin can mark `ExpertAbsent` consultations as handled

### 5.2 Admin Endpoint

#### 5.2.1 `GET /api/admin/consultations`

Purpose:

- admin retrieves a paged list of consultations across the system

Status:

- `Active`
- Code-verified

Auth:

- JWT Bearer token is required
- `Admin` role is required

Query params:

| Field      | Type   | Required | Notes                                                                 |
| ---------- | ------ | -------- | --------------------------------------------------------------------- |
| pageNumber | int    | No       | Default `1`, range `>= 1`                                             |
| pageSize   | int    | No       | Default `10`, range `1..100`                                          |
| status     | string | No       | `Scheduled`, `Ongoing`, `Completed`, `Cancelled`, `UserAbsent`, `ExpertAbsent`, `ExpertAbsentHandled`, `AllAbsent` |
| type       | string | No       | `Scheduled` or `Emergency`                                            |

Example request:

```http
GET /api/admin/consultations?pageNumber=1&pageSize=10&type=Scheduled
Authorization: Bearer <admin-jwt>
```

Success response:

- `ApiResponse<PagingResponse<AdminConsultationResponse>>`

Verified field notes:

- `customerReport` is included when expert absence has been reported
- `problemDescription` is the scheduled-booking problem description
- scheduled and emergency consultations share one admin response DTO

#### 5.2.2 `GET /api/admin/consultations/{consultationId}`

Purpose:

- admin retrieves one consultation detail by `consultationId`

Status:

- `Active`
- Code-verified

Auth:

- JWT Bearer token is required
- `Admin` role is required

Route params:

| Field          | Type | Required | Notes                    |
| -------------- | ---- | -------- | ------------------------ |
| consultationId | guid | Yes      | Existing `Consultation.Id` |

Example request:

```http
GET /api/admin/consultations/8ce96758-71b5-4310-bc35-d83525b2c54f
Authorization: Bearer <admin-jwt>
```

Success response:

- `ApiResponse<AdminConsultationResponse>`

Verified field notes:

- `customerReport` is included when expert absence has been reported
- admin can see status, room, booking data, and emergency-request data
- admin can inspect absent-report text from current code

#### 5.2.3 `POST /api/admin/consultations/{consultationId}/expert-absent/confirm-handled`

Purpose:

- admin confirms that an expert-absent case has been handled

Status:

- `Active`
- Code-verified

Auth:

- JWT Bearer token is required
- `Admin` role is required

Route params:

| Field          | Type | Required | Notes                    |
| -------------- | ---- | -------- | ------------------------ |
| consultationId | guid | Yes      | Existing `Consultation.Id` |

Request body:

- none

Business rules:

- consultation must exist
- only consultations with `status = ExpertAbsent` can be marked as handled
- successful action sets `Consultation.Status = ExpertAbsentHandled`
- successful action refunds the scheduled consultation escrow to the member
- successful action sets linked `ConsultationBooking.Status = Refunded`
- repeated action after the case is already handled/refunded returns the current state and does not create a duplicate refund
- response returns the updated admin consultation object

Example request:

```http
POST /api/admin/consultations/8ce96758-71b5-4310-bc35-d83525b2c54f/expert-absent/confirm-handled
Authorization: Bearer <admin-jwt>
```

Success response:

- `ApiResponse<AdminConsultationResponse>`

Example response:

```json
{
  "status_code": 200,
  "message": "Expert absent case marked as handled successfully.",
  "is_success": true,
  "data": {
    "consultationId": "8ce96758-71b5-4310-bc35-d83525b2c54f",
    "type": "Scheduled",
    "status": "ExpertAbsentHandled",
    "userId": "0dbe91d2-b5ad-4e35-8f8d-daa44ac3196f",
    "userName": "Nguyen Van A",
    "expertId": "ba833fc7-6856-48b2-b032-9c5d985729d1",
    "expertName": "Pham Thi D",
    "roomId": "consultation-8ce96758-71b5-4310-bc35-d83525b2c54f",
    "startTime": "2026-04-09T14:00:00Z",
    "endTime": null,
    "price": 150000,
    "problemDescription": "Snakebite on finger",
    "customerReport": "Expert did not join the room.",
    "customerReportSubmittedAt": "2026-04-09T14:05:00Z",
    "bookingId": "ef54ec06-bb65-47d1-a7c5-db86aad6a49b",
    "bookingStatus": "Refunded",
    "slotStartTime": "2026-04-09T14:00:00Z",
    "slotEndTime": "2026-04-09T14:30:00Z",
    "emergencyRequestId": null
  },
  "error": null
}
```

## 6. Shared Data Models

### 6.1 Current `MyConsultationResponse`

Current verified shape includes:

- `consultationId`
- `type`
- `status`
- `expertId`
- `expertName`
- `roomId`
- `startTime`
- `endTime`
- `price`
- `problemDescription`
- `customerReport`
- `customerReportSubmittedAt`
- `bookingId`
- `slotStartTime`
- `slotEndTime`
- `emergencyRequestId`

### 6.2 Current `AdminConsultationResponse`

Current verified shape includes:

- consultation identity
- type and status
- user and expert identifiers/names
- room and timing data
- price
- `problemDescription`
- `customerReport`
- `customerReportSubmittedAt`
- booking metadata
- emergency-request metadata
- slot timing

## 7. Verified Endpoint List

Active endpoints relevant to this module:

- `GET /api/users/me/consultations`
- `POST /api/consultations/{consultationId}/expert-absent-report`
- `POST /api/consultations/{consultationId}/end`
- `GET /api/experts/me/consultations`
- `GET /api/admin/consultations`
- `GET /api/admin/consultations/{consultationId}`
- `POST /api/admin/consultations/{consultationId}/expert-absent/confirm-handled`

## 8. Follow-up Decisions

These items record the verified payment/booking behavior and the remaining optional admin-note research.

### 8.1 Payment Resolution

Current verified behavior:

- expert-absent report does not refund the member
- expert-absent end-call does not settle escrow to the expert
- scheduled auto-complete does not settle escrow for `ExpertAbsent` or `ExpertAbsentHandled`
- admin handled-confirmation sets consultation status to `ExpertAbsentHandled`
- admin handled-confirmation refunds the scheduled consultation escrow to the member
- admin handled-confirmation currently has no request body/admin note form

### 8.2 Booking Final Status

Current verified behavior:

- expert-absent end-call does not set `ConsultationBooking.Status = Completed`
- scheduled auto-complete does not set expert-absent bookings to `Completed`
- after admin approval refund succeeds, `ConsultationBooking.Status = Refunded`

### 8.3 Escrow Dispute State

Current verified behavior:

- scheduled consultation payment can already be in escrow before the expert-absent report
- cleanup-call keeps that escrow unresolved
- escrow remains unresolved until admin approval
- admin approval reverses/refunds escrow to the member
- repeated approval does not create a duplicate refund; it returns the current handled/refunded state when already resolved

### 8.4 Admin Approval Note Input

Current verified behavior:

- `POST /api/admin/consultations/{consultationId}/expert-absent/confirm-handled` has no request body
- admin currently cannot submit an admin-authored report/note in this endpoint

Open research:

- whether the follow-up approval request needs an admin note/report field

## 9. Changelog

### 2026-04-21

- Initialized use guide for the consultation expert-absent module
- Updated the guide to the implemented absent-report contract

### 2026-04-22

- Added admin endpoint to mark `ExpertAbsent` consultations as handled
- Added `ExpertAbsentHandled` to documented consultation status values

### 2026-05-04

- Documented code-verified end-call behavior for `ExpertAbsent` / `ExpertAbsentHandled`
- Clarified that expert-absent end-call cleanup preserves status, sets `EndTime`, and does not complete booking or settle escrow
- Added frontend-visible open research notes for payment resolution, booking final status, and escrow dispute state
- Recorded follow-up decisions: refund on admin approval, booking status `Refunded`, no expert settlement, idempotent repeat approval
- Verified admin handled-confirmation currently has no request body/admin note form
- Promoted scheduled auto-complete denylist and admin approval refund/idempotency to code-verified active behavior
