---
module: expert-certs
last_updated: 2026-04-22
status: active-contract
audience: mobile-and-frontend
source_of_truth: SnakeAid.Backend
---

# Expert Certificates Use Guide

## 1. Overview

This document describes the active backend contract for expert certificate management as implemented in `SnakeAid.Backend`.

Current active backend state:

- expert certificate CRUD endpoints are active for both `Expert` and `Admin`
- `ExpertProfile.IsVerified` is now persisted
- `isVerified` is exposed in:
  - public expert directory
  - expert my-profile
  - admin user detail
- certificate attachments use `ReportMedia`
- certificate media must use:
  - `ReferenceType = ExpertCertificate`
  - `ReferenceId = ExpertCertificate.Id`
- current response still includes `certificateUrl` as a compatibility field
- any expert-side update resets `verificationStatus` to `Pending`
- profile verification is strict:
  - `isVerified = true` only when all current certificates for that expert are `Verified`
  - if any certificate is `Pending` or `Rejected`, `isVerified = false`

Important current integration limitation:

- certificate create and update require `reportMediaIds`
- those media records must already exist as `ReportMedia` with `type=ExpertCertificate`
- current `POST /api/media/report` upload path only accepts image files (`.jpg`, `.jpeg`, `.png`, `.gif`, `.webp`)
- therefore the active certificate attachment flow is image-based in the current codebase, even though older planning examples used PDF URLs

## 2. Authentication and Authorization

### 2.1 Expert APIs

- actor: authenticated `Expert`
- ownership rule: expert can only access certificates where `ExpertId == current user id`

### 2.2 Admin APIs

- actor: authenticated `Admin`
- scope: admin can access certificates across all experts
- admin can create certificates for an existing expert account
- admin direct-create supports direct-recruit onboarding for an already existing expert account

## 3. Shared Data Models

## 3.1 Active `ExpertCertificateResponse`

```json
{
  "id": "9f5d44f4-0e31-4931-983f-08f0fc8d15f1",
  "expertId": "7aaab7a4-6441-4f6c-88d0-e8451adf6d7b",
  "certificateName": "Clinical Toxicology Certificate",
  "issuingOrganization": "Vietnam Poison Control Academy",
  "issueDate": "2025-05-01T00:00:00Z",
  "expiryDate": "2028-05-01T00:00:00Z",
  "certificateUrl": "https://cdn.example.com/expert-cert-001.jpg",
  "media": [
    {
      "id": "d02d0d8b-8f2e-4621-a4c9-65351e9db52c",
      "mediaUrl": "https://cdn.example.com/expert-cert-001.jpg",
      "fileName": "expert-cert-001.jpg",
      "contentType": "image/jpeg",
      "fileSize": 245123,
      "referenceType": "ExpertCertificate",
      "purpose": "Evidence",
      "requiresAIProcessing": false
    }
  ],
  "verificationStatus": "Pending",
  "rejectionReason": ""
}
```

Field notes:

- `certificateUrl` is still returned by the backend for compatibility
- `media` is the active attachment contract and should be preferred by frontend/mobile
- `verificationStatus` values are:
  - `Pending`
  - `Verified`
  - `Rejected`
- `rejectionReason` is empty unless the status is `Rejected`

## 3.2 Active `CreateExpertCertificateRequest`

```json
{
  "certificateName": "Clinical Toxicology Certificate",
  "issuingOrganization": "Vietnam Poison Control Academy",
  "issueDate": "2025-05-01T00:00:00Z",
  "expiryDate": "2028-05-01T00:00:00Z",
  "reportMediaIds": [
    "d02d0d8b-8f2e-4621-a4c9-65351e9db52c"
  ]
}
```

Field notes:

- `certificateName`: required, max length `250`
- `issuingOrganization`: required, max length `250`
- `issueDate`: required
- `expiryDate`: optional
- `reportMediaIds`: required, at least one item
- if `expiryDate < issueDate`, the request is rejected

## 3.3 Active `AdminCreateExpertCertificateRequest`

```json
{
  "expertId": "7aaab7a4-6441-4f6c-88d0-e8451adf6d7b",
  "certificateName": "Clinical Toxicology Certificate",
  "issuingOrganization": "Vietnam Poison Control Academy",
  "issueDate": "2025-05-01T00:00:00Z",
  "expiryDate": "2028-05-01T00:00:00Z",
  "reportMediaIds": [
    "d02d0d8b-8f2e-4621-a4c9-65351e9db52c"
  ],
  "verificationStatus": "Verified",
  "rejectionReason": ""
}
```

Field notes:

- `expertId`: required and must point to an existing expert account
- `verificationStatus` can be set by admin on create
- `rejectionReason` is required when `verificationStatus = Rejected`

## 3.4 Active `UpdateExpertCertificateRequest`

```json
{
  "certificateName": "Advanced Clinical Toxicology Certificate",
  "issuingOrganization": "Vietnam Poison Control Academy",
  "issueDate": "2025-05-01T00:00:00Z",
  "expiryDate": "2028-05-01T00:00:00Z",
  "reportMediaIds": [
    "d02d0d8b-8f2e-4621-a4c9-65351e9db52f"
  ]
}
```

## 3.5 Active `AdminUpdateExpertCertificateRequest`

```json
{
  "certificateName": "Advanced Clinical Toxicology Certificate",
  "issuingOrganization": "Vietnam Poison Control Academy",
  "issueDate": "2025-05-01T00:00:00Z",
  "expiryDate": "2028-05-01T00:00:00Z",
  "reportMediaIds": [
    "d02d0d8b-8f2e-4621-a4c9-65351e9db52f"
  ],
  "verificationStatus": "Rejected",
  "rejectionReason": "Uploaded certificate image is unreadable."
}
```

## 3.6 Active profile verification field

Current backend behavior:

- `isVerified` now reflects persisted `ExpertProfile.IsVerified`
- active exposure surfaces:
  - public expert directory
  - expert my-profile
  - admin user detail

## 3.7 Media upload prerequisite

Before calling certificate create or update endpoints, the client must first upload media through the existing media API.

Current upload contract:

- endpoint: `POST /api/media/report`
- auth: required
- query param `type=ExpertCertificate`
- current accepted file extensions:
  - `.jpg`
  - `.jpeg`
  - `.png`
  - `.gif`
  - `.webp`

Frontend/mobile notes:

- the returned `ReportMedia.id` must be placed into `reportMediaIds`
- the backend rejects `reportMediaIds` if the referenced media is not `ReferenceType = ExpertCertificate`
- the backend rejects media that is already attached to another certificate

## 4. Expert Business + Expert APIs

Current active behavior:

- expert can create, list, view, update, and delete own certificates
- create does not automatically mark the expert verified
- expert cannot directly control `verificationStatus`
- any expert-side update resets the certificate to `Pending`

### 4.1 `POST /api/experts/me/certificates`

Purpose:

- create a certificate owned by the current expert

Auth:

- required
- role `Expert`

Request body:

```json
{
  "certificateName": "Clinical Toxicology Certificate",
  "issuingOrganization": "Vietnam Poison Control Academy",
  "issueDate": "2025-05-01T00:00:00Z",
  "expiryDate": "2028-05-01T00:00:00Z",
  "reportMediaIds": [
    "d02d0d8b-8f2e-4621-a4c9-65351e9db52c"
  ]
}
```

Success response example:

```json
{
  "statusCode": 201,
  "message": "Certificate created successfully.",
  "isSuccess": true,
  "data": {
    "id": "9f5d44f4-0e31-4931-983f-08f0fc8d15f1",
    "expertId": "7aaab7a4-6441-4f6c-88d0-e8451adf6d7b",
    "certificateName": "Clinical Toxicology Certificate",
    "issuingOrganization": "Vietnam Poison Control Academy",
    "issueDate": "2025-05-01T00:00:00Z",
    "expiryDate": "2028-05-01T00:00:00Z",
    "certificateUrl": "https://cdn.example.com/expert-cert-001.jpg",
    "media": [
      {
        "id": "d02d0d8b-8f2e-4621-a4c9-65351e9db52c",
        "mediaUrl": "https://cdn.example.com/expert-cert-001.jpg",
        "fileName": "expert-cert-001.jpg",
        "contentType": "image/jpeg",
        "fileSize": 245123,
        "referenceType": "ExpertCertificate",
        "purpose": "Evidence",
        "requiresAIProcessing": false
      }
    ],
    "verificationStatus": "Pending",
    "rejectionReason": ""
  }
}
```

Client notes:

- create response success does not mean the expert is verified
- `verificationStatus` starts as `Pending`
- frontend should refresh profile-level `isVerified` separately if it is displayed nearby

### 4.2 `GET /api/experts/me/certificates`

Purpose:

- list certificates owned by the current expert

Auth:

- required
- role `Expert`

Success response shape:

- `200 OK`
- `data` is an array, not a paged object

Example:

```json
{
  "statusCode": 200,
  "message": "Expert certificates retrieved.",
  "isSuccess": true,
  "data": [
    {
      "id": "9f5d44f4-0e31-4931-983f-08f0fc8d15f1",
      "expertId": "7aaab7a4-6441-4f6c-88d0-e8451adf6d7b",
      "certificateName": "Clinical Toxicology Certificate",
      "issuingOrganization": "Vietnam Poison Control Academy",
      "issueDate": "2025-05-01T00:00:00Z",
      "expiryDate": "2028-05-01T00:00:00Z",
      "certificateUrl": "https://cdn.example.com/expert-cert-001.jpg",
      "media": [],
      "verificationStatus": "Pending",
      "rejectionReason": ""
    }
  ]
}
```

### 4.3 `GET /api/experts/me/certificates/{certificateId}`

Purpose:

- get detail for one certificate owned by the current expert

Auth:

- required
- role `Expert`

Success response:

- `200 OK`
- `data` is one `ExpertCertificateResponse`

### 4.4 `PUT /api/experts/me/certificates/{certificateId}`

Purpose:

- update one certificate owned by the current expert

Auth:

- required
- role `Expert`

Request body:

```json
{
  "certificateName": "Advanced Clinical Toxicology Certificate",
  "issuingOrganization": "Vietnam Poison Control Academy",
  "issueDate": "2025-05-01T00:00:00Z",
  "expiryDate": "2028-05-01T00:00:00Z",
  "reportMediaIds": [
    "d02d0d8b-8f2e-4621-a4c9-65351e9db52f"
  ]
}
```

Client notes:

- any expert-side update resets `verificationStatus` to `Pending`
- backend clears old rejection reason on expert update
- frontend should treat update success as resubmission for re-review

### 4.5 `DELETE /api/experts/me/certificates/{certificateId}`

Purpose:

- delete one certificate owned by the current expert

Auth:

- required
- role `Expert`

Success response example:

```json
{
  "statusCode": 200,
  "message": "Certificate deleted successfully.",
  "isSuccess": true,
  "data": null
}
```

Client notes:

- delete may change profile-level `isVerified`
- after delete, the client should refresh the certificate list and any profile verification badge

## 5. Admin Business + Admin APIs

Current active behavior:

- admin can create, list, view, update, and delete certificates globally
- admin can create certificates for an existing expert account
- admin can set review state during create or update
- admin direct-create supports direct-recruit onboarding for an already existing expert account

### 5.1 `POST /api/admin/expert/certificates`

Purpose:

- create a certificate record for a target expert from the admin side

Auth:

- required
- role `Admin`

Request body:

```json
{
  "expertId": "7aaab7a4-6441-4f6c-88d0-e8451adf6d7b",
  "certificateName": "Clinical Toxicology Certificate",
  "issuingOrganization": "Vietnam Poison Control Academy",
  "issueDate": "2025-05-01T00:00:00Z",
  "expiryDate": "2028-05-01T00:00:00Z",
  "reportMediaIds": [
    "d02d0d8b-8f2e-4621-a4c9-65351e9db52c"
  ],
  "verificationStatus": "Verified",
  "rejectionReason": ""
}
```

Client notes:

- `expertId` must be an existing expert account
- admin can create directly with `Verified` status
- this endpoint does not create the account itself

### 5.2 `GET /api/admin/expert/certificates`

Purpose:

- list certificates across all experts

Auth:

- required
- role `Admin`

Supported query params:

- `pageNumber`
- `pageSize`
- `expertId`
- `verificationStatus`

Example query usage:

- `/api/admin/expert/certificates`
- `/api/admin/expert/certificates?pageNumber=1&pageSize=20`
- `/api/admin/expert/certificates?expertId=7aaab7a4-6441-4f6c-88d0-e8451adf6d7b`
- `/api/admin/expert/certificates?verificationStatus=Pending`

Success response shape:

- `200 OK`
- `data` is a paged object with `items` and `meta`

### 5.3 `GET /api/admin/expert/certificates/{certificateId}`

Purpose:

- get detail for one certificate

Auth:

- required
- role `Admin`

Success response:

- `200 OK`
- `data` is one `ExpertCertificateResponse`

### 5.4 `PUT /api/admin/expert/certificates/{certificateId}`

Purpose:

- update certificate data and review state

Auth:

- required
- role `Admin`

Request body:

```json
{
  "certificateName": "Advanced Clinical Toxicology Certificate",
  "issuingOrganization": "Vietnam Poison Control Academy",
  "issueDate": "2025-05-01T00:00:00Z",
  "expiryDate": "2028-05-01T00:00:00Z",
  "reportMediaIds": [
    "d02d0d8b-8f2e-4621-a4c9-65351e9db52f"
  ],
  "verificationStatus": "Rejected",
  "rejectionReason": "Uploaded certificate image is unreadable."
}
```

Success response example:

```json
{
  "statusCode": 200,
  "message": "Certificate updated successfully.",
  "isSuccess": true,
  "data": {
    "id": "9f5d44f4-0e31-4931-983f-08f0fc8d15f1",
    "expertId": "7aaab7a4-6441-4f6c-88d0-e8451adf6d7b",
    "certificateName": "Advanced Clinical Toxicology Certificate",
    "issuingOrganization": "Vietnam Poison Control Academy",
    "issueDate": "2025-05-01T00:00:00Z",
    "expiryDate": "2028-05-01T00:00:00Z",
    "certificateUrl": "https://cdn.example.com/expert-cert-001-v2.jpg",
    "media": [
      {
        "id": "d02d0d8b-8f2e-4621-a4c9-65351e9db52f",
        "mediaUrl": "https://cdn.example.com/expert-cert-001-v2.jpg",
        "fileName": "expert-cert-001-v2.jpg",
        "contentType": "image/jpeg",
        "fileSize": 251442,
        "referenceType": "ExpertCertificate",
        "purpose": "Evidence",
        "requiresAIProcessing": false
      }
    ],
    "verificationStatus": "Rejected",
    "rejectionReason": "Uploaded certificate image is unreadable."
  }
}
```

Client notes:

- if admin sends `Rejected`, `rejectionReason` must be present
- if admin sends `Pending` or `Verified`, backend clears `rejectionReason`
- every admin review update recalculates profile-level `isVerified`

### 5.5 `DELETE /api/admin/expert/certificates/{certificateId}`

Purpose:

- delete a certificate globally from the admin side

Auth:

- required
- role `Admin`

Success response example:

```json
{
  "statusCode": 200,
  "message": "Certificate deleted successfully.",
  "isSuccess": true,
  "data": null
}
```

## 6. Verified Endpoint List

Active endpoints as of 2026-04-22:

- `POST /api/experts/me/certificates`
- `GET /api/experts/me/certificates`
- `GET /api/experts/me/certificates/{certificateId}`
- `PUT /api/experts/me/certificates/{certificateId}`
- `DELETE /api/experts/me/certificates/{certificateId}`
- `POST /api/admin/expert/certificates`
- `GET /api/admin/expert/certificates`
- `GET /api/admin/expert/certificates/{certificateId}`
- `PUT /api/admin/expert/certificates/{certificateId}`
- `DELETE /api/admin/expert/certificates/{certificateId}`

Related active endpoints the client will usually need:

- `POST /api/media/report?type=ExpertCertificate&purpose=Evidence`
- `GET /api/experts`
- `GET /api/experts/me/profile`
- `GET /api/admin/users/{userId}`

## 7. Changelog

- 2026-04-21: initialized planning use guide for `expert-certs`
- 2026-04-21: recorded proposed expert/admin API contracts during planning
- 2026-04-22: updated guide from planning contract to active contract after implementation
- 2026-04-22: documented active route set, persisted `isVerified`, strict verification rule, and current image-based media upload limitation
