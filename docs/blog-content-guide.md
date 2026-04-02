# Hướng Dẫn Soạn Thảo Nội Dung Blog – Admin Web

> **Audience:** Quản trị viên / Chuyên gia soạn bài trên giao diện Admin Web  
> **Format:** Nội dung bài blog sử dụng cú pháp **Markdown** và được render tự động trên ứng dụng mobile.

---

## 1. Tổng Quan

Trường `content` trong bài blog là một chuỗi **Markdown**. Khi người dùng xem bài trên app mobile, Markdown sẽ được render thành giao diện đẹp với:

- Tiêu đề phân cấp (H1 / H2 / H3)
- **In đậm**, *In nghiêng*
- Danh sách gạch đầu dòng & danh sách số
- Hình ảnh nhúng vào nội dung (với chú thích)
- **Callout box** (Cảnh báo / Lưu ý / Mẹo / Nguy hiểm)
- Bảng dữ liệu
- Đường kẻ phân tách

Trên Admin Web, hãy tích hợp một **WYSIWYG Markdown editor** để chuyên gia soạn thảo dễ dàng (xem Mục 6).

---

## 2. Cú Pháp Cơ Bản

### 2.1 Tiêu Đề

```markdown
# Tiêu đề lớn nhất (H1) – dùng mở đầu bài
## Tiêu đề chương (H2) – phân tách các phần chính
### Tiêu đề mục (H3) – chi tiết trong phần
```

> **Khuyến nghị:** Chỉ dùng **1 H1** cho toàn bài (hoặc không dùng H1 — tiêu đề bài được lấy từ trường `title` riêng). Dùng H2 cho các phần chính, H3 cho các mục con.

---

### 2.2 Định Dạng Văn Bản

```markdown
**chữ đậm**
*chữ nghiêng*
~~chữ gạch ngang~~
`inline code`
```

**Kết quả:** **chữ đậm** · *chữ nghiêng* · ~~chữ gạch ngang~~ · `inline code`

---

### 2.3 Danh Sách

```markdown
- Mục không thứ tự 1
- Mục không thứ tự 2
  - Mục con (thụt 2 dấu cách)

1. Mục có số thứ tự 1
2. Mục có số thứ tự 2
3. Mục có số thứ tự 3
```

---

### 2.4 Đường Kẻ Phân Tách

```markdown
---
```

Dùng `---` để tạo đường kẻ ngang chia bài thành các phần rõ ràng.

---

## 3. Chèn Hình Ảnh

```markdown
![Chú thích ảnh hiển thị bên dưới](https://domain.com/path/to/image.jpg)
```

### Ví dụ:

```markdown
![Rắn hổ mang bành mang cổ khi bị đe dọa](https://cdn.snakeaid.vn/images/cobra-hood.jpg)
```

**Kết quả trên app:**
- Ảnh được hiển thị với góc bo tròn
- Chú thích in nghiêng, màu xám, căn giữa bên dưới ảnh
- Ảnh lỗi / chậm tải có hiển thị placeholder

### Hướng Dẫn Ảnh

| Tiêu chí | Yêu cầu |
|---|---|
| Định dạng | JPG, PNG, WebP |
| Chiều rộng tối thiểu | **800px** |
| Tỉ lệ khuyến nghị | 16:9 hoặc 4:3 |
| Dung lượng | < 500KB (sau nén) |
| Nguồn ảnh | CDN nội bộ hoặc Unsplash/Pexels (không Wikipedia) |
| Alt text / Chú thích | **Bắt buộc** – mô tả nội dung ảnh bằng tiếng Việt |

> ⚠️ **Không dùng** URL ảnh từ Google Images, Wikipedia, hoặc các nguồn không có bản quyền rõ ràng.

---

## 4. Callout Box (Hộp Nổi Bật)

Callout box được tạo bằng cú pháp blockquote (`>`) với emoji ở đầu.  
App mobile tự động nhận diện emoji và render thành hộp màu tương ứng.

### 4.1 Cú Pháp

```markdown
> ⚠️ Nội dung cảnh báo (nền vàng cam)

> 🚫 Nội dung nguy hiểm / cấm (nền đỏ)

> ✅ Mẹo hay / hành động đúng (nền xanh lá)

> ℹ️ Thông tin bổ sung (nền xanh dương)

> 💡 Lưu ý / gợi ý (nền xanh dương)

> 📌 Điểm quan trọng cần nhớ (nền xanh dương)
```

### 4.2 Bảng Emoji → Màu Sắc

| Emoji | Loại | Màu nền | Viền | Icon |
|---|---|---|---|---|
| ⚠️ | Cảnh báo | Vàng cam nhạt | Cam | ⚠️ |
| 🚫 ❌ | Nguy hiểm / Cấm | Đỏ nhạt | Đỏ | 🚫 |
| ✅ ☑️ | Mẹo / Đúng | Xanh lá nhạt | Xanh lá | ✅ |
| ℹ️ 💡 📌 | Thông tin | Xanh dương nhạt | Xanh dương | 💡 |

### 4.3 Ví Dụ Thực Tế

```markdown
> ⚠️ **TUYỆT ĐỐI KHÔNG** rạch vết thương hoặc hút nọc bằng miệng. 
Đây là phương pháp đã được chứng minh vô hiệu và nguy hiểm.

> ✅ Luôn mang theo số điện thoại cấp cứu 115 khi đi vào khu vực 
có nhiều rắn như rừng, đồi núi, hoặc cánh đồng lúa.

> ℹ️ Rắn hổ mang chúa là loài rắn độc dài nhất thế giới, 
có thể đạt tới 5,5 mét chiều dài.
```

> **Lưu ý:** Mỗi callout chỉ nên chứa **1–3 câu**. Không dùng callout cho đoạn văn dài — hãy dùng text thường.

---

## 5. Bảng Dữ Liệu

```markdown
| Cột 1 | Cột 2 | Cột 3 |
|---|---|---|
| Dữ liệu A | Dữ liệu B | Dữ liệu C |
| Dữ liệu D | Dữ liệu E | Dữ liệu F |
```

**Ví dụ:**

```markdown
| Loài | Độc tính | Phân bố |
|---|---|---|
| Hổ mang chúa | Rất cao | Toàn quốc |
| Cạp nia | Rất cao | Miền Bắc |
| Rắn lục đuôi đỏ | Trung bình | Toàn quốc |
| Rắn ráo | Không độc | Toàn quốc |
```

---

## 6. WYSIWYG Editor Khuyến Nghị Cho Admin Web

Để chuyên gia không cần biết Markdown vẫn soạn được bài đẹp, tích hợp một trong các editor sau:

### Option A – **TipTap** (Khuyến nghị)

```bash
npm install @tiptap/react @tiptap/starter-kit @tiptap/extension-image
```

- ✅ React-based, dễ tích hợp
- ✅ Output là HTML hoặc JSON, cần cấu hình thêm để export Markdown
- ✅ Extension hỗ trợ: Image, Table, Blockquote, CodeBlock, ...
- 🔗 https://tiptap.dev

**Cấu hình export Markdown:**
```bash
npm install @tiptap/extension-markdown
```

```typescript
import { Markdown } from 'tiptap-markdown';

const editor = useEditor({
  extensions: [
    StarterKit,
    Image,
    Markdown,
    // ...
  ],
});

// Lấy nội dung Markdown để gửi API:
const content = editor.storage.markdown.getMarkdown();
```

---

### Option B – **React Quill** (Đơn giản hơn)

```bash
npm install react-quill quill-to-markdown
```

- ✅ Dễ setup, UI quen thuộc (giống Google Docs)
- ⚠️ Output là HTML Delta, cần convert sang Markdown qua thư viện

---

### Option C – **MDX Editor**

```bash
npm install @mdxeditor/editor
```

- ✅ Native Markdown editor, WYSIWYG
- ✅ Hỗ trợ ảnh, bảng, callout (directive)
- ✅ Không cần convert – lưu thẳng Markdown
- 🔗 https://mdxeditor.dev

---

## 7. Cấu Trúc Bài Viết Mẫu (Template)

```markdown
## [Tóm tắt vấn đề / Hook mở đầu]

[1–2 câu giới thiệu ngắn gọn thu hút người đọc]

---

## [Phần 1: Thông tin chính]

[Nội dung]

![Mô tả ảnh](URL_ảnh)

## [Phần 2]

[Nội dung có danh sách]

- Điểm 1
- Điểm 2

---

## [Phần 3: Callout quan trọng]

> ⚠️ [Cảnh báo hoặc thông tin quan trọng nhất]

## [Kết luận / Hành động cần làm]

> ✅ [Tóm tắt điều cần nhớ / gợi ý hành động cho người đọc]
```

---

## 8. Checklist Trước Khi Đăng

- [ ] `title`: Rõ ràng, hấp dẫn, dưới 100 ký tự
- [ ] `thumbnailUrl`: Ảnh bìa chất lượng cao, đúng chủ đề
- [ ] `readingTime`: Ước tính thực tế (100–130 từ/phút)
- [ ] `category` + `tags`: Phân loại đúng, 1–5 tags
- [ ] Content có ít nhất **1 ảnh nhúng**
- [ ] Sử dụng H2/H3 để phân cấp nội dung
- [ ] Dùng callout box cho thông tin quan trọng
- [ ] Ảnh có chú thích mô tả rõ ràng
- [ ] Không có link broken (kiểm tra URL ảnh)
- [ ] Đọc lại toàn bài – không lỗi chính tả

---

## 9. Ví Dụ Bài Hoàn Chỉnh

Xem file [`blog-rich-content-test-data.md`](./blog-rich-content-test-data.md) để xem 6 bài mẫu đầy đủ với content Markdown hoàn chỉnh có thể dùng trực tiếp để test.

---

## 10. API Contract (dành cho dev Backend & Web)

### 10.1 Danh Sách Endpoint

| Method | Endpoint | Auth | Mô tả |
|---|---|---|---|
| `GET` | `/api/blogs` | Public | Lấy danh sách blog (có thể filter theo `status`) |
| `GET` | `/api/blogs/{id}` | Public | Chi tiết 1 blog |
| `POST` | `/api/blogs` | Expert | Tạo blog mới |
| `PUT` | `/api/blogs/{id}` | Expert (owner) | Cập nhật toàn bộ blog |
| `DELETE` | `/api/blogs/{id}` | Expert (owner) | Xóa blog |
| `PATCH` | `/api/blogs/{id}/status` | Expert / Admin | Chỉ đổi trạng thái |
| `PATCH` | `/api/blogs/{id}/view` | Public | Tăng view count |
| `PATCH` | `/api/blogs/{id}/like` | Member | Like bài |
| `PATCH` | `/api/blogs/{id}/unlike` | Member | Unlike bài |

---

### 10.2 Request Body – POST / PUT

```json
{
  "title": "string (bắt buộc, tối đa 200 ký tự)",
  "content": "string (bắt buộc, Markdown)",
  "thumbnailUrl": "string (bắt buộc, URL hợp lệ)",
  "status": "Draft | PendingApproval | Published | Rejected",
  "category": "SnakeKnowledge | SnakeSpecies | SnakeHealth | SnakeFeeding | SnakeHabitat | Other",
  "tags": ["Venomous", "Safety"],
  "readingTime": 5
}
```

---

### 10.3 Response Shape

**List response** (`GET /api/blogs`):
```json
{
  "data": [
    { /* BlogModel */ },
    { /* BlogModel */ }
  ]
}
```
hoặc dạng phân trang:
```json
{
  "data": {
    "items": [ { /* BlogModel */ } ],
    "totalCount": 42,
    "pageIndex": 1,
    "pageSize": 20
  }
}
```

**Single item response** (`GET /api/blogs/{id}`, `POST`, `PUT`):
```json
{
  "data": {
    "id": "string",
    "authorId": "string",
    "author": {
      "id": "string",
      "fullName": "string",
      "avatarUrl": "string | null"
    },
    "title": "string",
    "thumbnailUrl": "string",
    "content": "string (Markdown)",
    "category": "SnakeKnowledge",
    "tags": ["Venomous", "Safety"],
    "viewCount": 0,
    "likeCount": 0,
    "readingTime": 5,
    "status": "Draft",
    "rejectionReason": "string | null",
    "likedViewer": ["userId1", "userId2"],
    "createdAt": "2024-01-01T00:00:00Z",
    "updatedAt": "2024-01-01T00:00:00Z"
  }
}
```

**PATCH status request** (`PATCH /api/blogs/{id}/status`):
```json
{ "status": "PendingApproval" }
```

---

### 10.4 Enum Values

#### `status`
| Giá trị API | Int | Nhãn hiển thị | Ghi chú |
|---|---|---|---|
| `Draft` | 0 | Bản nháp | Expert tạo, chưa gửi duyệt |
| `PendingApproval` | 1 | Chờ duyệt | Đang chờ Admin review |
| `Published` | 2 | Đã đăng | Hiển thị cho người dùng |
| `Rejected` | 3 | Bị từ chối | Admin từ chối kèm lý do |

#### `category`
| Giá trị API | Nhãn hiển thị |
|---|---|
| `SnakeKnowledge` | Kiến thức rắn |
| `SnakeSpecies` | Loài rắn |
| `SnakeHealth` | Sức khỏe rắn |
| `SnakeFeeding` | Nuôi rắn |
| `SnakeHabitat` | Môi trường sống |
| `Other` | Khác |

#### `tags` (array, 1–5 giá trị)
| Giá trị API | Nhãn hiển thị |
|---|---|
| `Venomous` | Có độc |
| `NonVenomous` | Không độc |
| `Safety` | An toàn |
| `WildSnake` | Rắn hoang dã |
| `SnakeCare` | Chăm sóc rắn |
| `SnakeBehavior` | Hành vi rắn |
| `SnakeIdentification` | Nhận dạng rắn |
| `SnakeConservation` | Bảo tồn |
| `SnakeMyths` | Lầm tưởng |
| `Other` | Khác |

---

### 10.5 Status Flow

```
    ┌─────────────────────────────────────────────────────────┐
    │  Expert flow                   Admin flow               │
    │                                                         │
    │  [Tạo mới] ──► Draft           [Tạo mới] ──► Published │
    │                  │                                      │
    │  Expert          │ PATCH /status  Admin cũng có thể     │
    │  (Đăng bài)      ▼ → PendingApproval  ──────────────►  │
    │           PendingApproval                Published       │
    │            │         │                     │            │
    │  Admin     │         │ Admin               │ Admin      │
    │  duyệt     ▼         ▼ từ chối             ▼ chỉnh sửa │
    │        Published   Rejected ──► Expert  Draft/Published │
    │                       │        chỉnh lại                │
    │                       └──────► Draft                    │
    └─────────────────────────────────────────────────────────┘
```

**Quy tắc chuyển trạng thái:**

| Actor | Từ | Sang | Endpoint |
|---|---|---|---|
| Expert | — | `Draft` | `POST /api/blogs` |
| Expert | `Draft` | `PendingApproval` | `PATCH /status` |
| Expert | `Rejected` | `Draft` | `PUT` toàn bộ |
| Admin | — | `Draft` hoặc `Published` | `POST /api/blogs` (status tùy chọn) |
| Admin | Bất kỳ | `Published` | `PATCH /status` |
| Admin | `PendingApproval` | `Rejected` | `PATCH /status` (kèm `rejectionReason`) |
| Admin | `Published` | `Draft` | `PATCH /status` (take down) |

> **Lưu ý mobile:** Blog `Published` hiển thị read-only, không chỉnh sửa được từ app.

---

## 11. Callout Parsing Rules (cho Web Preview)

Để web preview **khớp 100%** với render trên mobile, cần implement đúng thuật toán sau.

### 11.1 Thuật Toán Phân Tích

Duyệt từng dòng của content:

1. Nếu dòng bắt đầu bằng `![` → **Image block** (tách URL và caption)
2. Nếu dòng bắt đầu bằng `> ` (kèm emoji trigger) → **Callout block**
3. Còn lại → **Markdown block** thông thường

Các dòng liên tiếp cùng loại được gộp thành 1 block.

### 11.2 Callout Trigger Emoji

| Emoji | Loại | Màu nền | Màu viền trái | Icon |
|---|---|---|---|---|
| `⚠️` | `warning` | `#FFF3E0` | `#FF8F00` | WarningAmber |
| `🚫` `❌` | `danger` | `#FFEBEE` | `#E53935` | Dangerous |
| `✅` `☑️` | `success` | `#E8F5E9` | `#43A047` | CheckCircle |
| `ℹ️` `💡` `📌` | `info` | `#E3F2FD` | `#1976D2` | Lightbulb |

**Lưu ý:** Emoji trigger bị strip khỏi text hiển thị (không hiện trùng cùng icon).

### 11.3 Pseudo-code

```javascript
function parseContent(content) {
  const lines = content.split('\n');
  const blocks = [];
  let buffer = [];
  let currentType = null; // 'markdown' | 'callout' | 'image'

  const CALLOUT_TRIGGERS = {
    '⚠️': 'warning',
    '🚫': 'danger', '❌': 'danger',
    '✅': 'success', '☑️': 'success',
    'ℹ️': 'info', '💡': 'info', '📌': 'info',
  };

  const IMAGE_REGEX = /^!\[([^\]]*)\]\(([^)]+)\)/;

  for (const line of lines) {
    // Image
    const imgMatch = line.match(IMAGE_REGEX);
    if (imgMatch) {
      flush(blocks, buffer, currentType);
      blocks.push({ type: 'image', url: imgMatch[2], caption: imgMatch[1] });
      buffer = []; currentType = null;
      continue;
    }

    // Callout
    if (line.startsWith('> ')) {
      const text = line.slice(2); // strip '> '
      const emoji = Object.keys(CALLOUT_TRIGGERS).find(e => text.startsWith(e));
      if (emoji) {
        const calloutType = CALLOUT_TRIGGERS[emoji];
        const calloutText = text.replace(emoji, '').trimStart();
        // collect multi-line callout
        if (currentType === 'callout' && buffer.calloutType === calloutType) {
          buffer.text += '\n' + calloutText;
        } else {
          flush(blocks, buffer, currentType);
          buffer = { calloutType, text: calloutText };
          currentType = 'callout';
        }
        continue;
      }
    }

    // Default: Markdown
    if (currentType !== 'markdown') {
      flush(blocks, buffer, currentType);
      buffer = []; currentType = 'markdown';
    }
    buffer.push(line);
  }
  flush(blocks, buffer, currentType);
  return blocks;
}
```

### 11.4 Render Callout Box (CSS tham khảo)

```css
.callout {
  display: flex;
  gap: 10px;
  padding: 12px 14px;
  border-radius: 10px;
  border-left: 4px solid;
  margin: 10px 0;
}
.callout.warning { background: #FFF3E0; border-color: #FF8F00; color: rgba(255,143,0,0.85); }
.callout.danger  { background: #FFEBEE; border-color: #E53935; color: rgba(229,57,53,0.85); }
.callout.success { background: #E8F5E9; border-color: #43A047; color: rgba(67,160,71,0.85); }
.callout.info    { background: #E3F2FD; border-color: #1976D2; color: rgba(25,118,210,0.85); }

.callout .text {
  font-size: 14px;
  line-height: 1.65;
}
```

---

## 12. Web Admin – Form Soạn Bài & Preview

### 12.1 Luồng UI Admin Web

Admin web cần hỗ trợ **2 vai trò**:

| Tính năng | Expert | Admin |
|---|---|---||
| Soạn bài mới | ✅ | ✅ |
| Lưu nháp (Draft) | ✅ | ✅ |
| Đăng thẳng (Published) | ❌ | ✅ |
| Gửi duyệt (PendingApproval) | ✅ | ✅ (nếu muốn) |
| Duyệt / Từ chối bài người khác | ❌ | ✅ |
| Xóa bài | ❌ | ✅ |

### 12.2 Nút Action theo Trạng Thái

**Expert:**
```
Draft         → [Lưu nháp]  [Đăng bài →PendingApproval]
PendingApproval → [Lưu nháp]  (chờ admin duyệt)
Rejected      → [Lưu nháp]  [Đăng lại →PendingApproval]
Published     → (read-only)
```

**Admin:**
```
New / Draft   → [Lưu nháp]  [Đăng luôn →Published]
PendingApproval → [Duyệt →Published]  [Từ chối →Rejected]
Published     → [Gỡ xuống →Draft]  [Xóa]
```

### 12.3 Tích Hợp Preview Trong Form

Thiết kế tab **Soạn thảo / Xem trước** trong form – tương tự app mobile:

```
┌─────────────────────────────────────────────┐
│  [ Soạn thảo ]  [ Xem trước ]               │
├─────────────────────────────────────────────┤
│                                             │
│  [Soạn thảo tab]                            │
│  ┌──────────────────────────────────────┐   │
│  │ Toolbar: B  I  H2  H3  ─  ⚠️ ✅ 💡 🚫 ℹ️ 🖼 • 1.│
│  ├──────────────────────────────────────┤   │
│  │                                      │   │
│  │  Textarea (monospace, min 400px)     │   │
│  │                                      │   │
│  └──────────────────────────────────────┘   │
│                                             │
│  [Xem trước tab]                            │
│  ┌──────────────────────────────────────┐   │
│  │  Render HTML từ parseContent()       │   │
│  │  + react-markdown hoặc marked.js    │   │
│  └──────────────────────────────────────┘   │
└─────────────────────────────────────────────┘
```

### 12.4 Implementation Gợi Ý (React)

```tsx
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm'; // table, strikethrough

function BlogPreview({ content }: { content: string }) {
  const blocks = parseContent(content); // hàm từ Mục 11.3

  return (
    <div className="blog-preview">
      {blocks.map((block, i) => {
        if (block.type === 'image') {
          return (
            <figure key={i}>
              <img src={block.url} alt={block.caption} />
              {block.caption && <figcaption>{block.caption}</figcaption>}
            </figure>
          );
        }
        if (block.type === 'callout') {
          return (
            <div key={i} className={`callout ${block.calloutType}`}>
              <CalloutIcon type={block.calloutType} />
              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                {block.text}
              </ReactMarkdown>
            </div>
          );
        }
        // markdown block
        return (
          <ReactMarkdown key={i} remarkPlugins={[remarkGfm]}>
            {block.lines.join('\n')}
          </ReactMarkdown>
        );
      })}
    </div>
  );
}
```

**Packages cần thiết:**
```bash
npm install react-markdown remark-gfm
# nếu dùng TipTap:
npm install @tiptap/react @tiptap/starter-kit tiptap-markdown
```

### 12.5 Toolbar Formatting (các nút chèn nhanh)

| Nút | Markdown chèn vào | Ghi chú |
|---|---|---|
| **B** | `**{selection}**` | Wrap selection |
| *I* | `*{selection}*` | Wrap selection |
| H2 | `\n## ` | Chèn tại cursor |
| H3 | `\n### ` | Chèn tại cursor |
| — | `\n\n---\n\n` | Đường kẻ ngang |
| ⚠️ | `\n> ⚠️ ` | Callout warning |
| ✅ | `\n> ✅ ` | Callout success |
| 💡 | `\n> 💡 ` | Callout info |
| 🚫 | `\n> 🚫 ` | Callout danger |
| ℹ️ | `\n> ℹ️ ` | Callout info |
| 🖼️ | `\n![Mô tả](` + cursor + `)\n` | Chèn ảnh |
| • | `\n- ` | Bullet list |
| 1. | `\n1. ` | Numbered list |
