# Hướng dẫn thêm Logo SnakeAid

## Bước 1: Lưu file logo

Lưu file `SnakeAidLogo.png` vào đường dẫn:

```
C:\uni\ki9\SnakeAid.Frontend\public\assets\images\logo\snakeaid-logo.png
```

## Bước 2: Copy bằng PowerShell

Mở PowerShell tại thư mục project và chạy:

```powershell
# Thay đổi đường dẫn nguồn nếu file ở vị trí khác
Copy-Item -Path "C:\Users\ADMIN\Downloads\SnakeAidLogo.png" -Destination "public\assets\images\logo\snakeaid-logo.png" -Force
```

## Bước 3: Kiểm tra

Logo sẽ hiển thị tự động ở:
- Sidebar admin (góc trên trái)
- Trang login admin

Nếu file không tìm thấy, hệ thống sẽ fallback sang icon mặc định.

## Thư mục đã tạo:

```
public/
  assets/
    images/
      logo/
        snakeaid-logo.png  <- Thêm file vào đây
```
