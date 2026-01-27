# SnakeAid Logo Setup

## Hướng dẫn thêm logo

1. Lưu file logo (ảnh bạn gửi) vào đường dẫn:
   ```
   public/assets/images/logo/snakeaid-logo.png
   ```

2. Logo sẽ tự động hiển thị trên:
   - Sidebar admin (góc trên bên trái)
   - Trang login admin

3. Nếu chưa có logo, hệ thống sẽ tự động fallback sang emoji 🏥

## Các thay đổi đã thực hiện:

### 1. Tạo Admin Sidebar Component
- File: `src/components/admin/AdminSidebar.tsx`
- Component tái sử dụng cho tất cả các trang admin
- Màu sắc: Gradient xanh lá (green-700 → green-900)
- Logo: Tích hợp SnakeAid logo

### 2. Redesign màu sắc theme
**Trước (Blue Theme):**
- Primary: #007BFF (blue)
- Background: #1E3A8A (navy blue)

**Sau (Green Theme):**
- Primary: green-600 (#16a34a)
- Background: gradient green-700 → green-900
- Phù hợp với logo SnakeAid

### 3. Cập nhật giao diện
- Sidebar: Dịu mắt hơn với gradient xanh lá
- Active menu: Background trắng với text xanh
- Hover effects: green-600/30 overlay
- Border: green-600/30 (subtle)
- User profile: Avatar với border xanh lá
- Logout button: Inline trong profile section

### 4. Các trang đã update theme
- ✅ Admin Login Page
- ✅ Admin Dashboard Page
- ✅ AdminSidebar Component (dùng chung)

## Sử dụng AdminSidebar Component

```tsx
import AdminSidebar from '@/components/admin/AdminSidebar';

<AdminSidebar
  activeMenu="dashboard" // ID của menu đang active
  adminEmail="admin@snakeaid.com"
  onLogout={() => handleLogout()}
/>;
```

### Props:
- `activeMenu`: ID menu item đang active ('dashboard', 'users', 'snakes', etc.)
- `adminEmail`: Email của admin đang đăng nhập
- `onLogout`: Callback function khi click logout

### Menu items có sẵn:
- dashboard → /admin
- users → /admin/users
- snakes → /admin/snakes
- hospitals → /admin/hospitals
- finance → /admin/finance
- reports → /admin/reports
- settings → /admin/settings
