# Mô hình Response API và Hành vi Client

Tài liệu này giải thích cách frontend xử lý phản hồi từ API bằng mô hình
`ApiResponse` (`src/types/api-response.ts`) và instance axios được định nghĩa
trong `src/apis/client.ts`.

## 1. ApiResponse Type

```ts
export interface ApiResponse<T> {
  status_code: number;
  message: string;
  is_success: boolean;
  data: T | null;
  error: ClientErrorResponse | null;
}

export interface ClientErrorResponse {
  errorCode: string | null;
  timestamp: string;
  validationErrors: { [key: string]: string[] } | null;
}
```

- **status_code**: HTTP-like status code returned by the server.
- **message**: Human-readable message (success or failure description).
- **is_success**: boolean flag; `true` when the operation succeeded.
- **data**: payload returned on success (or `null` when an error occurred).
- **error**: structured error information when `is_success` is `false`.

The FE always expects the backend to conform to this shape. That means, even
when the server returns a 500/404/429, the body should be wrapped in
`ApiResponse` so the client logic can inspect the `is_success` flag instead of
relying solely on HTTP status codes.

## 2. Axios Client (`src/apis/client.ts`)

Ứng dụng tạo một `axios` instance duy nhất và gắn các interceptor.

### Request interceptor

- Gắn header `Authorization: Bearer <token>` nếu có access token trong storage.

### Response interceptor

Interceptor được chia làm hai phần:

1. **Xử lý thành công**

   ```ts
   (response: AxiosResponse<ApiResponse<unknown>>) => {
     if (!response.data.is_success) {
       return Promise.reject(new ApiClientError(...));
     }
     return response;
   },
   ```

   - Mọi response HTTP 200 vẫn đi qua handler này.
   - Nếu `is_success` là `false` (server trả về thân chứa đối tượng lỗi),
     interceptor sẽ `reject` với `ApiClientError` chứa mã, thông điệp và lỗi.
     Điều này đảm bảo các gọi `api.get/post/...` phía dưới sẽ rơi vào khối
     `catch`.
   - _Không có `if (status === 404)` hay `switch` xử lý từng mã_ vì interceptor
     chỉ chuẩn hoá theo flag `is_success`, bởi backend đã gói tất cả trong
     `ApiResponse`.

2. **Error handler**
   The error handler inspects `error.response` (errors returned by the server),
   `error.request` (no response, network failure), and finally any other
   thrown error.

   - When a server response exists, the interceptor reads `status` and
     `data`:
     ```ts
     const { status, data } = error.response;
     if (status === 401 && !originalRequest._retry) { ... }
     return Promise.reject(new ApiClientError(...));
     ```
   - The only special status code explicitly handled is `401` for token refresh.
     All other codes (`404`, `400`, `429`, `500`, etc.) simply fall through to
     the `ApiClientError` rejection. The request's promise rejects with an
     object containing the `status_code`, message, and optional validation
     errors.
   - The generic `ApiClientError` is raised regardless of the code. The FE can
     inspect `err.statusCode` or `err.error` to determine what to display.

   - If there's no response (e.g. network issue), the interceptor rejects with
     a 0-code `ApiClientError` and a generic network message.

### Các phương thức API chung

Object `api` xuất ra các helper, tự động lấy `response.data.data`:

```ts
api.get<T>(url).then(res => ...)       // trả về T
api.getFullResponse<T>(url)             // trả về ApiResponse<T>
```

Tất cả CRUD method đều theo cùng mẫu; promise sẽ reject khi mạng lỗi hoặc
server báo `is_success: false`.

## 3. FE nên xử lý thế nào với các tình huống trả về khác nhau

### Thành công (HTTP 200, `is_success: true`)

- `api.get/post(...)` trả về dữ liệu có kiểu, nên phía FE có thể viết:
  ```ts
  try {
    const user = await api.get<User>(`/users/${id}`);
    setUser(user);
  } catch (err) {
    // sẽ không vào đây nếu is_success === true
  }
  ```

### Lỗi phía client (HTTP 400, `is_success: false`)

- Ví dụ: lỗi xác thực. Server trả status 400 kèm
  `{ is_success: false, error: { validationErrors: { email: ['invalid'] } } }`.
- Promise sẽ bị reject. Bạn có thể bắt lỗi ở **tầng gọi API (service/hook)** hoặc
  trong component.
  - *Nếu bắt ở service*, convert error thành kiểu riêng rồi ném tiếp;
    component chỉ cần xử lý các loại đã chuẩn hoá (xem `authApi.login` trong
    repo).
  - *Nếu bắt trực tiếp ở component*, khối catch có thể kiểm tra
    `err.error.validationErrors` để hiển thị lỗi form.

### Không tìm thấy (HTTP 404, `is_success: false`)

- Được xử lý giống các lỗi khác. Không có logic riêng trong interceptor.
- Cũng tương tự, bạn có thể catch ở service hoặc component:
  ```ts
  try { ... } catch (err) {
    if (err.statusCode === 404) showNotFound();
  }
  ```

### Giới hạn tần suất (HTTP 429)

- Thân phản hồi vẫn theo `ApiResponse`.
- Interceptor không tự retry; chỉ trả về `ApiClientError` để UI có thể hiển thị
  thông báo "vui lòng chờ".

### Các mã khác (500, 403, v.v.)

- Tất cả đều chuyển thành `ApiClientError`.
- Lý do không có `if`/`else` cho từng mã là vì FE không cần xử lý khác nhau ở
  tầng giao vận; việc xử lý được thực hiện ở chỗ gọi dựa vào `statusCode`
  hoặc nội dung `err.error`.

## 4. Tại sao interceptor không phân nhánh theo mã

- Backend đã thống nhất thành công/thất bại bằng flag `is_success`.
- Việc dùng một `ApiClientError` chung đơn giản hoá API client (`api.get`,
  v.v.) bằng cách đảm bảo hoặc trả dữ liệu hoặc một `Error` có đủ chi tiết.
- Logic nghiệp vụ nằm trong component/handler, không phải tầng HTTP. Chỉ
  có trường hợp `401` cần xử lý đặc biệt; còn lại đều chung.

---

### Ví dụ sử dụng trong UI

```ts
try {
  const list = await api.get<MyItem[]>('/items');
  setItems(list);
} catch (err) {
  if (err instanceof ApiClientError) {
    switch (err.statusCode) {
      case 404:
        showNotFound();
        break;
      case 429:
        showRateLimitNotice();
        break;
      default:
        showToast(err.message);
    }
  } else {
    showToast('Lỗi không mong đợi');
  }
}
```

Các component cũng có thể gọi `api.getFullResponse` khi cần metadata thô.

---

Mẫu này giữ cho tầng giao vận mỏng, dễ dự đoán và dễ mock trong test;
nhà phát triển chỉ cần diễn giải `ApiClientError` ở nơi gọi.
