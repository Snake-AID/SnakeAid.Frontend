'use client';

import type {
  BriefRescuerProfileResponse,
  OnDutyRescuerItemResponse,
  ShiftAssignmentResponse,
} from '@/types/operator.type';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { operatorApi } from '@/apis/operator.api';
import { useRescuerHub } from '@/hooks/useRescuerHub';

export type RescuerStatus = 'available' | 'busy' | 'offline';

export interface LiveRescuer {
  id: string;
  name: string;
  status: RescuerStatus;
  lat: number;
  lng: number;
  activeMissions: number;
}

export type ShiftAssignmentWithStatus = ShiftAssignmentResponse & {
  fullName: string;
  isOnline: boolean;
  isAvailable: boolean;
  isPast: boolean;
};

export function useOperatorRescuers() {
  const [rescuerRegistry, setRescuerRegistry] = useState<Record<string, BriefRescuerProfileResponse>>({});
  const [onDutySnapshot, setOnDutySnapshot] = useState<OnDutyRescuerItemResponse[]>([]);
  const [shiftAssignments, setShiftAssignments] = useState<ShiftAssignmentResponse[]>([]);

  const getShiftStartEnd = (shiftDate: Date, shift: { startTime: string; endTime: string }) => {
    const [startHourStr, startMinStr] = (shift.startTime ?? '').split(':');
    const [endHourStr, endMinStr] = (shift.endTime ?? '').split(':');

    const startHour = Number(startHourStr);
    const startMin = Number(startMinStr);
    const endHour = Number(endHourStr);
    const endMin = Number(endMinStr);

    const start = new Date(shiftDate);
    const end = new Date(shiftDate);

    if (Number.isNaN(startHour) || Number.isNaN(startMin) || Number.isNaN(endHour) || Number.isNaN(endMin)) {
      return { start: null, end: null };
    }

    start.setHours(startHour, startMin, 0, 0);
    end.setHours(endHour, endMin, 0, 0);

    // Overnight shift (end <= start means end is next day)
    if (end <= start) {
      end.setDate(end.getDate() + 1);
    }

    return { start, end };
  };

  const getShiftDate = (shiftAssignment: ShiftAssignmentResponse): Date => {
    if (shiftAssignment.shiftStartLocal) {
      const parsed = new Date(shiftAssignment.shiftStartLocal);
      if (!Number.isNaN(parsed.getTime())) {
        return parsed;
      }
    }
    return new Date(shiftAssignment.date);
  };

  const isShiftPast = (shiftAssignment: ShiftAssignmentResponse, shift: { startTime: string; endTime: string }) => {
    const now = new Date();
    const shiftDate = getShiftDate(shiftAssignment);
    const { end } = getShiftStartEnd(shiftDate, shift);
    if (!end) {
      return false;
    }
    return now > end;
  };

  const shiftStatusByRescuer = useMemo(() => {
    const map = new Map<string, { isOnline: boolean; isAvailable: boolean }>();
    onDutySnapshot.forEach(r => map.set(r.rescuerId, { isOnline: r.isOnline, isAvailable: r.isAvailable }));
    return map;
  }, [onDutySnapshot]);

  const liveRescuers = useMemo<LiveRescuer[]>(() => {
    const list = onDutySnapshot
      .filter(r => r.isOnline)
      .map((r) => {
        const lat = r.latitude;
        const lng = r.longitude;
        if (lat === null || lng === null) {
          return null;
        }

        const profile = rescuerRegistry[r.rescuerId];
        const name = profile?.account?.fullName ?? r.fullName ?? r.rescuerId;
        const activeMissions = profile?.totalMissions ?? 0;

        const status: RescuerStatus = r.isAvailable ? 'available' : 'busy';

        return {
          id: r.rescuerId,
          name,
          status,
          lat,
          lng,
          activeMissions,
        };
      })
      .filter(Boolean) as LiveRescuer[];

    return list;
  }, [onDutySnapshot, rescuerRegistry]);

  const shiftAssignmentsWithStatus = useMemo<ShiftAssignmentWithStatus[]>(() =>
    shiftAssignments
      .map((sa) => {
        const status = shiftStatusByRescuer.get(sa.rescuerId);
        const snapshot = onDutySnapshot.find(r => r.rescuerId === sa.rescuerId);
        const profile = rescuerRegistry[sa.rescuerId];
        return {
          ...sa,
          fullName: snapshot?.fullName ?? profile?.account?.fullName ?? sa.rescuerId,
          isOnline: status?.isOnline ?? false,
          isAvailable: status?.isAvailable ?? false,
          isPast: isShiftPast(sa, sa.shift),
        };
      // eslint-disable-next-line react-hooks/exhaustive-deps
      }), [shiftAssignments, shiftStatusByRescuer, onDutySnapshot, rescuerRegistry]);

  const loadRescuerData = useCallback(async () => {
    try {
      const registry = await operatorApi.getRescuerRegistry();
      setRescuerRegistry(Object.fromEntries(registry.map(item => [item.accountId, item])));
    } catch (err) {
      console.error('Failed to load rescuer registry', err);
    }

    try {
      const snapshot = await operatorApi.getOnDutyRescuers();
      setOnDutySnapshot(snapshot.rescuers);
    } catch (err) {
      console.error('Failed to load on-duty rescuer snapshot', err);
    }

    try {
      const shifts = await operatorApi.getTodayShiftAssignments();
      setShiftAssignments(shifts);
    } catch (err) {
      console.error('Failed to load today shift assignments', err);
    }
  }, []);

  useEffect(() => {
    loadRescuerData();
  }, [loadRescuerData]);

  const handleRescuerOnlineStatus = useCallback(() => {
    loadRescuerData();
  }, [loadRescuerData]);

  const handleRescuerIdleLocationUpdated = useCallback(() => {
    loadRescuerData();
  }, [loadRescuerData]);

  useRescuerHub({
    onRescuerOnlineStatus: handleRescuerOnlineStatus,
    onRescuerIdleLocationUpdated: handleRescuerIdleLocationUpdated,
  });

  return {
    rescuerRegistry,
    liveRescuers,
    shiftAssignmentsWithStatus,
    loadRescuerData,
  };
}
