# Snakebite Incident - Hospital Handover (FE Implementation Guide)

## Overview

Khi operator đã thử tìm rescuer on-duty/off-duty nhưng không có ai của trung tâm nhận ca, FE cần cho operator xác nhận chuyển tuyến sang bệnh viện gần nhất.

Backend hiện dùng status `NoRescuerFound` để biểu diễn case này (temporary mapping cho nghiệp vụ handover).

## Hospital Lookup API (for Operator)

Để hiển thị danh sách bệnh viện gần ca cứu hộ, FE nên gọi endpoint từ `TreatmentFacilityController`:

- `GET /api/treatment-facilities/find-hospital?latitude={lat}&longitude={lng}`

### Nguồn dữ liệu và cách backend trả list

Theo `TreatmentFacilityService.GetNearestActiveTreatmentFacilityAsync(...)`:

1. Chỉ lấy bệnh viện `IsActive = true`.
2. Chỉ lấy bệnh viện nằm trong bán kính tìm kiếm cấu hình hệ thống (`TreatmentFacilitySearchRadiusMeters`, mặc định 30km).
3. Danh sách được sắp xếp theo khoảng cách tăng dần (gần nhất lên trước).
4. Mỗi item có `distanceKm` để FE hiển thị ngay, không cần tự tính.

### Response shape (rút gọn)

```json
[
  {
   "id": 12,
   "name": "Bệnh viện Chợ Rẫy",
   "address": "201B Nguyen Chi Thanh, Q5",
   "contactNumber": "02838554137",
   "latitude": 10.755,
   "longitude": 106.659,
   "distanceKm": 2.8,
   "isActive": true,
   "antivenomIds": [1, 3] // ko cần quan tâm field này trong modal, có thể skip qua ko cần map
  }
]
```

## FE Strategy - Show List or Not?

Nên hiển thị **dạng list ưu tiên theo khoảng cách** (có thể kèm mini-map), vì operator cần thao tác gọi nhanh theo thứ tự gần nhất.

Khuyến nghị UI:

1. Hiển thị list top gần nhất, mỗi item gồm:

- `name`
- `distanceKm`
- `contactNumber`
- `address`

1. Mỗi item có CTA:

- `Gọi`
- `Chọn để chuyển ca`

1. Khi operator chọn 1 bệnh viện, auto-fill form handover:

- `hospitalName` = `name`
- `hospitalPhone` = `contactNumber`

### Khi nào gọi `find-hospital`

Gọi endpoint trong các thời điểm sau:

1. Operator bấm `Mở rộng sang bệnh viện` sau khi thất bại tìm rescuer.
2. Khi mở modal handover (first load).
3. Khi operator bấm `Làm mới danh sách` (nếu cần).

Không cần polling liên tục vì dữ liệu bệnh viện ít thay đổi theo thời gian thực.

### Trường hợp list rỗng

Nếu `find-hospital` trả rỗng:

1. Vẫn cho operator nhập tay `hospitalName` + `hospitalPhone`.
2. Cho phép submit handover bằng dữ liệu nhập tay.
3. Hiển thị cảnh báo mềm: "Không tìm thấy bệnh viện trong bán kính cấu hình. Vui lòng nhập thông tin thủ công."

## When To Use This Endpoint

Sử dụng endpoint handover khi thỏa cả 2 điều kiện:

1. Operator đã thực hiện bước tìm rescuer (on-duty, off-duty) và không thể dispatch thành công.
2. Operator đã liên hệ bệnh viện và xác nhận bệnh viện tiếp nhận xử lý sự cố.

Không dùng endpoint này khi:

- Incident là báo động giả (`FalseAlarm`).
- Đã có mission active (Preparing/EnRoute/RescuerArrived).
- Còn có thể tiếp tục dispatch rescuer nội bộ.

## API Contract

### Endpoint

`POST /api/incidents/{incidentId}/handover-hospital`

### Auth

- Role: `Operator`

### Request Body

```json
{
  "hospitalName": "Bệnh viện Chợ Rẫy",
  "hospitalPhone": "02838554137",
  "note": "Đã gọi tổng đài và xác nhận tiếp nhận ca"
}
```

Fields:

- `hospitalName` (required, max 200)
- `hospitalPhone` (optional, max 50)
- `note` (optional, max 1000)

### Success Response

```json
{
  "statusCode": 200,
  "message": "Incident handed over to hospital.",
  "data": {
    "id": "<incidentId>",
    "status": "NoRescuerFound"
  }
}
```

## Backend Effects (What FE Should Expect)

Sau khi gọi thành công:

1. Incident status chuyển sang `NoRescuerFound`.
2. `CancellationReason` được set dạng:
   - `Transferred to hospital: {HospitalName} ({HospitalPhone})`
3. `OperatorNotes` được append thêm dòng handover gồm hospital + phone + note.
4. Các dispatch request đang `Pending` sẽ bị cancel bởi operator.

## FE UX Recommendations

1. Chỉ hiện nút `Chuyển tuyến bệnh viện` sau khi đã load và thử pool rescuer.
2. Bắt operator nhập `hospitalName` trước khi submit.
3. Sau thành công:
   - đóng modal tìm rescuer
   - hiển thị badge trạng thái: `Đã chuyển tuyến bệnh viện`
   - disable các action dispatch tiếp theo cho incident đó
4. Nếu cần báo cáo nội bộ, FE có thể đọc `OperatorNotes` để hiển thị lịch sử handover.

### Suggested End-to-End FE Flow

1. Operator thử dispatch on-duty/off-duty nhưng không thành công.
2. FE hiển thị CTA `Tìm bệnh viện gần nhất`.
3. FE gọi `GET /api/treatment-facilities/find-hospital?latitude={incidentLat}&longitude={incidentLng}`.
4. FE render list bệnh viện theo `distanceKm` (gần -> xa).
5. Operator bấm gọi và xác nhận bệnh viện tiếp nhận.
6. FE gọi `POST /api/incidents/{incidentId}/handover-hospital` với bệnh viện đã chọn (hoặc nhập tay).
7. Sau thành công:

- đóng tracking/dispatch actions cho incident
- chuyển trạng thái UI sang `Đã chuyển tuyến bệnh viện`
- chặn các nút dispatch tiếp theo.

## Error Cases

- `400 BadRequest`
  - Không thể handover vì status không hợp lệ
  - Có active mission nên không được handover
- `404 NotFound`
  - Incident không tồn tại
- `409 Conflict`
  - Incident đang do operator khác xử lý hoặc có concurrency conflict

## Notes About Status Mapping

Hiện tại handover đang map vào `NoRescuerFound` để tránh thay đổi quan hệ DB.

Về lâu dài, có thể bổ sung status riêng như `TransferredToHospital` để tách bạch báo cáo vận hành.
