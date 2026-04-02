'use client';

import { AlertTriangle, CheckCircle, Info, XCircle } from 'lucide-react';

type CalloutType = 'warning' | 'danger' | 'success' | 'info';

type ContentBlock
  = | { type: 'image'; url: string; caption: string }
    | { type: 'callout'; calloutType: CalloutType; text: string }
    | { type: 'markdown'; lines: string[] };

const CALLOUT_TRIGGERS: Record<string, CalloutType> = {
  '⚠️': 'warning',
  '🚫': 'danger',
  '❌': 'danger',
  '✅': 'success',
  '☑️': 'success',
  'ℹ️': 'info',
  '💡': 'info',
  '📌': 'info',
};

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;');
}

function renderInline(raw: string): string {
  return escapeHtml(raw)
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    .replace(/~~(.+?)~~/g, '<del>$1</del>')
    .replace(/`(.+?)`/g, '<code class="bg-slate-100 px-1 rounded text-xs font-mono">$1</code>');
}

export function parseContent(content: string): ContentBlock[] {
  const lines = content.split('\n');
  const blocks: ContentBlock[] = [];
  let mdLines: string[] = [];
  let currentCallout: { calloutType: CalloutType; text: string } | null = null;

  const flushMd = () => {
    if (mdLines.length > 0) {
      blocks.push({ type: 'markdown', lines: [...mdLines] });
      mdLines = [];
    }
  };

  const flushCallout = () => {
    if (currentCallout) {
      blocks.push({ type: 'callout', ...currentCallout });
      currentCallout = null;
    }
  };

  const IMAGE_RE = /^!\[([^\]]*)\]\(([^)]+)\)/;

  for (const line of lines) {
    const imgMatch = line.match(IMAGE_RE);
    if (imgMatch) {
      flushMd();
      flushCallout();
      blocks.push({ type: 'image', url: imgMatch[2] ?? '', caption: imgMatch[1] ?? '' });
      continue;
    }

    if (line.startsWith('> ')) {
      const text = line.slice(2);
      const emoji = Object.keys(CALLOUT_TRIGGERS).find(e => text.startsWith(e));
      if (emoji) {
        const calloutType = CALLOUT_TRIGGERS[emoji] as CalloutType;
        const calloutText = text.replace(emoji, '').trimStart();
        flushMd();
        if (currentCallout && currentCallout.calloutType === calloutType) {
          currentCallout.text += `\n${calloutText}`;
        } else {
          flushCallout();
          currentCallout = { calloutType, text: calloutText };
        }
        continue;
      }
    }

    flushCallout();
    mdLines.push(line);
  }

  flushMd();
  flushCallout();
  return blocks;
}

function MarkdownLines({ lines }: { lines: string[] }) {
  const elements: React.ReactNode[] = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i] ?? '';

    if (!line.trim()) {
      i++;
      continue;
    }

    if (line === '---') {
      elements.push(<hr key={i} className="my-4 border-slate-200" />);
      i++;
      continue;
    }

    if (line.startsWith('# ')) {
      elements.push(<h1 key={i} className="text-2xl font-bold text-slate-900 mt-4 mb-2" dangerouslySetInnerHTML={{ __html: renderInline(line.slice(2)) }} />);
      i++;
      continue;
    }

    if (line.startsWith('## ')) {
      elements.push(<h2 key={i} className="text-xl font-semibold text-slate-800 mt-4 mb-2" dangerouslySetInnerHTML={{ __html: renderInline(line.slice(3)) }} />);
      i++;
      continue;
    }

    if (line.startsWith('### ')) {
      elements.push(<h3 key={i} className="text-base font-semibold text-slate-800 mt-3 mb-1.5" dangerouslySetInnerHTML={{ __html: renderInline(line.slice(4)) }} />);
      i++;
      continue;
    }

    // Bullet list
    if (line.startsWith('- ') || line.startsWith('* ')) {
      const items: string[] = [];
      while (i < lines.length && (lines[i]?.startsWith('- ') || lines[i]?.startsWith('* '))) {
        items.push(lines[i]!.slice(2));
        i++;
      }
      elements.push(
        <ul key={`ul-${i}`} className="list-disc pl-5 my-2 space-y-0.5">
          {items.map((item, j) => (
            <li key={j} className="text-sm text-slate-700 leading-relaxed" dangerouslySetInnerHTML={{ __html: renderInline(item) }} />
          ))}
        </ul>,
      );
      continue;
    }

    // Ordered list
    if (/^\d+\. /.test(line)) {
      const items: string[] = [];
      while (i < lines.length && /^\d+\. /.test(lines[i] ?? '')) {
        const m = lines[i]!.match(/^\d+\. (.+)/);
        if (m) {
          items.push(m[1]!);
        }
        i++;
      }
      elements.push(
        <ol key={`ol-${i}`} className="list-decimal pl-5 my-2 space-y-0.5">
          {items.map((item, j) => (
            <li key={j} className="text-sm text-slate-700 leading-relaxed" dangerouslySetInnerHTML={{ __html: renderInline(item) }} />
          ))}
        </ol>,
      );
      continue;
    }

    // Table
    if (line.startsWith('|')) {
      const tableLines: string[] = [];
      while (i < lines.length && lines[i]?.startsWith('|')) {
        tableLines.push(lines[i]!);
        i++;
      }
      if (tableLines.length >= 2 && /^\|[-| :]+\|$/.test((tableLines[1] ?? '').trim())) {
        const parseRow = (r: string) =>
          r.split('|').filter((_, idx, arr) => idx > 0 && idx < arr.length - 1).map(c => c.trim());
        const headers = parseRow(tableLines[0]!);
        const rows = tableLines.slice(2).map(parseRow);
        elements.push(
          <div key={`tbl-${i}`} className="my-3 overflow-x-auto">
            <table className="min-w-full text-sm border-collapse border border-slate-200 rounded">
              <thead>
                <tr className="bg-slate-50">
                  {headers.map((h, j) => (
                    <th key={j} className="border border-slate-200 px-3 py-2 text-left font-semibold text-slate-700 text-xs" dangerouslySetInnerHTML={{ __html: renderInline(h) }} />
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((row, j) => (
                  <tr key={j} className="even:bg-slate-50">
                    {row.map((cell, k) => (
                      <td key={k} className="border border-slate-200 px-3 py-2 text-slate-600 text-xs" dangerouslySetInnerHTML={{ __html: renderInline(cell) }} />
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>,
        );
        continue;
      }
    }

    // Blockquote (non-callout)
    if (line.startsWith('> ')) {
      elements.push(
        <blockquote key={i} className="border-l-4 border-slate-300 pl-4 my-2 text-slate-500 italic text-sm" dangerouslySetInnerHTML={{ __html: renderInline(line.slice(2)) }} />,
      );
      i++;
      continue;
    }

    // Paragraph
    elements.push(
      <p key={i} className="text-sm text-slate-700 my-1.5 leading-relaxed" dangerouslySetInnerHTML={{ __html: renderInline(line) }} />,
    );
    i++;
  }

  return <>{elements}</>;
}

const CALLOUT_STYLES = {
  warning: { bg: 'bg-[#FFF3E0]', border: 'border-[#FF8F00]', text: 'text-[#E65100]', Icon: AlertTriangle },
  danger: { bg: 'bg-[#FFEBEE]', border: 'border-[#E53935]', text: 'text-[#B71C1C]', Icon: XCircle },
  success: { bg: 'bg-[#E8F5E9]', border: 'border-[#43A047]', text: 'text-[#1B5E20]', Icon: CheckCircle },
  info: { bg: 'bg-[#E3F2FD]', border: 'border-[#1976D2]', text: 'text-[#0D47A1]', Icon: Info },
};

export default function BlogContentPreview({ content }: { content: string }) {
  if (!content.trim()) {
    return <p className="text-sm text-slate-400 italic">Chưa có nội dung.</p>;
  }

  const blocks = parseContent(content);

  return (
    <div className="space-y-0.5">
      {blocks.map((block, idx) => {
        if (block.type === 'image') {
          return (
            <figure key={idx} className="my-4">
              <div className="relative w-full overflow-hidden rounded-lg" style={{ aspectRatio: '16/9' }}>
                <img
                  src={block.url}
                  alt={block.caption}
                  className="absolute inset-0 h-full w-full object-cover"
                  onError={e => (e.currentTarget.parentElement!.style.display = 'none')}
                />
              </div>
              {block.caption && (
                <figcaption className="mt-1.5 text-center text-xs italic text-slate-500">{block.caption}</figcaption>
              )}
            </figure>
          );
        }

        if (block.type === 'callout') {
          const s = CALLOUT_STYLES[block.calloutType];
          return (
            <div key={idx} className={`flex gap-2.5 rounded-lg border-l-4 px-4 py-3 my-3 ${s.bg} ${s.border}`}>
              <s.Icon className={`size-5 shrink-0 mt-0.5 ${s.text}`} />
              <div
                className={`text-sm leading-relaxed ${s.text}`}
                dangerouslySetInnerHTML={{ __html: renderInline(block.text) }}
              />
            </div>
          );
        }

        return <MarkdownLines key={idx} lines={block.lines} />;
      })}
    </div>
  );
}
