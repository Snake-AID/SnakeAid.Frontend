'use client';

import type { SnakeSpeciesDetail } from '@/types/snake-species.type';
import { AlertTriangle, Bug, Loader2, Shield, Skull, Zap } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { snakeSpeciesApi } from '@/apis/snake-species.api';

/* ─────────────────────────────────────────────
   Helpers
───────────────────────────────────────────── */

const VENOM_TYPE_LABEL: Record<string, string> = {
  Neurotoxic: 'Độc thần kinh',
  Hemotoxic: 'Độc máu',
  Cytotoxic: 'Độc tế bào',
  Myotoxic: 'Độc cơ',
  None: 'Không độc',
};

function getRiskStyle(level: number) {
  if (level >= 4) {
    return { label: 'Cực kỳ nguy hiểm', bg: 'bg-red-100', text: 'text-red-700', bar: 'bg-red-500', ring: 'ring-red-300' };
  }
  if (level === 3) {
    return { label: 'Nguy hiểm', bg: 'bg-orange-100', text: 'text-orange-700', bar: 'bg-orange-400', ring: 'ring-orange-300' };
  }
  if (level === 2) {
    return { label: 'Trung bình', bg: 'bg-amber-100', text: 'text-amber-700', bar: 'bg-amber-400', ring: 'ring-amber-300' };
  }
  return { label: 'Thấp', bg: 'bg-emerald-100', text: 'text-emerald-700', bar: 'bg-emerald-500', ring: 'ring-emerald-300' };
}

/* ─────────────────────────────────────────────
   Props
───────────────────────────────────────────── */

export interface SnakeSpeciesInfoCardProps {
  speciesId: number;
  speciesName?: string | null;
  quantity?: number | null;
}

/* ─────────────────────────────────────────────
   Component
───────────────────────────────────────────── */

export default function SnakeSpeciesInfoCard({
  speciesId,
  speciesName,
  quantity,
}: SnakeSpeciesInfoCardProps) {
  const [detail, setDetail] = useState<SnakeSpeciesDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  // Use a ref to track cancelled state — avoids calling setState directly inside effect body
  const cancelledRef = useRef(false);

  useEffect(() => {
    cancelledRef.current = false;

    const doFetch = async () => {
      setLoading(true);
      setError(false);
      try {
        const data = await snakeSpeciesApi.getById(speciesId);
        if (!cancelledRef.current) {
          setDetail(data);
          setLoading(false);
        }
      } catch {
        if (!cancelledRef.current) {
          setError(true);
          setLoading(false);
        }
      }
    };

    void doFetch();

    return () => {
      cancelledRef.current = true;
    };
  }, [speciesId]);

  /* ── Loading skeleton ── */
  if (loading) {
    return (
      <div className="flex animate-pulse items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 p-3">
        <div className="h-14 w-14 shrink-0 rounded-lg bg-slate-200" />
        <div className="flex-1 space-y-2">
          <div className="h-3.5 w-3/5 rounded bg-slate-200" />
          <div className="h-3 w-2/5 rounded bg-slate-200" />
          <div className="h-3 w-4/5 rounded bg-slate-200" />
        </div>
        <Loader2 className="size-4 shrink-0 animate-spin text-slate-300" />
      </div>
    );
  }

  /* ── Error / fallback ── */
  if (error || !detail) {
    return (
      <div className="flex items-center gap-3 rounded-xl border border-rose-200 bg-rose-50 p-3">
        <AlertTriangle className="size-5 shrink-0 text-rose-400" />
        <div>
          <p className="text-sm font-semibold text-slate-800">{speciesName ?? 'Không rõ loài'}</p>
          <p className="text-xs text-rose-600">Không thể tải thông tin loài.</p>
        </div>
        {quantity != null && (
          <span className="ml-auto rounded-full border border-slate-300 bg-white px-2.5 py-0.5 text-sm font-bold text-slate-700">
            x
            {quantity}
          </span>
        )}
      </div>
    );
  }

  const risk = getRiskStyle(detail.riskLevel);
  const venomLabel = detail.primaryVenomType
    ? (VENOM_TYPE_LABEL[detail.primaryVenomType] ?? detail.primaryVenomType)
    : null;
  const showVenomType = venomLabel && detail.primaryVenomType !== 'None';
  const riskBarWidth = `${(detail.riskLevel / 5) * 100}%`;

  return (
    <div className={`overflow-hidden rounded-xl border border-slate-200 bg-white ring-1 ${risk.ring}`}>

      {/* ── Main row: image + names + badges + quantity ── */}
      <div className="flex gap-3 p-3">

        {/* Thumbnail */}
        {detail.imageUrl
          ? (
              <img
                src={detail.imageUrl}
                alt={detail.commonName}
                className="h-16 w-16 shrink-0 rounded-lg border border-slate-200 object-cover"
              />
            )
          : (
              <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-lg border border-slate-200 bg-slate-100">
                <Bug className="size-7 text-slate-400" />
              </div>
            )}

        {/* Names + badges */}
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-bold text-slate-900">{detail.commonName}</p>
          <p className="truncate text-xs italic text-slate-400">{detail.scientificName}</p>

          <div className="mt-1.5 flex flex-wrap gap-1">

            {/* Venomous / non-venomous */}
            {detail.isVenomous
              ? (
                  <span className="inline-flex items-center gap-1 rounded-full bg-red-100 px-2 py-0.5 text-[11px] font-bold text-red-700">
                    <Skull className="size-3" />
                    Có độc
                  </span>
                )
              : (
                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-[11px] font-bold text-emerald-700">
                    <Shield className="size-3" />
                    Không độc
                  </span>
                )}

            {/* Venom type */}
            {showVenomType && (
              <span className="inline-flex items-center rounded-full bg-purple-100 px-2 py-0.5 text-[11px] font-semibold text-purple-700">
                {venomLabel}
              </span>
            )}

            {/* Risk level */}
            <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-bold ${risk.bg} ${risk.text}`}>
              <Zap className="size-3" />
              {risk.label}
            </span>

          </div>
        </div>

        {/* Quantity pill */}
        {quantity != null && (
          <div className="flex shrink-0 flex-col items-center justify-center rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1 text-center">
            <span className="text-lg font-bold text-slate-800">{quantity}</span>
            <span className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">con</span>
          </div>
        )}
      </div>

      {/* ── Risk bar ── */}
      <div className="px-3 pb-2">
        <div className="h-1 w-full overflow-hidden rounded-full bg-slate-100">
          <div
            className={`h-full rounded-full ${risk.bar}`}
            style={{ width: riskBarWidth }}
          />
        </div>
      </div>

      {/* ── Identification summary — key for operator to confirm with customer ── */}
      {detail.identificationSummary && (
        <div className="border-t border-slate-100 px-3 py-2.5">
          <p className="mb-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">
            Nhận dạng — xác nhận với khách
          </p>
          <p className="text-xs leading-relaxed text-slate-600">{detail.identificationSummary}</p>
        </div>
      )}

    </div>
  );
}
