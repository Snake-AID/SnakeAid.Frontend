# Hướng Dẫn Định Dạng Nội Dung Bài Học (Lesson Content Guide)

> **Dành cho:** Web Admin Developer  
> **Cập nhật:** 2026-04-02  
> **Mô tả:** Định dạng plain-text đặc biệt dùng cho field `content` của entity `Lesson` trong SnakeAid.

---

## Mục Lục

1. [Tổng Quan](#1-tổng-quan)
2. [Cấu Trúc Content](#2-cấu-trúc-content)
3. [Quy Tắc Section Heading](#3-quy-tắc-section-heading)
4. [Quy Tắc Body Text](#4-quy-tắc-body-text)
5. [Nhúng Video YouTube](#5-nhúng-video-youtube)
6. [Ví Dụ Content Hoàn Chỉnh](#6-ví-dụ-content-hoàn-chỉnh)
7. [API Contract](#7-api-contract)
8. [Enum Values](#8-enum-values)
9. [Thuật Toán Parse (Mobile Reference)](#9-thuật-toán-parse-mobile-reference)
10. [Hướng Dẫn Web Admin Form](#10-hướng-dẫn-web-admin-form)
11. [Hướng Dẫn Render Trên Web](#11-hướng-dẫn-render-trên-web)

---

## 1. Tổng Quan

Field `content` của `Lesson` là một **chuỗi plain-text thuần túy** (không phải Markdown, không phải HTML). Nó sử dụng một định dạng tối giản dựa trên **emoji để chia section**, tương tự cách viết nội dung trực quan trong app di động.

App mobile parse chuỗi này và render thành:
- **Video banner** (nếu có YouTube URL)
- **Danh sách section** — mỗi section có heading (emoji line) và body (text + bullets)

---

## 2. Cấu Trúc Content

Content gồm tối đa 3 phần, theo thứ tự:

```
[Mở đầu tùy chọn]
[YouTube URL tùy chọn]
[Các section emoji]
```

### Ví dụ cấu trúc cơ bản:

```
Nội dung giới thiệu ngắn cho bài học (không có emoji, không có URL).

https://www.youtube.com/watch?v=dQw4w9WgXcQ

🛡️ 1. PHẦN ĐẦU TIÊN:
Mô tả nội dung của phần này.
- Điểm bullet 1
- Điểm bullet 2

🔍 2. PHẦN THỨ HAI:
Chi tiết phần hai...
```

> **Lưu ý:** Text trước section heading đầu tiên được coi là một section không có heading (intro section).

---

## 3. Quy Tắc Section Heading

### 3.1 Điều Kiện Nhận Diện

Một dòng là **section heading** khi ký tự **đầu tiên** của dòng là emoji thuộc các Unicode range sau:

| Range | Hex | Loại |
|---|---|---|
| Miscellaneous Symbols and Pictographs | `U+1F300 – U+1FAFF` | 🌲 🛡️ 🔍 ⚠️ v.v... |
| Miscellaneous Symbols | `U+2600 – U+26FF` | ☀️ ⭐ ♻️ v.v... |
| Dingbats | `U+2700 – U+27BF` | ✅ ❌ ✂️ v.v... |

Regex kiểm tra (Python/JS):
```python
# Python
import re
is_heading = bool(re.match(r'^[\U0001F300-\U0001FAFF\u2600-\u26FF\u2700-\u27BF]', line))
```
```js
// JavaScript
const isHeading = /^[\u{1F300}-\u{1FAFF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/u.test(line);
```

### 3.2 Định Dạng Heading Gợi Ý

Mặc dù không bắt buộc format cụ thể, **quy ước được dùng trong dữ liệu thực tế** là:

```
<emoji> <số thứ tự>. <TÊN PHẦN IN HOA>:
```

Ví dụ:
```
🛡️ 1. TRANG PHỤC BẢO HỘ CHUYÊN DỤNG:
🔍 2. KỸ THUẬT TIẾP CẬN:
⚠️ 3. CÁC LỖI PHỔ BIẾN CẦN TRÁNH:
✅ 4. QUY TRÌNH KIỂM TRA SAU BẮT:
```

### 3.3 Emoji Gợi Ý Theo Loại Bài Học

| Chủ đề | Emoji gợi ý |
|---|---|
| An toàn / Bảo hộ | 🛡️ 🦺 🧤 🥾 |
| Quan sát / Nhận diện | 🔍 👁️ 🗺️ |
| Cảnh báo / Nguy hiểm | ⚠️ 🚨 ❗ |
| Hoàn thành / Quy trình | ✅ 📋 🔄 |
| Thiên nhiên / Môi trường | 🌲 🌿 🏕️ |
| Dụng cụ / Thiết bị | 🔧 🪤 📦 |
| Sơ cứu / Y tế | 🏥 💊 🩺 |
| Video / Hướng dẫn | 🎥 📹 |

---

## 4. Quy Tắc Body Text

Body của mỗi section (các dòng sau heading, đến hết section) hỗ trợ 2 kiểu:

### 4.1 Đoạn Văn Bình Thường

Bất kỳ dòng nào không bắt đầu bằng `-` hoặc `•` là đoạn văn thường:

```
Đây là một đoạn văn mô tả kỹ thuật tiếp cận an toàn.
Dòng này nối tiếp, được render thành paragraph riêng.
```

> Mỗi dòng = một `<p>` trên web.

### 4.2 Bullet Point

Dòng bắt đầu bằng `- ` hoặc `• ` sẽ được render thành bullet item:

```
- Đội mũ bảo hiểm toàn mặt
- Mặc áo dài tay bảo hộ
• Đi ủng cao đến đầu gối
```

> Prefix `-` hoặc `•` và khoảng trắng ngay sau bị bỏ đi. Nội dung còn lại là text của bullet.

### 4.3 Dòng Trống

Dòng trống (`\n\n`) tạo khoảng cách trực quan giữa các đoạn trong cùng một section. Trên web render thành margin-bottom.

---

## 5. Nhúng Video YouTube

### 5.1 Cách Nhúng

Đặt URL YouTube trực tiếp vào bất kỳ vị trí nào trong content:

```
https://www.youtube.com/watch?v=VIDEO_ID
https://youtu.be/VIDEO_ID
```

### 5.2 Quy Tắc Xử Lý

- **Chỉ URL đầu tiên** được tìm thấy được dùng làm video của bài học
- URL bị **xóa hoàn toàn** khỏi text trước khi parse sections (không hiển thị như text)
- Regex detect URL: `https?://\S+`

### 5.3 Render Video Trên Mobile

Mobile hiển thị thumbnail YouTube tự động:
```
https://img.youtube.com/vi/{VIDEO_ID}/hqdefault.jpg
```

Khi nhấn → mở YouTube bằng external app.

### 5.4 Lấy Video ID

| Dạng URL | Cách lấy ID |
|---|---|
| `youtube.com/watch?v=VIDEO_ID` | Query param `v` |
| `youtu.be/VIDEO_ID` | path segment đầu tiên |

---

## 6. Ví Dụ Content Hoàn Chỉnh

### 6.1 Bài Học "Safety" (Có Video)

```
Bài học này hướng dẫn cách trang bị và sử dụng đồ bảo hộ đúng cách trước khi thực hiện công việc bắt rắn hoang dã.

https://www.youtube.com/watch?v=dQw4w9WgXcQ

🛡️ 1. TRANG PHỤC BẢO HỘ CHUYÊN DỤNG:
Luôn mặc đầy đủ đồ bảo hộ trước khi tiếp cận khu vực có rắn.
- Mũ bảo hiểm toàn mặt hoặc kính bảo hộ
- Áo dài tay chống cắn (vật liệu Kevlar hoặc da dày)
- Găng tay da dày, ống tay dài tối thiểu 30cm
- Ủng cao su cứng cao đến đầu gối

🔍 2. KIỂM TRA THIẾT BỊ TRƯỚC KHI RA HIỆN TRƯỜNG:
Không bao giờ ra hiện trường với thiết bị hỏng hoặc chưa kiểm tra.
- Kiểm tra móc bắt rắn: không gỉ sét, khóa chắc
- Kiểm tra túi đựng: dây buộc chặt, không rách
- Kiểm tra đèn pin: pin đầy, tia sáng mạnh

⚠️ 3. CÁC TÌNH HUỐNG NGUY HIỂM CẦN TRÁNH:
Nhận biết nguy hiểm là bước đầu tiên để đảm bảo an toàn.
- Không tiếp cận rắn khi không có đồng đội
- Không làm việc trong điều kiện thiếu ánh sáng
- Không mặc quần áo màu sáng (dễ kích động rắn có độc)

✅ 4. QUY TRÌNH ĐẶT THIẾT BỊ SAU KHI HOÀN THÀNH:
- Kiểm tra lại túi đựng rắn trước khi bỏ vào xe
- Rửa tay và kiểm tra thương tích ngay sau khi kết thúc
- Báo cáo tình huống cho đội trưởng
```

### 6.2 Bài Học Không Có Video (Đơn Giản)

```
Nhận biết các loài rắn độc phổ biến tại Việt Nam là kỹ năng cơ bản nhất của người cứu hộ.

🐍 1. ĐẶC ĐIỂM NHẬN DIỆN CHUNG:
Rắn độc thường có đầu hình tam giác, đồng tử dọc (mèo), và khoảng cách giữa hai lỗ mũi-mắt rõ.
- Đầu hình tam giác rõ ràng
- Đồng tử theo chiều dọc (như mèo)
- Hố cảm nhiệt giữa mắt và mũi (rắn lục)

🔍 2. LOÀI PHỔ BIẾN:
Việt Nam có hơn 200 loài rắn, trong đó khoảng 60 loài có độc.
- Rắn hổ mang (Naja): vảy cổ phình rộng, phun nọc
- Rắn lục đuôi đỏ: xanh lá, đuôi đỏ cam, sống trên cây
- Rắn cạp nong/cạp nia: khoanh vàng-đen hoặc trắng-đen
```

---

## 7. API Contract

### 7.1 Endpoints

| Method | Endpoint | Mô tả |
|---|---|---|
| `GET` | `/api/lessons` | Lấy danh sách tất cả bài học |
| `GET` | `/api/lessons?category={cat}` | Lọc theo category |
| `GET` | `/api/lessons/{id}` | Lấy chi tiết một bài học |
| `POST` | `/api/lessons` | Tạo bài học mới (Admin) |
| `PUT` | `/api/lessons/{id}` | Cập nhật bài học (Admin) |
| `DELETE` | `/api/lessons/{id}` | Xóa bài học (Admin) |
| `PATCH` | `/api/lessons/{id}/publish` | Publish/Unpublish (Admin) |

### 7.2 Request Body (POST / PUT)

```json
{
  "title": "string, required, max 200 chars",
  "content": "string, required — plain-text theo định dạng mô tả trong tài liệu này",
  "category": "Safety | Catching | FirstAid",
  "isPublished": true
}
```

### 7.3 Response — Đối Tượng Lesson

```json
{
  "id": "uuid-string",
  "title": "Trang bị bảo hộ cơ bản",
  "content": "...",
  "category": "Safety",
  "isPublished": true,
  "createdAt": "2026-01-15T08:00:00Z",
  "updatedAt": "2026-03-20T14:30:00Z"
}
```

### 7.4 Response — Danh Sách

```json
{
  "isSuccess": true,
  "message": "",
  "data": [ ... ]
}
```

### 7.5 Response — Chi Tiết

```json
{
  "isSuccess": true,
  "message": "",
  "data": { ... }
}
```

---

## 8. Enum Values

### 8.1 Category

| Giá trị API | Nhãn Tiếng Việt | Màu | Icon |
|---|---|---|---|
| `Safety` | An Toàn | `#28A745` (xanh lá) | 🛡️ |
| `Catching` | Bắt Rắn | `#FF6B35` (cam) | 🦁 |
| `FirstAid` | Sơ Cứu | `#DC3545` (đỏ) | ⚕️ |

---

## 9. Thuật Toán Parse (Mobile Reference)

Đây là thuật toán chính xác mà mobile dùng để parse content, để web có thể replicate:

```
INPUT:  content (raw string)
OUTPUT: list of Section { heading?: string, body: string }

STEP 1 — Strip URLs:
  noUrls = content.replaceAll(/https?:\/\/\S+/g, '').trim()
  videoUrl = first match of /https?:\/\/(?:www\.)?(?:youtube\.com\/watch\?v=|youtu\.be\/)[\w\-]+/

STEP 2 — Split into lines:
  lines = noUrls.split('\n')

STEP 3 — Iterate lines:
  currentHeading = null
  bodyLines = []
  sections = []

  FOR each line in lines:
    trimmedRight = line.trimRight()
    IF trimmedRight is empty:
      bodyLines.push('')
      CONTINUE

    isHeading = /^[\u{1F300}-\u{1FAFF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/u.test(trimmedRight)

    IF isHeading:
      prevBody = bodyLines.join('\n').trim()
      IF prevBody != '' OR currentHeading != null:
        sections.push({ heading: currentHeading, body: prevBody })
      currentHeading = trimmedRight.trim()
      bodyLines = []
    ELSE:
      bodyLines.push(trimmedRight)

  // Flush last section
  lastBody = bodyLines.join('\n').trim()
  IF lastBody != '' OR currentHeading != null:
    sections.push({ heading: currentHeading, body: lastBody })

  IF sections is empty:
    sections.push({ heading: null, body: noUrls })

STEP 4 — Parse body lines (per section):
  FOR each bodyLine in section.body.split('\n'):
    IF bodyLine is empty → spacer
    ELSE IF bodyLine starts with '-' or '•':
      bullet text = bodyLine.replace(/^[-•]\s*/, '')
      → render as bullet item
    ELSE:
      → render as paragraph

RETURN sections, videoUrl
```

---

## 10. Hướng Dẫn Web Admin Form

### 10.1 Các Field Cần Có

| Field | Loại | Bắt buộc | Ghi chú |
|---|---|---|---|
| `title` | Text input | ✅ | Max 200 ký tự |
| `category` | Select/Dropdown | ✅ | 3 giá trị: Safety, Catching, FirstAid |
| `content` | Textarea lớn | ✅ | Plain-text, xem format bên dưới |
| `isPublished` | Toggle/Checkbox | ✅ | Default: false (Draft) |

### 10.2 Giao Diện Form Gợi Ý

```
┌──────────────────────────────────────────────────────────┐
│  Tiêu đề bài học                                         │
│  ┌────────────────────────────────────────────────────┐  │
│  │ Trang bị bảo hộ cơ bản cho người cứu hộ rắn       │  │
│  └────────────────────────────────────────────────────┘  │
│                                                          │
│  Danh mục              Trạng thái                        │
│  ┌──────────────┐       ┌────────────────────────────┐   │
│  │ ▼ An Toàn    │       │ ● Published   ○ Draft      │   │
│  └──────────────┘       └────────────────────────────┘   │
│                                                          │
│  Nội dung bài học          [Chỉnh sửa] [Xem trước]      │
│  ┌────────────────────────────────────────────────────┐  │
│  │ [ H🛡️ ] [ 🔍 ] [ ⚠️ ] [ ✅ ] [ — ] [ 📹 URL ]   │  │
│  ├────────────────────────────────────────────────────┤  │
│  │ Nhập nội dung theo định dạng emoji-section...      │  │
│  │                                                    │  │
│  │ 🛡️ 1. TIÊU ĐỀ PHẦN:                              │  │
│  │ Mô tả nội dung...                                  │  │
│  │ - Bullet point 1                                   │  │
│  │                                                    │  │
│  └────────────────────────────────────────────────────┘  │
│                                                          │
│                          [Hủy]  [Lưu bài học]           │
└──────────────────────────────────────────────────────────┘
```

### 10.3 Toolbar Chèn Nhanh

Thêm toolbar phía trên textarea để giúp admin nhập đúng định dạng:

| Nút | Chèn vào cursor | Mô tả |
|---|---|---|
| 🛡️ Section | `\n🛡️ 1. TIÊU ĐỀ:\n` | Chèn section heading mẫu |
| 🔍 Section | `\n🔍 2. TIÊU ĐỀ:\n` | |
| ⚠️ Section | `\n⚠️ 3. TIÊU ĐỀ:\n` | |
| ✅ Section | `\n✅ 4. TIÊU ĐỀ:\n` | |
| — Bullet | `\n- ` | Bắt đầu bullet point |
| 📹 Video | `\nhttps://youtu.be/VIDEO_ID\n` | Placeholder URL YouTube |

### 10.4 Validation Rules

```
title:
  - required
  - maxLength: 200

category:
  - required
  - oneOf: ['Safety', 'Catching', 'FirstAid']

content:
  - required
  - minLength: 10
  - WARN nếu không có section heading nào (không có dòng bắt đầu bằng emoji)
  - WARN nếu YouTube URL không hợp lệ (nếu có URL trong content)
  - INFO nếu có nhiều hơn 1 URL (chỉ URL đầu tiên được dùng)
```

---

## 11. Hướng Dẫn Render Trên Web

### 11.1 React Component Mẫu

```tsx
import React from 'react';

interface Section {
  heading: string | null;
  body: string;
}

interface ParsedLesson {
  videoUrl: string | null;
  sections: Section[];
}

function parseLessonContent(content: string): ParsedLesson {
  // Extract video URL
  const videoMatch = content.match(
    /https?:\/\/(?:www\.)?(?:youtube\.com\/watch\?v=|youtu\.be\/)([\w\-]+)/
  );
  const videoUrl = videoMatch ? videoMatch[0] : null;
  const videoId = videoMatch ? videoMatch[1] : null;

  // Strip all URLs
  const noUrls = content.replace(/https?:\/\/\S+/g, '').trim();

  // Parse sections
  const lines = noUrls.split('\n');
  const sections: Section[] = [];
  let currentHeading: string | null = null;
  const bodyLines: string[] = [];

  const EMOJI_RE = /^[\u{1F300}-\u{1FAFF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/u;

  const flush = () => {
    const body = bodyLines.join('\n').trim();
    if (body || currentHeading !== null) {
      sections.push({ heading: currentHeading, body });
    }
    bodyLines.length = 0;
  };

  for (const raw of lines) {
    const line = raw.trimEnd();
    if (EMOJI_RE.test(line)) {
      flush();
      currentHeading = line.trim();
    } else {
      bodyLines.push(line);
    }
  }
  flush();

  if (sections.length === 0) {
    sections.push({ heading: null, body: noUrls });
  }

  return { videoUrl, sections };
}

function LessonBodyText({ body }: { body: string }) {
  const lines = body.split('\n');
  return (
    <div className="lesson-body">
      {lines.map((line, i) => {
        const trimmed = line.trim();
        if (!trimmed) return <div key={i} className="spacer" />;
        if (/^[-•]/.test(trimmed)) {
          const text = trimmed.replace(/^[-•]\s*/, '');
          return (
            <div key={i} className="bullet-item">
              <span className="bullet-dot" />
              <span>{text}</span>
            </div>
          );
        }
        return <p key={i} className="body-paragraph">{trimmed}</p>;
      })}
    </div>
  );
}

function YouTubeThumbnail({ videoUrl, videoId }: { videoUrl: string; videoId: string }) {
  const thumbUrl = `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;
  return (
    <a href={videoUrl} target="_blank" rel="noopener noreferrer" className="video-banner">
      <img src={thumbUrl} alt="YouTube video" />
      <div className="play-overlay">
        <span className="play-btn">▶</span>
        <span className="video-label">Xem video hướng dẫn trên YouTube</span>
      </div>
    </a>
  );
}

function extractVideoId(url: string): string | null {
  const youtubeMatch = url.match(
    /(?:youtube\.com\/watch\?v=|youtu\.be\/)([\w\-]+)/
  );
  return youtubeMatch ? youtubeMatch[1] : null;
}

export function LessonPreview({ content, accentColor = '#FF6B35' }: { content: string; accentColor?: string }) {
  const { videoUrl, sections } = parseLessonContent(content);
  const videoId = videoUrl ? extractVideoId(videoUrl) : null;

  return (
    <div className="lesson-preview" style={{ '--accent': accentColor } as React.CSSProperties}>
      {videoUrl && videoId && (
        <YouTubeThumbnail videoUrl={videoUrl} videoId={videoId} />
      )}

      <div className="sections-header">
        <span className="accent-bar" />
        <h3>Nội Dung Bài Học</h3>
      </div>

      {sections.map((section, i) => (
        <div key={i} className="section-card">
          {section.heading && (
            <div className="section-heading">{section.heading}</div>
          )}
          {section.body && <LessonBodyText body={section.body} />}
        </div>
      ))}
    </div>
  );
}
```

### 11.2 CSS Gợi Ý

```css
/* Accent color được truyền qua CSS custom property --accent */

.lesson-preview {
  background: #F8F7F5;
  padding: 16px;
  font-family: sans-serif;
}

/* Video banner */
.video-banner {
  display: block;
  position: relative;
  border-radius: 12px;
  overflow: hidden;
  margin-bottom: 20px;
  height: 200px;
  text-decoration: none;
}
.video-banner img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
.play-overlay {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background: rgba(0,0,0,0.4);
  color: white;
}
.play-btn {
  width: 64px;
  height: 64px;
  background: #DC3545;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 28px;
  margin-bottom: 10px;
}

/* Section divider header */
.sections-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 14px;
}
.accent-bar {
  width: 4px;
  height: 20px;
  background: var(--accent);
  border-radius: 2px;
}
.sections-header h3 {
  margin: 0;
  font-size: 16px;
  font-weight: bold;
  color: #1A1A1A;
}

/* Section card */
.section-card {
  background: white;
  border-radius: 12px;
  margin-bottom: 12px;
  box-shadow: 0 2px 6px rgba(0,0,0,0.04);
  overflow: hidden;
}
.section-heading {
  padding: 12px 14px 10px;
  background: color-mix(in srgb, var(--accent) 8%, transparent);
  font-size: 13px;
  font-weight: bold;
  color: var(--accent);
  line-height: 1.4;
  border-bottom: 1px solid color-mix(in srgb, var(--accent) 12%, transparent);
}

/* Body text */
.lesson-body {
  padding: 10px 14px 12px;
}
.body-paragraph {
  font-size: 13px;
  color: #444;
  line-height: 1.55;
  margin: 0 0 6px;
}
.spacer {
  height: 6px;
}
.bullet-item {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  margin-bottom: 6px;
  font-size: 13px;
  color: #444;
  line-height: 1.55;
}
.bullet-dot {
  width: 6px;
  height: 6px;
  min-width: 6px;
  background: var(--accent);
  border-radius: 50%;
  margin-top: 7px;
}
```

### 11.3 Màu Accent Theo Category

```js
const CATEGORY_ACCENT = {
  Safety:   '#28A745',   // xanh lá
  Catching: '#FF6B35',   // cam
  FirstAid: '#DC3545',   // đỏ
};
```

Truyền vào `<LessonPreview accentColor={CATEGORY_ACCENT[lesson.category]} />`.

---

## Tóm Tắt Nhanh (Quick Reference)

```
FORMAT:
  [intro text]                 ← optional, no emoji start → no heading section
  https://youtu.be/VIDEO_ID   ← optional, first URL becomes video
  🛡️ 1. HEADING:              ← emoji line → section heading
  body paragraph               ← normal text
  - bullet item                ← starts with - or •

PARSE RULES:
  ✅ Emoji line  → new section heading
  ✅ - or • line → bullet item
  ✅ Other line  → paragraph
  ✅ Empty line  → spacer
  ✅ http://...  → stripped; first YouTube URL → video banner

CATEGORY VALUES:  Safety | Catching | FirstAid
```
