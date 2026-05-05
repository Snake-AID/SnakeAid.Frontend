# SnakeAid – Tài liệu Chính sách & Hướng dẫn Sử dụng (Dữ liệu Mock)

> Tài liệu này tổng hợp toàn bộ nội dung chính sách hiển thị trong app mobile SnakeAid (Member, Rescuer, Expert).
> Dùng làm mock data seed cho tính năng CRUD Chính sách trên Web Admin.

---

## 1. MEMBER (Người dùng thường)

**File:** `lib/features/member/screens/settings_screen.dart`  
**Truy cập:** Hồ sơ → Icon Cài đặt (góc phải) → Settings Screen

### 1.1 Hướng dẫn sử dụng

| # | Tính năng | Mô tả | Các bước |
|---|-----------|-------|----------|
| 1 | **Cấp cứu rắn cắn (SOS)** | Hỗ trợ y tế khẩn cấp cho người bị rắn cắn | • Chỉ hỗ trợ: Tp.HCM, Thủ Đức, Bình Dương, Đồng Nai, Vũng Tàu.<br>• Nhấn nút SOS > Cung cấp hình ảnh/mô tả tình trạng.<br>• Đội ngũ y tế/chuyên gia sẽ liên hệ hoặc đến ngay. |
| 2 | **Yêu cầu bắt rắn** | Gọi chuyên gia đến bắt rắn an toàn tại nhà | • Chỉ hỗ trợ: Tp.HCM, Thủ Đức, Bình Dương, Đồng Nai, Vũng Tàu.<br>• Nhấn "Cần bắt rắn" > Chọn vị trí > Điền thông tin.<br>• Chuyên gia gần nhất sẽ nhận đơn và di chuyển đến. |
| 3 | **Tư vấn khẩn cấp & Tư vấn ngay** | Liên hệ trực tiếp với chuyên gia mọi lúc | • Nhận lời khuyên khi gặp rắn hoặc cần xác định loài.<br>• Hỗ trợ qua gọi điện, nhắn tin trực tiếp. |
| 4 | **Báo cáo cộng đồng** | Chung tay xây dựng bản đồ an toàn | • Đánh dấu vị trí bạn nhìn thấy rắn.<br>• Cảnh báo người dùng khác trong khu vực. |
| 5 | **Thư viện & Sơ cứu** | Kiến thức an toàn thiết yếu | • Tra cứu đặc điểm nhận dạng các loài rắn phổ biến.<br>• Xem hướng dẫn sơ cứu chuẩn y tế khi bị rắn cắn. |
| 6 | **Nạp/Rút tiền** | Quản lý ví SnakeAidPay | • Nạp tiền: Mở "Hồ sơ" > "Nạp tiền" > Chuyển khoản theo cú pháp.<br>• Rút tiền: Mở "Hồ sơ" > "Rút tiền" > Nhập tài khoản > Hệ thống duyệt tự động. |

### 1.2 Chính sách bảo mật

| Mục | Nội dung |
|-----|----------|
| Cam kết chung | SnakeAid cam kết bảo vệ tuyệt đối thông tin cá nhân và dữ liệu vị trí của người dùng. Mọi dữ liệu thu thập chỉ phục vụ cho một mục đích duy nhất: điều phối chuyên gia và đội cứu hộ nhanh nhất có thể. |
| Quyền truy cập vị trí | Thông tin vị trí chỉ được thu thập khi bạn chủ động sử dụng các tính năng liên quan đến bản đồ (như Báo cáo cộng đồng) và các tính năng yêu cầu cứu hộ khẩn cấp (SOS/Bắt rắn). |
| Bảo mật thông tin | Dữ liệu cá nhân của bạn sẽ không bao giờ được chia sẻ cho bất kỳ bên thứ ba nào vì mục đích thương mại hay quảng cáo. |

### 1.3 Chính sách thanh toán

| Mục | Nội dung |
|-----|----------|
| 1. Thanh toán đặt cọc | Dịch vụ Bắt rắn sẽ yêu cầu bạn thanh toán một khoản đặt cọc nhỏ thông qua ví SnakeAidPay trước khi chuyên gia xuất phát. Việc này giúp hạn chế các đơn yêu cầu giả mạo. **Đặc biệt:** Số tiền này sẽ được hoàn trả đầy đủ nếu chuyên gia không đến hoặc đơn bị hủy bởi hệ thống. |
| 2. Phí dịch vụ chuyên gia | Phí dịch vụ được tính tự động dựa trên: mức độ nguy hiểm của loài rắn, thời gian xử lý, quãng đường di chuyển của chuyên gia. |
| 3. Nạp và Rút tiền | Số dư trong ví SnakeAidPay là của bạn. Bạn hoàn toàn có thể rút về tài khoản ngân hàng cá nhân bất kỳ lúc nào với các hạn mức quy định theo từng hạng thành viên. |

### 1.4 Câu hỏi thường gặp (FAQ)

| Câu hỏi | Câu trả lời |
|---------|-------------|
| Làm thế nào để gọi cứu hộ bắt rắn? | Trên màn hình chính, chọn "Cần bắt rắn", sau đó xác nhận vị trí. Chuyên gia gần nhất sẽ nhận đơn và di chuyển đến ngay. |
| Tôi phải làm gì khi bị rắn cắn? | Nhấn nút SOS ngay lập tức. Giữ bình tĩnh, hạn chế vận động vùng bị cắn và làm theo hướng dẫn sơ cứu trong app. |
| Có mất phí nếu không tìm thấy rắn? | Bạn không phải trả phí dịch vụ bắt rắn, tuy nhiên khoản phí đặt cọc nhỏ sẽ được dùng để hỗ trợ chi phí di chuyển cho chuyên gia. |
| Làm cách nào để nạp tiền? | Vào "Hồ sơ" -> chọn "Nạp tiền". Hỗ trợ chuyển khoản ngân hàng và ví điện tử. |
| Hỗ trợ ở những khu vực nào? | TP. Hồ Chí Minh, Thủ Đức, Bình Dương, Đồng Nai và Bà Rịa - Vũng Tàu. |

### 1.5 Liên hệ hỗ trợ

| Kênh | Thông tin |
|------|-----------|
| **Hotline** | 1900 123 456 |
| **Email** | support@snakeaid.vn |
| **Giờ làm việc** | 6:00 - 23:00 (Hàng ngày) |
| **Chat trực tuyến** | Phản hồi trong vòng 5 phút ngay trên ứng dụng. |

---

## 2. RESCUER (Đội cứu hộ)

**File:** `lib/features/rescuer/screens/rescuer_settings_screen.dart`  
**Truy cập:** Settings → "Hỗ trợ"

### 2.1 Hướng dẫn sử dụng

| # | Tên bước | Mô tả | Chi tiết |
|---|----------|-------|----------|
| 1 | **Bắt Đầu Chế Độ Cứu Hộ** | Cách kích hoạt và quản lý chế độ cứu hộ | • Mở ứng dụng SnakeAid Đội Cứu Hộ<br>• Trên màn hình chính, tìm mục "OFFLINE" hoặc "ONLINE"<br>• Nhấp vào nút chuyển đổi để bật chế độ cứu hộ<br>• Ứng dụng sẽ kiểm tra GPS và vị trí của bạn<br>• Nếu GPS sẵn sàng, bạn sẽ chuyển sang "ONLINE"<br>• Khi ONLINE, bạn sẽ nhận yêu cầu cứu hộ từ điều phối viên |
| 2 | **Nhận Và Xác Nhận Yêu Cầu** | Quy trình xử lý các yêu cầu cứu hộ mới | • Khi có yêu cầu mới, ứng dụng sẽ phát cảnh báo âm thanh<br>• Một hộp thoại xuất hiện với thông tin yêu cầu từ điều phối viên<br>• Nhấp "Xem Chi Tiết" để xem đầy đủ thông tin (địa chỉ, mô tả rắn...)<br>• Kiểm tra khoảng cách và tính khả thi<br>• Nhấp "Chấp Nhận" nếu sẵn sàng hoặc "Từ Chối" nếu không thể<br>• Sau khi chấp nhận, sẽ được dẫn đến màn hình theo dõi |
| 3 | **Theo Dõi Vị Trí** | Cách điều hướng đến vị trí yêu cầu | • Sau khi chấp nhận, sẽ thấy bản đồ với vị trí khách hàng<br>• Nhấp "Bắt đầu di chuyển" để điều hướng qua map<br>• Thông tin khách hàng hiển thị ở phần trên<br>• Có thể gọi khách hàng trực tiếp từ ứng dụng<br>• Khi tới nơi, nhấp "Đã Tới Nơi" để cập nhật trạng thái<br>• Duy trì GPS bật để cập nhật vị trí chính xác |
| 4 | **Hoàn Thành Nhiệm Vụ** | Cách kết thúc và báo cáo công việc | • Sau khi xử lý xong (bắt rắn, xác nhận an toàn...)<br>• Nhấp nút "Hoàn Thành" trên màn hình<br>• Điền thông tin chi tiết: loại rắn, địa điểm, mô tả sự cố<br>• Tải lên ảnh/video chứng minh (nếu có)<br>• Thêm ghi chú nếu cần thiết<br>• Nhấp "Xác Nhận" để gửi báo cáo |
| 5 | **Cài Đặt Thông Báo** | Tùy chỉnh cảnh báo và thông báo | • Mở "Cài Đặt" từ tab "Cá Nhân"<br>• Chọn mục "Thông Báo"<br>• Bật "Thông báo đẩy" để nhận cảnh báo yêu cầu mới<br>• Bật "Âm thanh đọc rắn cắn" để nghe cảnh báo SOS<br>• Bật "Âm thanh đọc đơn bắt rắn" để nghe cảnh báo bắt rắn<br>• Bật "Rung" để cảm nhận rung khi có yêu cầu khẩn cấp |

### 2.2 Chính sách bảo mật (Rescuer Privacy)

| Mục | Nội dung |
|-----|----------|
| 1. Thu Thập Vị Trí GPS | Để điều phối cứu hộ hiệu quả, chúng tôi thu thập vị trí chính xác của bạn ngay cả khi ứng dụng đang chạy nền (khi bạn đang ở chế độ ONLINE). |
| 2. Thông Tin Hoạt Động | Lưu lại lịch sử di chuyển trong nhiệm vụ, thời gian phản hồi, và kết quả xử lý để đảm bảo chất lượng dịch vụ và tính minh bạch thu nhập. |
| 3. Chia Sẻ Thông Tin Nhiệm Vụ | Khi bạn chấp nhận nhiệm vụ, tên và số điện thoại của bạn sẽ được chia sẻ với khách hàng (Member) và Điều phối viên (Operator). |
| 4. Bảo Mật Dữ Liệu Cá Nhân | Thông tin định danh (CCCD/ID) và thông tin thanh toán được mã hóa và chỉ sử dụng cho mục đích xác thực và chi trả thu nhập. |
| 5. Quyền Hạn Của Bạn | Bạn có quyền yêu cầu trích xuất dữ liệu hoạt động, chỉnh sửa thông tin hoặc xóa tài khoản bất cứ lúc nào. |

---

## 3. EXPERT (Chuyên gia tư vấn)

**File:** `lib/features/expert/screens/expert_settings_screen.dart`  
**Truy cập:** Settings → "Hỗ Trợ & Tài Liệu"

### 3.1 Hướng dẫn sử dụng

#### 3.1.1 Tư Vấn Ngay (Immediate Consulting)

| # | Bước | Mô tả | Chi tiết |
|---|------|-------|----------|
| 1 | Nhận yêu cầu tư vấn | Bạn sẽ nhận thông báo khi có khách hàng yêu cầu tư vấn ngay | • Thông báo push sẽ được gửi ngay<br>• Bạn có 2 phút để chấp nhận hoặc từ chối<br>• Kiểm tra tiểu sử khách hàng để hiểu rõ nhu cầu |
| 2 | Chấp nhận yêu cầu | Nhấp "Chấp nhận" để xác nhận sẵn sàng tư vấn | • Nút "Chấp nhận" được highlight để dễ thao tác<br>• Sau khi chấp nhận, hệ thống sẽ thiết lập kết nối<br>• Khách hàng sẽ được thông báo bạn đã chấp nhận |
| 3 | Chuẩn bị phiên tư vấn | Kiểm tra thiết bị: camera, microphone, ánh sáng | • Đảm bảo đèn sáng đủ cho khách hàng thấy rõ<br>• Kiểm tra âm thanh - nói thử và nghe kỹ<br>• Đóng các ứng dụng không cần thiết để ổn định kết nối |
| 4 | Bắt đầu phiên video | Nhấp "Bắt đầu tư vấn" để kết nối video với khách hàng | • Chào hỏi khách hàng thân thiện và chuyên nghiệp<br>• Xác nhận bạn đã hiểu rõ vấn đề cần tư vấn<br>• Nếu cần thêm thông tin, hãy hỏi chi tiết |
| 5 | Cung cấp tư vấn | Lắng nghe, đặt câu hỏi, và cung cấp giải pháp chuyên nghiệp | • Dùng kiến thức chuyên môn để giải quyết vấn đề<br>• Giải thích rõ ràng để khách hàng dễ hiểu<br>• Có thể sử dụng hình ảnh hoặc tư liệu nếu cần |
| 6 | Kết thúc và nhận đánh giá | Khi hoàn tất, kết thúc phiên và khách hàng sẽ đánh giá | • Nhấp "Kết thúc tư vấn" khi hoàn tất<br>• Hóa đơn thanh toán sẽ được tạo tự động<br>• Khách hàng sẽ để lại đánh giá và bình luận |

#### 3.1.2 Tư Vấn Đặt Lịch (Scheduled Consulting)

| # | Bước | Mô tả | Chi tiết |
|---|------|-------|----------|
| 1 | Cài đặt lịch khả dụng | Vào "Cài đặt lịch làm việc" để chọn khung giờ tư vấn | • Chọn các ngày trong tuần bạn sẵn sàng<br>• Đặt khung giờ làm việc (ví dụ: 9:00 - 18:00)<br>• Lưu thay đổi để cập nhật lịch |
| 2 | Khách hàng đặt lịch | Khách hàng xem lịch và chọn thời gian phù hợp | • Họ chỉ chọn được trong các khung giờ bạn cài đặt<br>• Họ cung cấp thông tin chi tiết về vấn đề<br>• Bạn sẽ nhận thông báo về đơn đặt lịch |
| 3 | Xem xét và phê duyệt | Kiểm tra thông tin và xác nhận có thể tư vấn | • Xem chi tiết vấn đề khách hàng muốn tư vấn<br>• Kiểm tra lịch để đảm bảo sẵn sàng<br>• Nhấp "Vào phòng" hoặc "Từ chối" tùy tình hình |
| 4 | Chuẩn bị cho cuộc hẹn | Trước 15 phút, chuẩn bị thiết bị | • Kiểm tra camera, microphone, ánh sáng<br>• Chuẩn bị tài liệu hoặc hình ảnh nếu cần<br>• Đảm bảo kết nối internet ổn định |
| 5 | Tham gia cuộc họp video | Khi đến giờ, nhấp "Tham gia cuộc hẹn" | • Chào hỏi khách hàng chuyên nghiệp<br>• Xác nhận lại vấn đề cần tư vấn<br>• Bắt đầu tư vấn sau khi làm quen |
| 6 | Hoàn tất tư vấn | Sau khi tư vấn xong, kết thúc phiên và nhận thanh toán | • Tóm tắt những điểm chính đã tư vấn<br>• Cung cấp thông tin liên hệ nếu cần<br>• Nhấp "Kết thúc" để hoàn tất cuộc hẹn |

#### 3.1.3 Hướng dẫn rút tiền (Withdrawal Guide)

| # | Bước | Mô tả | Chi tiết |
|---|------|-------|----------|
| 1 | Truy cập Quản lý thu nhập | Mở tab "Cá nhân" và chọn mục "Quản lý thu nhập" | • Bạn sẽ thấy số dư khả dụng trong ví SnakeAidPay<br>• Kiểm tra lịch sử các phiên tư vấn đã được quyết toán |
| 2 | Chọn Rút tiền | Nhấn vào nút "Rút tiền" trên màn hình quản lý | • Nhập số tiền muốn rút (tối thiểu 50,000đ)<br>• Đảm bảo số dư trong ví đủ để thực hiện lệnh |
| 3 | Nhập thông tin ngân hàng | Cung cấp thông tin tài khoản nhận tiền chính xác | • Chọn ngân hàng từ danh sách hỗ trợ<br>• Nhập số tài khoản và tên chủ tài khoản (viết hoa không dấu) |
| 4 | Xác nhận và chờ xử lý | Kiểm tra lại thông tin và xác nhận lệnh rút tiền | • Lệnh sẽ được gửi tới bộ phận kế toán<br>• Tiền sẽ được chuyển vào tài khoản trong vòng 1-3 ngày làm việc |

### 3.2 Chính sách bảo mật (Expert)

| Mục | Nội dung |
|-----|----------|
| 1. Giới Thiệu | SnakeAid cam kết bảo vệ quyền riêng tư của bạn. Chính sách này giải thích cách thu thập, sử dụng, công khai và bảo vệ thông tin khi sử dụng nền tảng. |
| 2. Thông Tin Thu Thập | (a) Thông tin cá nhân: Tên, email, SĐT, địa chỉ; (b) Thông tin chuyên nghiệp: Bằng cấp, chứng chỉ, kinh nghiệm; (c) Thông tin thanh toán: Tài khoản ngân hàng, lịch sử giao dịch; (d) Dữ liệu hoạt động: Phiên tư vấn, thời gian sử dụng; (e) Dữ liệu kỹ thuật: IP, loại thiết bị, cookie. |
| 3. Cách Sử Dụng Thông Tin | (a) Cung cấp và cải thiện Dịch vụ; (b) Xử lý thanh toán; (c) Liên lạc về cập nhật; (d) Tuân thủ pháp lý; (e) Ngăn chặn gian lận; (f) Phân tích hiệu suất. |
| 4. Chia Sẻ Thông Tin | Không bán hoặc chia sẻ thông tin với bên thứ ba, ngoại trừ: nhà cung cấp dịch vụ đáng tin cậy, yêu cầu pháp luật, hoặc với sự đồng ý của bạn. |
| 5. Bảo Vệ Dữ Liệu | Sử dụng mã hóa SSL/TLS. Mật khẩu được mã hóa một chiều. Giới hạn quyền truy cập nội bộ. |
| 6. Quyền Của Bạn | Quyền Truy cập, Sửa đổi, Xóa, Phản đối, và Rút lại sự đồng ý. |
| 7. Thời Gian Lưu Trữ | Lưu trữ trong thời gian cần thiết. Thông tin thanh toán giữ 7 năm để tuân thủ thuế. |
| 8. Cookies | Dùng để nhớ sở thích, theo dõi hoạt động, cá nhân hóa. Có thể vô hiệu hóa trong trình duyệt. |
| 9. Liên Lạc Tiếp Thị | Có thể nhận email về tính năng mới. Có thể hủy đăng ký bất kỳ lúc nào. |
| 10. Khiếu Nại | Email: privacy@snakeaid.com |
| 11. Thay Đổi Chính Sách | Sẽ thông báo qua email hoặc trong ứng dụng. |

### 3.3 Điều khoản & Điều kiện (Expert Terms)

| Mục | Nội dung |
|-----|----------|
| 1. Giới Thiệu | Điều khoản điều chỉnh việc sử dụng nền tảng SnakeAid với tư cách chuyên gia. Bằng cách đăng ký, bạn đồng ý tuân thủ. |
| 2. Tư Cách Đủ Điều Kiện | Đủ 18 tuổi, có pháp lý đầy đủ, không bị cấm cung cấp dịch vụ, cung cấp thông tin chính xác, có chuyên môn thích hợp. |
| 3. Nghĩa Vụ Chuyên Gia | Cung cấp tư vấn chính xác, chuyên nghiệp; tuân thủ pháp luật; không phân biệt đối xử; bảo mật thông tin khách hàng. |
| 4. Giá Dịch Vụ | Bạn tự thiết lập giá. Nền tảng thu phí hoa hồng **20%** mỗi giao dịch. Thay đổi giá có hiệu lực trong 24 giờ. |
| 5. Thanh Toán | Tiền vào ví SnakeAidPay ngay sau phiên tư vấn. Rút tiền bất kỳ lúc nào, miễn phí, xử lý trong 1-3 ngày làm việc. |
| 6. Hủy / Không Tham Gia | "No-show" = mất thu nhập phiên đó, khách hàng được hoàn tiền. Nhiều No-show có thể bị tạm ngừng tài khoản. |
| 7. Giới Hạn Trách Nhiệm | Nền tảng không chịu trách nhiệm về kết luận tư vấn, hành động của khách hàng, tranh chấp, hoặc mất mát gián tiếp. |
| 8. Chấm Dứt | Tài khoản có thể bị chấm dứt nếu vi phạm điều khoản, hành vi không chuyên nghiệp, nhiều khiếu nại, hoặc gây hại danh tiếng nền tảng. |
| 9. Sửa Đổi Điều Khoản | Thông báo qua email hoặc trong ứng dụng. Tiếp tục sử dụng = chấp nhận điều khoản mới. |
| 10. Liên Hệ | Email: support@snakeaid.com | Hotline: 1900 XXXX |

### 3.4 Chính sách thanh toán (Expert Payment)

| Mục | Nội dung |
|-----|----------|
| 1. Ghi Nhận Thu Nhập | Thu nhập được cộng vào ví SnakeAidPay ngay sau khi phiên tư vấn kết thúc. Phí hoa hồng hệ thống là 20%. |
| 2. Quy Trình Rút Tiền | Chuyên gia có thể rút tiền về ngân hàng bất kỳ lúc nào. Thông tin ngân hàng phải trùng khớp với thông tin định danh. |
| 3. Thời Gian Xử Lý | Xử lý trong vòng 1 đến 3 ngày làm việc (không tính Thứ 7, Chủ nhật và ngày lễ). |
| 4. Phí Rút Tiền | Miễn phí hoàn toàn các giao dịch rút tiền cho chuyên gia từ phía SnakeAid. |
| 5. Bảo Mật Giao Dịch | Mọi giao dịch yêu cầu xác thực OTP hoặc mã PIN để đảm bảo an toàn. |

---

## 4. Hướng dẫn CRUD cho Web Admin

### Cấu trúc data đề xuất

```json
{
  "policies": [
    {
      "id": "member-user-guide",
      "role": "MEMBER",
      "type": "USER_GUIDE",
      "title": "Hướng dẫn sử dụng",
      "version": "1.0.0",
      "lastUpdated": "2025-01-01",
      "sections": [
        {
          "id": "sos-feature",
          "order": 1,
          "icon": "sos",
          "iconColor": "#E53935",
          "title": "Cấp cứu rắn cắn (SOS)",
          "description": "Hỗ trợ y tế khẩn cấp cho người bị rắn cắn.",
          "bulletPoints": [
            "Chỉ hỗ trợ khu vực: Tp.HCM, Thủ Đức, Bình Dương, Đồng Nai, Vũng Tàu.",
            "Nhấn nút SOS > Cung cấp hình ảnh/mô tả tình trạng.",
            "Đội ngũ y tế / chuyên gia sẽ liên hệ hoặc đến hỗ trợ ngay lập tức."
          ]
        }
      ]
    },
    {
      "id": "member-privacy-policy",
      "role": "MEMBER",
      "type": "PRIVACY_POLICY",
      "title": "Chính sách bảo mật",
      "sections": [...]
    },
    {
      "id": "member-payment-policy",
      "role": "MEMBER",
      "type": "PAYMENT_POLICY",
      "title": "Chính sách thanh toán",
      "sections": [...]
    },
    {
      "id": "member-faq",
      "role": "MEMBER",
      "type": "FAQ",
      "title": "Câu hỏi thường gặp",
      "sections": [...]
    },
    {
      "id": "member-contact-support",
      "role": "MEMBER",
      "type": "CONTACT_SUPPORT",
      "title": "Liên hệ hỗ trợ",
      "sections": [...]
    },
    {
      "id": "rescuer-user-guide",
      "role": "RESCUER",
      "type": "USER_GUIDE",
      "title": "Hướng dẫn sử dụng",
      "sections": [...]
    },
    {
      "id": "rescuer-privacy-policy",
      "role": "RESCUER",
      "type": "PRIVACY_POLICY",
      "title": "Chính sách bảo mật",
      "sections": [...]
    },
    {
      "id": "expert-user-guide",
      "role": "EXPERT",
      "type": "USER_GUIDE",
      "title": "Hướng dẫn sử dụng",
      "sections": [...]
    },
    {
      "id": "expert-privacy-policy",
      "role": "EXPERT",
      "type": "PRIVACY_POLICY",
      "sections": [...]
    },
    {
      "id": "expert-terms",
      "role": "EXPERT",
      "type": "TERMS",
      "title": "Điều khoản & Điều kiện",
      "sections": [...]
    },
    {
      "id": "expert-payment-policy",
      "role": "EXPERT",
      "type": "PAYMENT_POLICY",
      "title": "Chính sách thanh toán",
      "sections": [...]
    }
  ]
}
```

### Các loại chính sách (type)

| Type | Dành cho | Mô tả |
|------|----------|-------|
| `USER_GUIDE` | Member, Rescuer, Expert | Hướng dẫn sử dụng tính năng |
| `PRIVACY_POLICY` | Member, Rescuer, Expert | Chính sách bảo mật dữ liệu |
| `PAYMENT_POLICY` | Member, Expert | Quy định nạp/rút/đặt cọc |
| `TERMS` | Expert | Điều khoản & Điều kiện sử dụng dịch vụ |

### Các tính năng CRUD cần implement trên Web Admin

- [ ] **List** tất cả chính sách theo role (filter: MEMBER / RESCUER / EXPERT)
- [ ] **View** chi tiết từng chính sách
- [ ] **Edit** nội dung từng mục (section)
- [ ] **Add** section mới vào một chính sách
- [ ] **Remove** section khỏi chính sách
- [ ] **Reorder** thứ tự section (drag-and-drop)
- [ ] **Publish / Unpublish** một chính sách
- [ ] **Version history** theo dõi thay đổi


> [!IMPORTANT]
> Nội dung chính xác trên mobile đã được tổng hợp đầy đủ trong tài liệu này. Khi seed mock data lên web, hãy copy nguyên văn từ các bảng trên để đảm bảo đồng nhất.
