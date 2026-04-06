---
doc_role: proposal
module: admin-dashboard
kind: flow
doc_type: usageguide
status: active
last_updated: 2026-04-05
api_version: v1
owners: [backend-team]
verification_status: proposed
---

# Admin Dashboard — Đề xuất Analytics Endpoints cho Backend

## 1. Table Of Contents

- [1. Table Of Contents](#1-table-of-contents)
- [2. Overview](#2-overview)
- [3. Định nghĩa 3 Luồng tiền](#3-định-nghĩa-3-luồng-tiền)
- [4. Authentication](#4-authentication)
- [5. Endpoint Đề xuất](#5-endpoint-đề-xuất)
  - [5.1 Doanh thu theo kỳ](#51-doanh-thu-theo-kỳ)
  - [5.2 Hoa hồng từ luồng Expert](#52-hoa-hồng-từ-luồng-expert)
  - [5.3 Lợi nhuận theo kỳ](#53-lợi-nhuận-theo-kỳ)
- [6. Transaction Type Reference](#6-transaction-type-reference)
- [7. Tổng hợp Endpoint List](#7-tổng-hợp-endpoint-list)
- [8. Changelog](#8-changelog)

---

## 2. Overview

Tài liệu này đề xuất các **analytics endpoint** backend cần xây dựng để phục vụ trang Admin Dashboard.

Toàn bộ tính toán dựa trên bảng `transactions` hiện có trong hệ thống — không cần bảng mới.

Ba nhu cầu chính:
1. **Doanh thu ngày/tháng/năm** — cho cả 3 luồng tiền và tổng
2. **Hoa hồng từ luồng Expert** — phần nền tảng giữ lại từ consultation
3. **Lợi nhuận ngày/tháng/năm** — cho từng luồng và tổng (ca SOS + bắt rắn + hoa hồng expert)

Tất cả endpoint dưới đây là **đề xuất mới**, backend cần implement dựa trên logic tính toán mô tả trong doc này.

---

## 3. Định nghĩa 3 Luồng tiền

Hệ thống SnakeAid có 3 luồng nghiệp vụ sinh doanh thu:

### Luồng 1 — Tư vấn chuyên gia (Consultation)

```
Member trả tiền ──► ConsultationPayment
                        │
                        ├──► ExpertPayout       (chi trả cho expert)
                        └──► PlatformFee        (phần nền tảng giữ = hoa hồng)
```

| Vai trò | TransactionType | Chiều |
|---------|----------------|-------|
| Doanh thu (member trả) | `ConsultationPayment` (0) | Vào |
| Chi phí (trả expert) | `ExpertPayout` (1) | Ra |
| Hoàn tiền | `ConsultationRefund` (2) | Ra |
| Hoa hồng nền tảng | `PlatformFee` (30) — attributed to consultation | Giữ lại |

**Lợi nhuận luồng tư vấn** = `ConsultationPayment` − `ExpertPayout` − `ConsultationRefund`

> Tương đương: Sum `PlatformFee` transactions có `referenceId` trỏ về consultation booking.

---

### Luồng 2 — Bắt rắn (Snake Catching)

```
Member trả tiền ──► CatchingPayment + CatchingDeposit
```

| Vai trò | TransactionType | Chiều |
|---------|----------------|-------|
| Doanh thu (member trả) | `CatchingPayment` (20) + `CatchingDeposit` (23) | Vào |

> Luồng bắt rắn hoạt động theo mô hình **trung tâm** — toàn bộ doanh thu thuộc về nền tảng, không có PlatformFee split riêng.

**Lợi nhuận luồng bắt rắn** = `CatchingPayment` + `CatchingDeposit`

---

### Luồng 3 — Sự cố rắn cắn / Cứu hộ (Snakebite Incident)

```
Member trả tiền ──► SnakebiteIncidentPayment
```

| Vai trò | TransactionType | Chiều |
|---------|----------------|-------|
| Doanh thu (member trả) | `SnakebiteIncidentPayment` (40) | Vào |

**Lợi nhuận luồng cứu hộ** = `SnakebiteIncidentPayment`

> Luồng này không có transaction chi trả hay hoàn tiền trong hệ thống hiện tại.

---

## 4. Authentication

Toàn bộ endpoint analytics yêu cầu:
- JWT Bearer token: `Authorization: Bearer <token>`
- Role `Admin` trong token claims — trả `403 Forbidden` nếu không khớp

Response wrapper `ApiResponse<T>` cho tất cả endpoint:
```json
{
  "status_code": 200,
  "message": "OK",
  "is_success": true,
  "data": {},
  "error": null
}
```

---

## 5. Endpoint Đề xuất

### 5.1 Doanh thu theo kỳ

#### `GET /api/admin/analytics/revenue`

**Mục đích:** Tổng doanh thu (số tiền member thực trả) theo ngày/tháng/năm, phân theo từng luồng và tổng hợp.

**Doanh thu = tổng số tiền member bỏ vào** (chưa trừ chi phí trả cho expert/catcher/rescuer).

Query parameters:

| Param | Type | Required | Description |
|-------|------|----------|-------------|
| `period` | enum | Yes | `day` / `month` / `year` — đơn vị nhóm timeline |
| `from` | date | Yes | Ngày bắt đầu, format `YYYY-MM-DD` |
| `to` | date | Yes | Ngày kết thúc, format `YYYY-MM-DD` |
| `flow` | enum | No | `consultation` / `catching` / `snakebite` — bỏ trống = trả cả 3 |

Ví dụ gọi:
```
GET /api/admin/analytics/revenue?period=month&from=2026-01-01&to=2026-04-05
GET /api/admin/analytics/revenue?period=day&from=2026-04-01&to=2026-04-05&flow=consultation
```

**Logic tính toán phía backend** (từ bảng `transactions`):

| Flow | TransactionType tính vào doanh thu | TransactionType trừ (hoàn tiền) |
|------|-------------------------------------|----------------------------------|
| `consultation` | `ConsultationPayment` (0) | `ConsultationRefund` (2) |
| `catching` | `CatchingPayment` (20) + `CatchingDeposit` (23) | — |
| `snakebite` | `SnakebiteIncidentPayment` (40) | — |

> Doanh thu mỗi dòng = SUM(payment types) − SUM(refund types) trong khoảng thời gian, nhóm theo `period`.

Success response (`period=month`, không filter flow):
```json
{
  "status_code": 200,
  "message": "OK",
  "is_success": true,
  "data": {
    "from": "2026-01-01",
    "to": "2026-04-05",
    "period": "month",
    "currency": "VND",
    "total": 18500000,
    "byFlow": {
      "consultation": 8000000,
      "catching": 7500000,
      "snakebite": 3000000
    },
    "timeline": [
      {
        "label": "2026-01",
        "total": 4500000,
        "consultation": 2000000,
        "catching": 1800000,
        "snakebite": 700000
      },
      {
        "label": "2026-02",
        "total": 5200000,
        "consultation": 2300000,
        "catching": 2000000,
        "snakebite": 900000
      },
      {
        "label": "2026-03",
        "total": 5800000,
        "consultation": 2500000,
        "catching": 2200000,
        "snakebite": 1100000
      },
      {
        "label": "2026-04",
        "total": 3000000,
        "consultation": 1200000,
        "catching": 1500000,
        "snakebite": 300000
      }
    ]
  },
  "error": null
}
```

Response schema `data`:

| Field | Type | Description |
|-------|------|-------------|
| `from` | date string | Ngày bắt đầu của khoảng query |
| `to` | date string | Ngày kết thúc |
| `period` | string | `day` / `month` / `year` |
| `currency` | string | `VND` |
| `total` | decimal | Tổng doanh thu toàn kỳ, tất cả flow |
| `byFlow.consultation` | decimal | Doanh thu luồng tư vấn |
| `byFlow.catching` | decimal | Doanh thu luồng bắt rắn |
| `byFlow.snakebite` | decimal | Doanh thu luồng cứu hộ |
| `timeline` | array | Mảng điểm dữ liệu nhóm theo `period` |
| `timeline[].label` | string | Nhãn nhóm: `YYYY-MM-DD` / `YYYY-MM` / `YYYY` |
| `timeline[].total` | decimal | Tổng tất cả flow trong kỳ đó |
| `timeline[].consultation` | decimal | Doanh thu tư vấn trong kỳ đó |
| `timeline[].catching` | decimal | Doanh thu bắt rắn trong kỳ đó |
| `timeline[].snakebite` | decimal | Doanh thu cứu hộ trong kỳ đó |

Notes:
- Nếu truyền `flow=consultation`, `byFlow` và `timeline` chỉ trả field đó; `total` = doanh thu flow đó
- Kỳ không có giao dịch vẫn trả điểm dữ liệu với value `0` để FE vẽ chart liên tục
- Doanh thu đã trừ hoàn tiền (net revenue), không tính gross

---

### 5.2 Hoa hồng từ luồng Expert

#### `GET /api/admin/analytics/commission`

**Mục đích:** Phần nền tảng giữ lại từ luồng tư vấn chuyên gia — chính là `PlatformFee` liên quan đến consultation, hoặc tính theo công thức `ConsultationPayment − ExpertPayout − ConsultationRefund`.

Query parameters:

| Param | Type | Required | Description |
|-------|------|----------|-------------|
| `period` | enum | Yes | `day` / `month` / `year` |
| `from` | date | Yes | Ngày bắt đầu `YYYY-MM-DD` |
| `to` | date | Yes | Ngày kết thúc `YYYY-MM-DD` |

Ví dụ gọi:
```
GET /api/admin/analytics/commission?period=month&from=2026-01-01&to=2026-04-05
GET /api/admin/analytics/commission?period=year&from=2026-01-01&to=2026-12-31
```

**Logic tính toán phía backend**:

```
Hoa hồng = SUM(ConsultationPayment) − SUM(ExpertPayout) − SUM(ConsultationRefund)
```

Hoặc nếu backend track `PlatformFee` per-flow qua `referenceId`:
```
Hoa hồng = SUM(PlatformFee WHERE referenceId IN consultation_bookings)
```

> Khuyến nghị: dùng công thức trừ trực tiếp cho đơn giản. Không phụ thuộc vào việc `PlatformFee` có `referenceId` hợp lệ hay không.

Success response:
```json
{
  "status_code": 200,
  "message": "OK",
  "is_success": true,
  "data": {
    "from": "2026-01-01",
    "to": "2026-04-05",
    "period": "month",
    "currency": "VND",
    "totalCommission": 2400000,
    "rateNote": "Hoa hồng = ConsultationPayment − ExpertPayout − ConsultationRefund",
    "timeline": [
      {
        "label": "2026-01",
        "revenue": 2000000,
        "expertPayout": 1400000,
        "refund": 0,
        "commission": 600000
      },
      {
        "label": "2026-02",
        "revenue": 2300000,
        "expertPayout": 1600000,
        "refund": 100000,
        "commission": 600000
      },
      {
        "label": "2026-03",
        "revenue": 2500000,
        "expertPayout": 1700000,
        "refund": 0,
        "commission": 800000
      },
      {
        "label": "2026-04",
        "revenue": 1200000,
        "expertPayout": 800000,
        "refund": 0,
        "commission": 400000
      }
    ]
  },
  "error": null
}
```

Response schema `data`:

| Field | Type | Description |
|-------|------|-------------|
| `totalCommission` | decimal | Tổng hoa hồng tư vấn toàn kỳ |
| `rateNote` | string | Mô tả công thức backend dùng (để FE/audit hiểu) |
| `timeline[].label` | string | Nhãn kỳ |
| `timeline[].revenue` | decimal | Tổng `ConsultationPayment` trong kỳ |
| `timeline[].expertPayout` | decimal | Tổng `ExpertPayout` trong kỳ |
| `timeline[].refund` | decimal | Tổng `ConsultationRefund` trong kỳ |
| `timeline[].commission` | decimal | `revenue − expertPayout − refund` |

Notes:
- `commission` âm (< 0) xảy ra khi có nhiều hoàn tiền hơn thu — backend nên trả nguyên giá trị âm, không clamp về 0
- Dashboard FE nên highlight màu đỏ nếu `commission < 0` trong một kỳ

---

### 5.3 Lợi nhuận theo kỳ

#### `GET /api/admin/analytics/profit`

**Mục đích:** Tổng lợi nhuận nền tảng theo ngày/tháng/năm — trên cả 3 luồng và từng luồng riêng lẻ.

**Lợi nhuận** = Doanh thu thu về − Chi phí trả ra cho provider (expert / catcher / rescuer) − Hoàn tiền.

Query parameters:

| Param | Type | Required | Description |
|-------|------|----------|-------------|
| `period` | enum | Yes | `day` / `month` / `year` |
| `from` | date | Yes | Ngày bắt đầu `YYYY-MM-DD` |
| `to` | date | Yes | Ngày kết thúc `YYYY-MM-DD` |
| `flow` | enum | No | `consultation` / `catching` / `snakebite` — bỏ trống = tất cả |

Ví dụ gọi:
```
GET /api/admin/analytics/profit?period=month&from=2026-01-01&to=2026-04-05
GET /api/admin/analytics/profit?period=day&from=2026-04-01&to=2026-04-05&flow=catching
```

**Logic tính toán phía backend** (từ bảng `transactions`):

| Flow | Công thức lợi nhuận |
|------|---------------------|
| `consultation` | `SUM(ConsultationPayment)` − `SUM(ExpertPayout)` − `SUM(ConsultationRefund)` |
| `catching` | `SUM(CatchingPayment)` + `SUM(CatchingDeposit)` |
| `snakebite` | `SUM(SnakebiteIncidentPayment)` |
| **Tổng** | `consultation + catching + snakebite` |

Success response (`period=month`, không filter flow):
```json
{
  "status_code": 200,
  "message": "OK",
  "is_success": true,
  "data": {
    "from": "2026-01-01",
    "to": "2026-04-05",
    "period": "month",
    "currency": "VND",
    "totalProfit": 5100000,
    "byFlow": {
      "consultation": 2400000,
      "catching": 1800000,
      "snakebite": 900000
    },
    "timeline": [
      {
        "label": "2026-01",
        "totalProfit": 1100000,
        "consultation": 600000,
        "catching": 350000,
        "snakebite": 150000
      },
      {
        "label": "2026-02",
        "totalProfit": 1300000,
        "consultation": 600000,
        "catching": 450000,
        "snakebite": 250000
      },
      {
        "label": "2026-03",
        "totalProfit": 1500000,
        "consultation": 800000,
        "catching": 450000,
        "snakebite": 250000
      },
      {
        "label": "2026-04",
        "totalProfit": 1200000,
        "consultation": 400000,
        "catching": 550000,
        "snakebite": 250000
      }
    ]
  },
  "error": null
}
```

Response schema `data`:

| Field | Type | Description |
|-------|------|-------------|
| `totalProfit` | decimal | Tổng lợi nhuận 3 luồng trong toàn kỳ |
| `byFlow.consultation` | decimal | Lợi nhuận luồng tư vấn toàn kỳ |
| `byFlow.catching` | decimal | Lợi nhuận luồng bắt rắn toàn kỳ |
| `byFlow.snakebite` | decimal | Lợi nhuận luồng cứu hộ toàn kỳ |
| `timeline[].label` | string | Nhãn kỳ |
| `timeline[].totalProfit` | decimal | Tổng lợi nhuận kỳ đó |
| `timeline[].consultation` | decimal | Lợi nhuận tư vấn kỳ đó |
| `timeline[].catching` | decimal | Lợi nhuận bắt rắn kỳ đó |
| `timeline[].snakebite` | decimal | Lợi nhuận cứu hộ kỳ đó |

Notes:
- Kỳ không có giao dịch vẫn trả điểm với value `0`
- Lợi nhuận có thể âm (nhiều hoàn tiền hơn thu), backend trả nguyên giá trị
- Nếu truyền `flow=catching`, chỉ trả `byFlow.catching` và `timeline[].catching`; `totalProfit` = lợi nhuận flow đó
- `WalletTopup` (31), `WalletWithdraw` (32) không tính vào 3 luồng nghiệp vụ này — không đưa vào công thức profit

---

## 6. Transaction Type Reference

Bảng mapping đầy đủ — backend dùng để query đúng nhóm `transactionType`:

| transactionType | Int | Nhãn VI | Luồng | Vai trò trong profit |
|-----------------|-----|---------|-------|---------------------|
| `ConsultationPayment` | 0 | Thanh toán tư vấn | consultation | + Doanh thu |
| `ExpertPayout` | 1 | Chi trả chuyên gia | consultation | − Chi phí |
| `ConsultationRefund` | 2 | Hoàn tiền tư vấn | consultation | − Hoàn tiền |
| `CatchingPayment` | 20 | Thanh toán bắt rắn | catching | + Doanh thu |
| `CatchingDeposit` | 23 | Đặt cọc bắt rắn | catching | + Doanh thu |
| `PlatformFee` | 30 | Phí nền tảng | consultation | Tham khảo cho luồng tư vấn (không dùng trong công thức profit) |
| `WalletTopup` | 31 | Nạp ví | — | Không tính vào profit nghiệp vụ |
| `WalletWithdraw` | 32 | Rút ví | — | Không tính vào profit nghiệp vụ |
| `SnakebiteIncidentPayment` | 40 | Thanh toán sự cố rắn cắn | snakebite | + Doanh thu |

> `PlatformFee` có trong bảng transaction nhưng không cần đưa vào công thức profit — vì profit đã được tính đủ qua `Revenue − Payout − Refund`. Đưa thêm `PlatformFee` vào sẽ bị double-count.

Các transaction type đã bị loại khỏi luồng tiền hệ thống (không còn tồn tại):
`MissionDonation` (10), `RescuerReward` (11), `CatcherPayout` (21), `CatchingRefund` (22), `AdminAdjustment` (33), `SnakebiteIncidentRefund` (41)

---

## 7. Tổng hợp Endpoint List

### Endpoint đề xuất backend cần implement

| Endpoint | Mô tả | Params chính |
|----------|--------|-------------|
| `GET /api/admin/analytics/revenue` | Doanh thu theo kỳ, từng luồng + tổng | `period`, `from`, `to`, `flow?` |
| `GET /api/admin/analytics/commission` | Hoa hồng luồng expert theo kỳ | `period`, `from`, `to` |
| `GET /api/admin/analytics/profit` | Lợi nhuận theo kỳ, từng luồng + tổng | `period`, `from`, `to`, `flow?` |

### Endpoint đã có trong hệ thống (tham khảo)

- `GET /api/transactions` — list giao dịch, filter theo `TransType`, `UserId`, phân trang
- `GET /api/transactions/{id}` — detail 1 giao dịch
- `GET /api/admin/withdrawals` — danh sách rút tiền (admin)
- `GET /api/admin/withdrawals/pending` — hàng đợi pending

---

## 8. Changelog

| Date | Version | Change |
|------|---------|--------|
| 2026-04-05 | 1.0.0 | Initial draft — admin analytics endpoint proposal |
