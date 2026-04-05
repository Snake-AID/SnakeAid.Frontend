'use client';

import type {
  BriefRescuerProfileResponse,
  OnDutyRescuerItemResponse,
  ShiftAssignmentResponse,
} from '@/types/operator.type';
import type {
  MissionCompletedPayload,
  RescuerIdleLocationUpdatedPayload,
  RescuerMissionLocationUpdatedPayload,
  RescuerOnlineStatusPayload,
} from '@/types/signalr.type';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { operatorApi } from '@/apis/operator.api';

export type RescuerStatus = 'available' | 'busy' | 'offline';

export interface LiveRescuer {
  id: string;
  name: string;
  status: RescuerStatus;
  lat: number;
  lng: number;
  activeMissions: number;
  inMission?: boolean;
  missionIncidentId?: string;
}

export type ShiftBadgeColor = 'blue' | 'emerald' | 'slate';

export type ShiftAssignmentWithStatus = ShiftAssignmentResponse & {
  fullName: string;
  isOnline: boolean;
  isAvailable: boolean;
  isPast: boolean;
  isCurrent: boolean;
  isUpcoming: boolean;
  shiftBadgeColor: ShiftBadgeColor;
};

export function useOperatorRescuers() {
  const [rescuerRegistry, setRescuerRegistry] = useState<Record<string, BriefRescuerProfileResponse>>({});
  const [onlineRescuers, setOnlineRescuers] = useState<BriefRescuerProfileResponse[]>([]);
  const [onDutySnapshot, setOnDutySnapshot] = useState<OnDutyRescuerItemResponse[]>([]);
  const [shiftAssignments, setShiftAssignments] = useState<ShiftAssignmentResponse[]>([]);
  const [missionLocations, setMissionLocations] = useState<Record<string, { lat: number; lng: number; incidentId: string }>>({});

  const loadOnlineRescuers = useCallback(async () => {
    try {
      const online = await operatorApi.getOnlineRescuers();
      setOnlineRescuers(online);
    } catch (err) {
      console.error('Failed to load online rescuers', err);
    }
  }, []);

  const loadRescuerData = useCallback(async () => {
    try {
      const registry = await operatorApi.getRescuerRegistry();
      setRescuerRegistry(Object.fromEntries(registry.map(item => [item.accountId, item])));
    } catch (err) {
      console.error('Failed to load rescuer registry', err);
    }

    await loadOnlineRescuers();

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
  }, [loadOnlineRescuers]);

  useEffect(() => {
    void loadRescuerData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const shiftStatusByRescuer = useMemo(() => {
    const map = new Map<string, { isOnline: boolean; isAvailable: boolean }>();
    onDutySnapshot.forEach(r => map.set(r.rescuerId, { isOnline: r.isOnline, isAvailable: r.isAvailable }));
    return map;
  }, [onDutySnapshot]);

  const onlineStatusByRescuer = useMemo(() => {
    const map = new Map<string, { isOnline: boolean; isAvailable: boolean }>();
    onlineRescuers.forEach(r => map.set(r.accountId, { isOnline: r.isOnline, isAvailable: r.isAvailable }));
    return map;
  }, [onlineRescuers]);

  const liveRescuers = useMemo<LiveRescuer[]>(() => {
    const list = onlineRescuers
      .map((r) => {
        const missionLoc = missionLocations[r.accountId];

        // Priority: mission location > lastLocation from API > skip if no location
        const lat = missionLoc?.lat ?? r.latitude;
        const lng = missionLoc?.lng ?? r.longitude;

        if (lat === null || lng === null) {
          return null;
        }

        const name = r.account?.fullName ?? r.accountId;
        const activeMissions = r.totalMissions ?? 0;

        const status: RescuerStatus = r.isOnline ? (r.isAvailable ? 'available' : 'busy') : 'offline';

        return {
          id: r.accountId,
          name,
          status,
          lat,
          lng,
          activeMissions,
          inMission: !!missionLoc,
          missionIncidentId: missionLoc?.incidentId,
        };
      })
      .filter(Boolean) as LiveRescuer[];

    return list;
  }, [onlineRescuers, missionLocations]);

  const shiftAssignmentsWithStatus = useMemo<ShiftAssignmentWithStatus[]>(() => {
    const now = new Date();
    const eightHoursLater = new Date(now.getTime() + 8 * 60 * 60 * 1000);

    return shiftAssignments.map((sa) => {
      const snapshotStatus = shiftStatusByRescuer.get(sa.rescuerId);
      const onlineStatus = onlineStatusByRescuer.get(sa.rescuerId);
      const status = onlineStatus ?? snapshotStatus;
      const snapshot = onDutySnapshot.find(r => r.rescuerId === sa.rescuerId);
      const profile = rescuerRegistry[sa.rescuerId];

      let isCurrent = false;
      let isUpcoming = false;
      let isPast = false;
      let shiftBadgeColor: ShiftBadgeColor = 'slate';

      if (sa.shiftStartLocal && sa.shiftEndLocal) {
        const start = new Date(sa.shiftStartLocal);
        const end = new Date(sa.shiftEndLocal);

        isCurrent = start <= now && now <= end;
        isPast = now > end;
        isUpcoming = !isCurrent && !isPast && start <= eightHoursLater;

        // Determine badge color based on shift timing
        if (isCurrent) {
          shiftBadgeColor = 'emerald';
        } else if (isUpcoming) {
          shiftBadgeColor = 'blue';
        } else {
          shiftBadgeColor = 'slate';
        }
      }

      return {
        ...sa,
        fullName: snapshot?.fullName ?? profile?.account?.fullName ?? sa.rescuerId,
        isOnline: status?.isOnline ?? false,
        isAvailable: status?.isAvailable ?? false,
        isPast,
        isCurrent,
        isUpcoming,
        shiftBadgeColor,
      };
    });
  }, [shiftAssignments, shiftStatusByRescuer, onlineStatusByRescuer, onDutySnapshot, rescuerRegistry]);

  const handleRescuerOnlineStatus = useCallback((payload: RescuerOnlineStatusPayload) => {
    // eslint-disable-next-line no-console
    console.log('🟢 RescuerOnlineStatus event:', payload);

    const existingIndex = onlineRescuers.findIndex(r => r.accountId === payload.rescuerId);

    if (existingIndex >= 0) {
      // eslint-disable-next-line no-console
      console.log(`   ✅ Updating online rescuer ${payload.rescuerId}: online=${payload.isOnline}, available=${payload.isAvailable}`);

      if (!payload.isOnline) {
        setOnlineRescuers(prev => prev.filter(r => r.accountId !== payload.rescuerId));
      } else {
        setOnlineRescuers((prev) => {
          const idx = prev.findIndex(r => r.accountId === payload.rescuerId);
          if (idx < 0) {
            return prev;
          }

          const updated = [...prev];
          updated[idx] = {
            ...updated[idx]!,
            isOnline: payload.isOnline,
            isAvailable: payload.isAvailable,
          };
          return updated;
        });
      }
    } else if (payload.isOnline) {
      // Rescuer came online but not in current list: fetch full profile once.
      // eslint-disable-next-line no-console
      console.log(`   ⚠️ Rescuer ${payload.rescuerId} came online, reloading online rescuers...`);
      void loadOnlineRescuers();
    }

    // Also update on-duty snapshot if rescuer is there
    setOnDutySnapshot((prev) => {
      const existingIndex = prev.findIndex(r => r.rescuerId === payload.rescuerId);

      if (existingIndex >= 0) {
        const updated = [...prev];
        const existing = updated[existingIndex]!;
        updated[existingIndex] = {
          ...existing,
          isOnline: payload.isOnline,
          isAvailable: payload.isAvailable,
        };
        return updated;
      }

      return prev;
    });

    // If the backend explicitly reports the rescuer is no longer in mission,
    // clear any stale mission marker so the map switches back to idle/available.
    if (payload.inMission === false) {
      setMissionLocations((prev) => {
        if (!prev[payload.rescuerId]) {
          return prev;
        }

        const next = { ...prev };
        delete next[payload.rescuerId];
        return next;
      });
    }
  }, [onlineRescuers, loadOnlineRescuers]);

  const handleRescuerIdleLocationUpdated = useCallback((payload: RescuerIdleLocationUpdatedPayload) => {
    // eslint-disable-next-line no-console
    console.log('📍 RescuerIdleLocationUpdated event:', payload);

    // Update online rescuers location
    setOnlineRescuers((prev) => {
      return prev.map(r =>
        r.accountId === payload.rescuerId
          ? {
              ...r,
              lastLocationUpdate: new Date().toISOString(),
              latitude: payload.latitude,
              longitude: payload.longitude,
            }
          : r,
      );
    });

    // Also update on-duty snapshot
    setOnDutySnapshot((prev) => {
      return prev.map(r =>
        r.rescuerId === payload.rescuerId
          ? { ...r, latitude: payload.latitude, longitude: payload.longitude }
          : r,
      );
    });
  }, []);

  const handleRescuerMissionLocationUpdated = useCallback((payload: RescuerMissionLocationUpdatedPayload) => {
    // eslint-disable-next-line no-console
    console.log('🚑 RescuerMissionLocationUpdated event:', payload);

    setMissionLocations(prev => ({
      ...prev,
      [payload.rescuerId]: {
        lat: payload.latitude,
        lng: payload.longitude,
        incidentId: payload.incidentId,
      },
    }));
  }, []);

  const handleMissionCompleted = useCallback((payload: MissionCompletedPayload) => {
    // eslint-disable-next-line no-console
    console.log('✅ MissionCompleted event (rescuer disconnected from mission):', payload);

    // Clear mission location when rescuer disconnects from mission hub
    setMissionLocations((prev) => {
      const next = { ...prev };
      delete next[payload.rescuerId];
      return next;
    });

    // Note: Do NOT reload rescuer data here - rescuer may reconnect to RescuerHub
    // and status will be updated via RescuerOnlineStatus event
  }, []);

  const handleIncidentCompleted = useCallback((payload: { incidentId: string; rescuerId: string; completedAt: string }) => {
    // eslint-disable-next-line no-console
    console.log('🎉 IncidentCompleted event (mission actually completed):', payload);

    // Clear mission location
    setMissionLocations((prev) => {
      const next = { ...prev };
      delete next[payload.rescuerId];
      return next;
    });

    // Reload data to update incident status and rescuer availability
    loadOnlineRescuers();
    loadRescuerData();
  }, [loadOnlineRescuers, loadRescuerData]);

  const clearMissionLocation = useCallback((rescuerId: string) => {
    setMissionLocations((prev) => {
      const next = { ...prev };
      delete next[rescuerId];
      return next;
    });
  }, []);

  return {
    rescuerRegistry,
    liveRescuers,
    shiftAssignmentsWithStatus,
    loadRescuerData,
    loadOnlineRescuers,
    clearMissionLocation,
    handleRescuerOnlineStatus,
    handleRescuerIdleLocationUpdated,
    handleRescuerMissionLocationUpdated,
    handleMissionCompleted,
    handleIncidentCompleted,
  };
}
