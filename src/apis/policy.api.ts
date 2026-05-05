import type { Policy, PolicyRole, PolicyType, UpsertPolicyRequest } from '@/types/policy.type';

// Full mock data based on docs/snakeaid_policies_docs.md
const MOCK_POLICIES: Policy[] = [
  // MEMBER
  {
    id: 'member-user-guide',
    role: 'MEMBER',
    type: 'USER_GUIDE',
    title: 'Hướng dẫn sử dụng',
    version: '1.0.0',
    lastUpdated: '2026-01-01',
    isPublished: true,
    sections: [
      { id: 'm-ug-1', order: 1, title: 'Cấp cứu rắn cắn (SOS)', description: 'Hỗ trợ y tế khẩn cấp cho người bị rắn cắn', bulletPoints: ['Chỉ hỗ trợ: Tp.HCM, Thủ Đức, Bình Dương, Đồng Nai, Vũng Tàu.', 'Nhấn nút SOS > Cung cấp hình ảnh/mô tả tình trạng.', 'Đội ngũ y tế/chuyên gia sẽ liên hệ hoặc đến ngay.'] },
      { id: 'm-ug-2', order: 2, title: 'Yêu cầu bắt rắn', description: 'Gọi chuyên gia đến bắt rắn an toàn tại nhà', bulletPoints: ['Chỉ hỗ trợ: Tp.HCM, Thủ Đức, Bình Dương, Đồng Nai, Vũng Tàu.', 'Nhấn "Cần bắt rắn" > Chọn vị trí > Điền thông tin.', 'Chuyên gia gần nhất sẽ nhận đơn và di chuyển đến.'] },
      { id: 'm-ug-3', order: 3, title: 'Tư vấn khẩn cấp & Tư vấn ngay', description: 'Liên hệ trực tiếp với chuyên gia mọi lúc', bulletPoints: ['Nhận lời khuyên khi gặp rắn hoặc cần xác định loài.', 'Hỗ trợ qua gọi điện, nhắn tin trực tiếp.'] },
      { id: 'm-ug-4', order: 4, title: 'Báo cáo cộng đồng', description: 'Chung tay xây dựng bản đồ an toàn', bulletPoints: ['Đánh dấu vị trí bạn nhìn thấy rắn.', 'Cảnh báo người dùng khác trong khu vực.'] },
      { id: 'm-ug-5', order: 5, title: 'Thư viện & Sơ cứu', description: 'Kiến thức an toàn thiết yếu', bulletPoints: ['Tra cứu đặc điểm nhận dạng các loài rắn phổ biến.', 'Xem hướng dẫn sơ cứu chuẩn y tế khi bị rắn cắn.'] },
      { id: 'm-ug-6', order: 6, title: 'Nạp/Rút tiền', description: 'Quản lý ví SnakeAidPay', bulletPoints: ['Nạp tiền: Mở "Hồ sơ" > "Nạp tiền" > Chuyển khoản theo cú pháp.', 'Rút tiền: Mở "Hồ sơ" > "Rút tiền" > Nhập tài khoản > Hệ thống duyệt tự động.'] },
    ],
  },
  {
    id: 'member-privacy-policy',
    role: 'MEMBER',
    type: 'PRIVACY_POLICY',
    title: 'Chính sách bảo mật',
    version: '1.0.0',
    lastUpdated: '2026-01-01',
    isPublished: true,
    sections: [
      { id: 'm-pp-1', order: 1, title: 'Cam kết chung', content: 'SnakeAid cam kết bảo vệ tuyệt đối thông tin cá nhân và dữ liệu vị trí của người dùng. Mọi dữ liệu thu thập chỉ phục vụ cho một mục đích duy nhất: điều phối chuyên gia và đội cứu hộ nhanh nhất có thể.' },
      { id: 'm-pp-2', order: 2, title: 'Quyền truy cập vị trí', content: 'Thông tin vị trí chỉ được thu thập khi bạn chủ động sử dụng các tính năng liên quan đến bản đồ (như Báo cáo cộng đồng) và các tính năng yêu cầu cứu hộ khẩn cấp (SOS/Bắt rắn).' },
      { id: 'm-pp-3', order: 3, title: 'Bảo mật thông tin', content: 'Dữ liệu cá nhân của bạn sẽ không bao giờ được chia sẻ cho bất kỳ bên thứ ba nào vì mục đích thương mại hay quảng cáo.' },
    ],
  },
  {
    id: 'member-payment-policy',
    role: 'MEMBER',
    type: 'PAYMENT_POLICY',
    title: 'Chính sách thanh toán',
    version: '1.0.0',
    lastUpdated: '2026-01-01',
    isPublished: true,
    sections: [
      { id: 'm-pay-1', order: 1, title: 'Thanh toán đặt cọc', content: 'Dịch vụ Bắt rắn sẽ yêu cầu bạn thanh toán một khoản đặt cọc nhỏ thông qua ví SnakeAidPay trước khi chuyên gia xuất phát. Số tiền này sẽ được hoàn trả đầy đủ nếu chuyên gia không đến hoặc đơn bị hủy bởi hệ thống.' },
      { id: 'm-pay-2', order: 2, title: 'Phí dịch vụ chuyên gia', content: 'Phí dịch vụ cuối cùng được tính toán tự động dựa trên giá của chuyên gia đưa ra.' },
      { id: 'm-pay-3', order: 3, title: 'Nạp và Rút tiền', content: 'Số dư trong ví SnakeAidPay là của bạn. Bạn hoàn toàn có thể rút về tài khoản ngân hàng cá nhân bất kỳ lúc nào với các hạn mức quy định theo từng hạng thành viên.' },
    ],
  },
  {
    id: 'member-faq',
    role: 'MEMBER',
    type: 'FAQ',
    title: 'Câu hỏi thường gặp (FAQ)',
    version: '1.0.0',
    lastUpdated: '2026-01-01',
    isPublished: true,
    sections: [
      { id: 'm-faq-1', order: 1, title: 'Làm thế nào để gọi cứu hộ bắt rắn?', content: 'Trên màn hình chính, chọn "Cần bắt rắn", sau đó xác nhận vị trí. Chuyên gia gần nhất sẽ nhận đơn và di chuyển đến ngay.' },
      { id: 'm-faq-2', order: 2, title: 'Tôi phải làm gì khi bị rắn cắn?', content: 'Nhấn nút SOS ngay lập tức. Giữ bình tĩnh, hạn chế vận động vùng bị cắn và làm theo hướng dẫn sơ cứu trong app.' },
      { id: 'm-faq-3', order: 3, title: 'Có mất phí nếu không tìm thấy rắn?', content: 'Bạn không phải trả phí dịch vụ bắt rắn, tuy nhiên khoản phí đặt cọc nhỏ sẽ được dùng để hỗ trợ chi phí di chuyển cho chuyên gia.' },
      { id: 'm-faq-4', order: 4, title: 'Làm cách nào để nạp tiền?', content: 'Vào "Hồ sơ" -> chọn "Nạp tiền". Hỗ trợ chuyển khoản ngân hàng và ví điện tử.' },
      { id: 'm-faq-5', order: 5, title: 'Hỗ trợ ở những khu vực nào?', content: 'TP. Hồ Chí Minh, Thủ Đức, Bình Dương, Đồng Nai và Bà Rịa - Vũng Tàu.' },
    ],
  },
  {
    id: 'member-contact-support',
    role: 'MEMBER',
    type: 'CONTACT_SUPPORT',
    title: 'Liên hệ hỗ trợ',
    version: '1.0.0',
    lastUpdated: '2026-01-01',
    isPublished: true,
    sections: [
      { id: 'm-cs-1', order: 1, title: 'Hotline', content: '1900 123 456' },
      { id: 'm-cs-2', order: 2, title: 'Email', content: 'support@snakeaid.vn' },
      { id: 'm-cs-3', order: 3, title: 'Giờ làm việc', content: '6:00 - 23:00 (Hàng ngày)' },
      { id: 'm-cs-4', order: 4, title: 'Chat trực tuyến', content: 'Phản hồi trong vòng 5 phút ngay trên ứng dụng.' },
    ],
  },
  // RESCUER
  {
    id: 'rescuer-user-guide',
    role: 'RESCUER',
    type: 'USER_GUIDE',
    title: 'Hướng dẫn sử dụng',
    version: '1.0.0',
    lastUpdated: '2026-01-01',
    isPublished: true,
    sections: [
      { id: 'r-ug-1', order: 1, title: 'Bắt Đầu Chế Độ Cứu Hộ', description: 'Cách kích hoạt và quản lý chế độ cứu hộ', bulletPoints: ['Mở ứng dụng SnakeAid Đội Cứu Hộ', 'Trên màn hình chính, tìm mục "OFFLINE" hoặc "ONLINE"', 'Nhấp vào nút chuyển đổi để bật chế độ cứu hộ', 'Ứng dụng sẽ kiểm tra GPS và vị trí của bạn', 'Nếu GPS sẵn sàng, bạn sẽ chuyển sang "ONLINE"', 'Khi ONLINE, bạn sẽ nhận yêu cầu cứu hộ từ điều phối viên'] },
      { id: 'r-ug-2', order: 2, title: 'Nhận Và Xác Nhận Yêu Cầu', description: 'Quy trình xử lý các yêu cầu cứu hộ mới', bulletPoints: ['Khi có yêu cầu mới, ứng dụng sẽ phát cảnh báo âm thanh', 'Hộp thoại xuất hiện với thông tin yêu cầu từ điều phối viên', 'Nhấp "Xem Chi Tiết" để xem địa chỉ, mô tả rắn...', 'Kiểm tra khoảng cách và tính khả thi', 'Nhấp "Chấp Nhận" hoặc "Từ Chối"'] },
      { id: 'r-ug-3', order: 3, title: 'Theo Dõi Vị Trí', description: 'Cách điều hướng đến vị trí yêu cầu', bulletPoints: ['Sau khi chấp nhận, sẽ thấy bản đồ với vị trí khách hàng', 'Nhấp "Bắt đầu di chuyển" để điều hướng qua map', 'Khi tới nơi, nhấp "Đã Tới Nơi" để cập nhật trạng thái'] },
      { id: 'r-ug-4', order: 4, title: 'Hoàn Thành Nhiệm Vụ', description: 'Cách kết thúc và báo cáo công việc', bulletPoints: ['Sau khi xử lý xong, nhấp nút "Hoàn Thành"', 'Điền thông tin chi tiết: loại rắn, địa điểm, mô tả...', 'Tải lên ảnh/video chứng minh (nếu có)', 'Nhấp "Xác Nhận" để gửi báo cáo'] },
      { id: 'r-ug-5', order: 5, title: 'Cài Đặt Thông Báo', description: 'Tùy chỉnh cảnh báo và thông báo', bulletPoints: ['Mở "Cài Đặt" từ tab "Cá Nhân" > "Thông Báo"', 'Bật "Thông báo đẩy" để nhận cảnh báo yêu cầu mới', 'Bật "Âm thanh đọc rắn cắn/đơn bắt rắn"', 'Bật "Rung" để cảm nhận rung khi có yêu cầu khẩn cấp'] },
    ],
  },
  {
    id: 'rescuer-privacy-policy',
    role: 'RESCUER',
    type: 'PRIVACY_POLICY',
    title: 'Chính sách bảo mật',
    version: '1.0.0',
    lastUpdated: '2026-01-01',
    isPublished: true,
    sections: [
      { id: 'r-pp-1', order: 1, title: '1. Thu Thập Vị Trí GPS', content: 'Để điều phối cứu hộ hiệu quả, chúng tôi thu thập vị trí chính xác của bạn ngay cả khi ứng dụng đang chạy nền (khi bạn đang ở chế độ ONLINE).' },
      { id: 'r-pp-2', order: 2, title: '2. Thông Tin Hoạt Động', content: 'Lưu lại lịch sử di chuyển trong nhiệm vụ, thời gian phản hồi, và kết quả xử lý để đảm bảo chất lượng dịch vụ.' },
      { id: 'r-pp-3', order: 3, title: '3. Chia Sẻ Thông Tin Nhiệm Vụ', content: 'Khi bạn chấp nhận nhiệm vụ, tên và số điện thoại của bạn sẽ được chia sẻ với khách hàng (Member) và Điều phối viên (Operator).' },
      { id: 'r-pp-4', order: 4, title: '4. Bảo Mật Dữ Liệu Cá Nhân', content: 'Thông tin định danh (CCCD/ID) và thông tin thanh toán được mã hóa và chỉ sử dụng cho mục đích xác thực và chi trả thu nhập.' },
      { id: 'r-pp-5', order: 5, title: '5. Quyền Hạn Của Bạn', content: 'Bạn có quyền yêu cầu trích xuất dữ liệu hoạt động, chỉnh sửa thông tin hoặc xóa tài khoản bất cứ lúc nào.' },
    ],
  },
  // EXPERT
  {
    id: 'expert-user-guide',
    role: 'EXPERT',
    type: 'USER_GUIDE',
    title: 'Hướng dẫn sử dụng',
    version: '1.0.0',
    lastUpdated: '2026-01-01',
    isPublished: true,
    sections: [
      { id: 'e-ug-1', order: 1, title: 'Tư Vấn Ngay', description: 'Quy trình nhận và thực hiện tư vấn khẩn cấp', bulletPoints: ['Nhận yêu cầu: Thông báo push gửi ngay, có 2 phút để phản hồi.', 'Chấp nhận: Hệ thống thiết lập kết nối video.', 'Cung cấp tư vấn: Lắng nghe, đặt câu hỏi và giải quyết vấn đề.', 'Kết thúc: Khách hàng đánh giá và hóa đơn tự động tạo.'] },
      { id: 'e-ug-2', order: 2, title: 'Tư Vấn Đặt Lịch', description: 'Quy trình làm việc theo lịch hẹn', bulletPoints: ['Cài đặt lịch: Chọn khung giờ khả dụng (ví dụ 9h-18h).', 'Phê duyệt đơn: Xem xét thông tin khách hàng và "Vào phòng".', 'Chuẩn bị: Kiểm tra thiết bị trước 15 phút.', 'Thực hiện: Tham gia cuộc gọi video và hoàn tất tư vấn.'] },
      { id: 'e-ug-3', order: 3, title: 'Hướng dẫn rút tiền', description: 'Quản lý thu nhập từ SnakeAidPay', bulletPoints: ['Vào tab "Cá nhân" > "Quản lý thu nhập".', 'Nhấn "Rút tiền" (tối thiểu 50.000đ).', 'Nhập thông tin ngân hàng chính xác.', 'Xác nhận và chờ xử lý (1-3 ngày làm việc).'] },
    ],
  },
  {
    id: 'expert-privacy-policy',
    role: 'EXPERT',
    type: 'PRIVACY_POLICY',
    title: 'Chính sách bảo mật',
    version: '1.0.0',
    lastUpdated: '2026-01-01',
    isPublished: true,
    sections: [
      { id: 'e-pp-1', order: 1, title: '1. Giới Thiệu', content: 'SnakeAid cam kết bảo vệ quyền riêng tư. Chính sách này giải thích cách thu thập và bảo vệ thông tin khi sử dụng nền tảng.' },
      { id: 'e-pp-2', order: 2, title: '2. Thông Tin Thu Thập', content: '(a) Cá nhân: Tên, email, SĐT; (b) Chuyên nghiệp: Bằng cấp, chứng chỉ; (c) Thanh toán: Tài khoản ngân hàng; (d) Kỹ thuật: IP, thiết bị.' },
      { id: 'e-pp-3', order: 3, title: '3. Cách Sử Dụng', content: 'Cung cấp dịch vụ, xử lý thanh toán, liên lạc cập nhật, tuân thủ pháp lý và ngăn chặn gian lận.' },
      { id: 'e-pp-4', order: 4, title: '4. Chia Sẻ Thông Tin', content: 'Không bán thông tin. Chỉ chia sẻ với nhà cung cấp dịch vụ tin cậy hoặc theo yêu cầu pháp luật.' },
      { id: 'e-pp-5', order: 5, title: '5. Bảo Vệ Dữ Liệu', content: 'Sử dụng mã hóa SSL/TLS. Giới hạn quyền truy cập nội bộ.' },
    ],
  },
  {
    id: 'expert-terms',
    role: 'EXPERT',
    type: 'TERMS',
    title: 'Điều khoản & Điều kiện',
    version: '1.0.0',
    lastUpdated: '2025-01-01',
    isPublished: true,
    sections: [
      { id: 'e-t-1', order: 1, title: '1. Tư Cách Đủ Điều Kiện', content: 'Đủ 18 tuổi, có năng lực pháp lý, cung cấp thông tin chính xác và có chuyên môn phù hợp.' },
      { id: 'e-t-2', order: 2, title: '2. Nghĩa Vụ Chuyên Gia', content: 'Tư vấn chính xác, chuyên nghiệp; bảo mật thông tin khách hàng; không phân biệt đối xử.' },
      { id: 'e-t-3', order: 3, title: '3. Giá Dịch Vụ & Phí', content: 'Bạn tự thiết lập giá. Hệ thống thu phí hoa hồng 20% mỗi giao dịch.' },
      { id: 'e-t-4', order: 4, title: '4. Hủy / Không Tham Gia', content: '"No-show" dẫn đến mất thu nhập và khách hàng được hoàn tiền. Vi phạm nhiều lần có thể bị khóa tài khoản.' },
      { id: 'e-t-5', order: 5, title: '5. Giới Hạn Trách Nhiệm', content: 'Nền tảng không chịu trách nhiệm về kết luận tư vấn hoặc hành động của khách hàng sau tư vấn.' },
    ],
  },
  {
    id: 'expert-payment-policy',
    role: 'EXPERT',
    type: 'PAYMENT_POLICY',
    title: 'Chính sách thanh toán',
    version: '1.0.0',
    lastUpdated: '2025-01-01',
    isPublished: true,
    sections: [
      { id: 'e-pay-1', order: 1, title: '1. Ghi Nhận Thu Nhập', content: 'Thu nhập được cộng vào ví ngay sau khi phiên tư vấn kết thúc. Phí hệ thống là 20%.' },
      { id: 'e-pay-2', order: 2, title: '2. Quy Trình Rút Tiền', content: 'Chuyên gia rút tiền về ngân hàng bất kỳ lúc nào. Thông tin phải trùng khớp định danh.' },
      { id: 'e-pay-3', order: 3, title: '3. Thời Gian Xử Lý', content: 'Xử lý trong vòng 1-3 ngày làm việc (trừ T7, CN và lễ).' },
      { id: 'e-pay-4', order: 4, title: '4. Phí Rút Tiền', content: 'SnakeAid miễn phí hoàn toàn các giao dịch rút tiền cho chuyên gia.' },
      { id: 'e-pay-5', order: 5, title: '5. Bảo Mật Giao Dịch', content: 'Yêu cầu xác thực OTP hoặc mã PIN để đảm bảo an toàn.' },
    ],
  },
];

class PolicyApi {
  async getAll(): Promise<Policy[]> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 500));
    return MOCK_POLICIES;
  }

  async getById(id: string): Promise<Policy> {
    await new Promise(resolve => setTimeout(resolve, 300));
    const policy = MOCK_POLICIES.find(p => p.id === id);
    if (!policy) {
      throw new Error('Policy not found');
    }
    return policy;
  }

  async upsert(id: string, role: PolicyRole, type: PolicyType, data: UpsertPolicyRequest): Promise<Policy> {
    await new Promise(resolve => setTimeout(resolve, 800));
    const index = MOCK_POLICIES.findIndex(p => p.id === id);
    const updatedPolicy: Policy = {
      id,
      role,
      type,
      ...data,
      lastUpdated: new Date().toISOString().split('T')[0]!,
    };

    if (index >= 0) {
      MOCK_POLICIES[index] = updatedPolicy;
    } else {
      MOCK_POLICIES.push(updatedPolicy);
    }

    return updatedPolicy;
  }

  async delete(id: string): Promise<void> {
    await new Promise(resolve => setTimeout(resolve, 500));
    const index = MOCK_POLICIES.findIndex(p => p.id === id);
    if (index >= 0) {
      MOCK_POLICIES.splice(index, 1);
    }
  }
}

export const policyApi = new PolicyApi();
