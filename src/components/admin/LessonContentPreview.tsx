'use client';

import { Play } from 'lucide-react';

const CATEGORY_ACCENT: Record<string, string> = {
  Safety: '#28A745',
  Catching: '#FF6B35',
  FirstAid: '#DC3545',
};

const EMOJI_RE = /^[\u{1F300}-\u{1FAFF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/u;
const YOUTUBE_RE = /https?:\/\/(?:www\.)?(?:youtube\.com\/watch\?v=|youtu\.be\/)([\w-]+)/;

interface Section {
  heading: string | null;
  body: string;
}

function extractVideoId(content: string): string | null {
  const m = content.match(YOUTUBE_RE);
  return m ? (m[1] ?? null) : null;
}

function parseLessonContent(content: string): { videoId: string | null; sections: Section[] } {
  const videoId = extractVideoId(content);
  const noUrls = content.replace(/https?:\/\/\S+/g, '').trim();

  const lines = noUrls.split('\n');
  const sections: Section[] = [];
  let currentHeading: string | null = null;
  const bodyLines: string[] = [];

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

  return { videoId, sections };
}

function SectionBody({ body, accentColor }: { body: string; accentColor: string }) {
  const lines = body.split('\n');
  return (
    <div className="space-y-1 px-4 py-3">
      {lines.map((line, i) => {
        const trimmed = line.trim();
        if (!trimmed) {
          // eslint-disable-next-line react/no-array-index-key
          return <div key={i} className="h-1.5" />;
        }
        if (/^[-•]/.test(trimmed)) {
          const text = trimmed.replace(/^[-•]\s*/, '');
          return (
            // eslint-disable-next-line react/no-array-index-key
            <div key={i} className="flex items-start gap-2.5">
              <span
                className="mt-1.75 size-1.5 shrink-0 rounded-full"
                style={{ backgroundColor: accentColor }}
              />
              <span className="text-sm leading-relaxed text-slate-700">{text}</span>
            </div>
          );
        }
        // eslint-disable-next-line react/no-array-index-key
        return <p key={i} className="text-sm leading-relaxed text-slate-700">{trimmed}</p>;
      })}
    </div>
  );
}

interface LessonContentPreviewProps {
  content: string;
  category?: string;
}

export default function LessonContentPreview({ content, category = 'Catching' }: LessonContentPreviewProps) {
  const accentColor = CATEGORY_ACCENT[category] ?? '#FF6B35';
  const { videoId, sections } = parseLessonContent(content);

  if (!content.trim()) {
    return (
      <div className="rounded-xl border border-dashed border-slate-300 p-6 text-center text-sm text-slate-400">
        Chưa có nội dung bài học.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {videoId && (
        <a
          href={`https://www.youtube.com/watch?v=${videoId}`}
          target="_blank"
          rel="noopener noreferrer"
          className="relative block overflow-hidden rounded-xl"
        >
          <div className="relative aspect-video w-full bg-slate-900">
            <img
              src={`https://img.youtube.com/vi/${videoId}/hqdefault.jpg`}
              alt="YouTube thumbnail"
              className="h-full w-full object-cover opacity-80"
            />
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-2">
              <div className="flex size-14 items-center justify-center rounded-full bg-red-600 shadow-lg">
                <Play className="ml-1 size-6 fill-white text-white" />
              </div>
              <span className="rounded-full bg-black/50 px-3 py-1 text-xs font-medium text-white">
                Xem video hướng dẫn trên YouTube
              </span>
            </div>
          </div>
        </a>
      )}

      <div className="flex items-center gap-2">
        <span className="h-5 w-1 rounded-full" style={{ backgroundColor: accentColor }} />
        <h3 className="text-sm font-bold text-slate-900">Nội Dung Bài Học</h3>
      </div>

      <div className="space-y-2">
        {sections.map((section, i) => (
          // eslint-disable-next-line react/no-array-index-key -- sections parsed from plain-text have no stable id
          <div key={i} className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
            {section.heading && (
              <div
                className="border-b px-4 py-2.5 text-sm font-bold leading-snug"
                style={{
                  backgroundColor: `${accentColor}18`,
                  borderColor: `${accentColor}25`,
                  color: accentColor,
                }}
              >
                {section.heading}
              </div>
            )}
            {section.body && <SectionBody body={section.body} accentColor={accentColor} />}
          </div>
        ))}
      </div>
    </div>
  );
}
