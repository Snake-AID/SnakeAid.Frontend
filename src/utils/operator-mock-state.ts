'use client';

import { useSyncExternalStore } from 'react';

export type IncidentStage
  = | 'Pending'
    | 'Verified'
    | 'Contacting'
    | 'Dispatched'
    | 'Assigned'
    | 'EnRoute'
    | 'Completed'
    | 'FalseAlarm';

export type IncidentBucket = 'queue' | 'progress' | 'history';
export type RescuerStatus = 'available' | 'busy' | 'offline';

export interface TimelineItem {
  label: string;
  at: string;
  done: boolean;
}

export interface SuggestedRescuer {
  id: number;
  name: string;
  distanceKm: number;
  etaMin: number;
  status: RescuerStatus;
  shift: string;
}

export interface OperatorRescuer {
  id: number;
  name: string;
  rating: number;
  status: RescuerStatus;
  inShift: boolean;
  lat: number;
  lng: number;
  shift: string;
  activeMissions: number;
}

export interface OperatorIncident {
  id: number;
  code: string;
  reporter: string;
  phone: string;
  createdAt: string;
  district: string;
  address: string;
  lat: number;
  lng: number;
  stage: IncidentStage;
  bucket: IncidentBucket;
  priority: 'Critical' | 'High' | 'Medium';
  notes: string;
  eventHistory: string[];
  needsRedispatch?: boolean;
  currentRescuerId?: number;
  eta?: string;
  timeline: TimelineItem[];
  suggestedRescuers: SuggestedRescuer[];
}

interface OperatorMockState {
  incidents: OperatorIncident[];
  rescuers: OperatorRescuer[];
  toastMessage: string;
  focusedIncidentId: number | null;
}

const baseRescuers: OperatorRescuer[] = [
  { id: 1, name: 'Đội cứu hộ A', rating: 4.9, status: 'available', inShift: true, lat: 10.8015, lng: 106.7348, shift: '08:00 - 16:00', activeMissions: 0 },
  { id: 2, name: 'Đội cứu hộ B', rating: 4.7, status: 'busy', inShift: true, lat: 10.7412, lng: 106.6667, shift: '08:00 - 16:00', activeMissions: 1 },
  { id: 3, name: 'Đội cứu hộ C', rating: 4.8, status: 'available', inShift: true, lat: 10.8076, lng: 106.7131, shift: '08:00 - 16:00', activeMissions: 0 },
  { id: 4, name: 'Đội cứu hộ D', rating: 4.6, status: 'offline', inShift: true, lat: 10.8321, lng: 106.7478, shift: '08:00 - 16:00', activeMissions: 0 },
  { id: 5, name: 'Đội cứu hộ E', rating: 4.5, status: 'available', inShift: false, lat: 10.7688, lng: 106.6619, shift: '16:00 - 00:00', activeMissions: 0 },
  { id: 6, name: 'Đội cứu hộ F', rating: 4.4, status: 'available', inShift: true, lat: 10.8233, lng: 106.6297, shift: '08:00 - 16:00', activeMissions: 0 },
  { id: 7, name: 'Đội cứu hộ G', rating: 4.6, status: 'available', inShift: true, lat: 10.7759, lng: 106.7295, shift: '08:00 - 16:00', activeMissions: 0 },
];

const baseIncidents: OperatorIncident[] = [
  {
    id: 1,
    code: 'INC-240315-017',
    reporter: 'Nguyễn Hoài Thu',
    phone: '0909 221 118',
    createdAt: '09:12',
    district: 'Q.7',
    address: 'Nguyen Thi Thap, Tan Hung, Q.7',
    lat: 10.7325,
    lng: 106.7218,
    stage: 'Verified',
    bucket: 'queue',
    priority: 'Critical',
    notes: 'Người nhà báo có rắn trong nhà bếp, đã gửi ảnh và định vị.',
    eventHistory: ['09:12 Tạo SOS', '09:14 Điều phối viên gọi xác minh', '09:16 Đã xác minh'],
    timeline: [
      { label: 'Created', at: '09:12', done: true },
      { label: 'Contacting', at: '09:14', done: true },
      { label: 'Verified', at: '09:16', done: true },
      { label: 'Dispatched', at: '--:--', done: false },
      { label: 'Assigned', at: '--:--', done: false },
      { label: 'EnRoute', at: '--:--', done: false },
      { label: 'Completed', at: '--:--', done: false },
    ],
    suggestedRescuers: [],
  },
  {
    id: 2,
    code: 'INC-240315-014',
    reporter: 'Trần Gia Bảo',
    phone: '0918 435 999',
    createdAt: '08:47',
    district: 'Thủ Đức',
    address: 'Kha Van Can, Linh Tay, Thủ Đức',
    lat: 10.8497,
    lng: 106.7721,
    stage: 'Verified',
    bucket: 'queue',
    priority: 'High',
    notes: 'Case vừa bị hủy nhiệm vụ, cần điều phối lại gấp.',
    eventHistory: ['08:47 Tạo SOS', '08:51 Đã xác minh', '09:02 Đội cứu hộ B hủy nhiệm vụ'],
    needsRedispatch: true,
    timeline: [
      { label: 'Created', at: '08:47', done: true },
      { label: 'Contacting', at: '08:49', done: true },
      { label: 'Verified', at: '08:51', done: true },
      { label: 'Dispatched', at: '08:53', done: true },
      { label: 'Assigned', at: '08:55', done: true },
      { label: 'EnRoute', at: '08:57', done: false },
      { label: 'Completed', at: '--:--', done: false },
    ],
    suggestedRescuers: [],
  },
  {
    id: 3,
    code: 'INC-240315-009',
    reporter: 'Lê Minh Châu',
    phone: '0937 112 443',
    createdAt: '08:05',
    district: 'Bình Thạnh',
    address: 'Dien Bien Phu, Ward 21, Bình Thạnh',
    lat: 10.7769,
    lng: 106.7009,
    stage: 'EnRoute',
    bucket: 'progress',
    priority: 'High',
    notes: 'Đội cứu hộ đang di chuyển, ETA 12 phút.',
    eventHistory: ['08:05 Tạo SOS', '08:11 Đã xác minh', '08:16 Đã phân công đội A', '08:20 Đội A đang di chuyển'],
    currentRescuerId: 2,
    eta: '12 phút',
    timeline: [
      { label: 'Created', at: '08:05', done: true },
      { label: 'Contacting', at: '08:08', done: true },
      { label: 'Verified', at: '08:11', done: true },
      { label: 'Dispatched', at: '08:13', done: true },
      { label: 'Assigned', at: '08:16', done: true },
      { label: 'EnRoute', at: '08:20', done: true },
      { label: 'Completed', at: '--:--', done: false },
    ],
    suggestedRescuers: [],
  },
  {
    id: 4,
    code: 'INC-240315-003',
    reporter: 'Phạm Quốc Đạt',
    phone: '0976 778 223',
    createdAt: '07:10',
    district: 'Q.1',
    address: 'Nguyen Hue, Ben Nghe, Q.1',
    lat: 10.7739,
    lng: 106.7047,
    stage: 'Completed',
    bucket: 'history',
    priority: 'Medium',
    notes: 'Case đã xử lý xong.',
    eventHistory: ['07:10 Tạo SOS', '07:18 Đã xác minh', '07:26 Đã phân công', '08:02 Hoàn tất'],
    timeline: [
      { label: 'Created', at: '07:10', done: true },
      { label: 'Contacting', at: '07:13', done: true },
      { label: 'Verified', at: '07:18', done: true },
      { label: 'Dispatched', at: '07:20', done: true },
      { label: 'Assigned', at: '07:26', done: true },
      { label: 'EnRoute', at: '07:31', done: true },
      { label: 'Completed', at: '08:02', done: true },
    ],
    suggestedRescuers: [],
  },
];

const listeners = new Set<() => void>();

const toRadians = (value: number) => (value * Math.PI) / 180;

const distanceKm = (lat1: number, lng1: number, lat2: number, lng2: number) => {
  const earthRadius = 6371;
  const dLat = toRadians(lat2 - lat1);
  const dLng = toRadians(lng2 - lng1);
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2)
    + Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) * Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Number.parseFloat((earthRadius * c).toFixed(1));
};

const updateTimelineByStage = (timeline: TimelineItem[], stage: IncidentStage, timestamp: string) => {
  const order: Record<IncidentStage, string[]> = {
    Pending: ['Created'],
    Contacting: ['Created', 'Contacting'],
    Verified: ['Created', 'Contacting', 'Verified'],
    Dispatched: ['Created', 'Contacting', 'Verified', 'Dispatched'],
    Assigned: ['Created', 'Contacting', 'Verified', 'Dispatched', 'Assigned'],
    EnRoute: ['Created', 'Contacting', 'Verified', 'Dispatched', 'Assigned', 'EnRoute'],
    Completed: ['Created', 'Contacting', 'Verified', 'Dispatched', 'Assigned', 'EnRoute', 'Completed'],
    FalseAlarm: ['Created', 'Contacting'],
  };

  const completedSteps = order[stage] ?? [];

  return timeline.map((step) => {
    const done = completedSteps.includes(step.label);
    if (done && step.at === '--:--') {
      return { ...step, done: true, at: timestamp };
    }

    if (!done) {
      return { ...step, done: false };
    }

    return { ...step, done: true };
  });
};

const refreshRescuerLoads = (rescuers: OperatorRescuer[], incidents: OperatorIncident[]) => {
  const missionCount = new Map<number, number>();

  incidents
    .filter(item => item.bucket === 'progress' && item.currentRescuerId)
    .forEach((item) => {
      const current = missionCount.get(item.currentRescuerId as number) ?? 0;
      missionCount.set(item.currentRescuerId as number, current + 1);
    });

  return rescuers.map(rescuer => ({
    ...rescuer,
    activeMissions: missionCount.get(rescuer.id) ?? 0,
  }));
};

const buildSuggestions = (incident: OperatorIncident, rescuers: OperatorRescuer[]): SuggestedRescuer[] => {
  return rescuers
    .map((rescuer) => {
      const km = distanceKm(incident.lat, incident.lng, rescuer.lat, rescuer.lng);
      return {
        id: rescuer.id,
        name: rescuer.name,
        distanceKm: km,
        etaMin: Math.max(4, Math.round(km * 3)),
        status: rescuer.status,
        shift: rescuer.shift,
      };
    })
    .sort((a, b) => a.distanceKm - b.distanceKm);
};

const enrichState = (state: OperatorMockState): OperatorMockState => {
  const rescuers = refreshRescuerLoads(state.rescuers, state.incidents);
  const incidents = state.incidents.map(incident => ({
    ...incident,
    suggestedRescuers: buildSuggestions(incident, rescuers),
  }));

  return {
    ...state,
    incidents,
    rescuers,
  };
};

let store: OperatorMockState = enrichState({
  incidents: baseIncidents,
  rescuers: baseRescuers,
  toastMessage: 'Mock state đã khởi tạo. Queue và Dispatch sử dụng chung dữ liệu.',
  focusedIncidentId: baseIncidents[0]?.id ?? null,
});

const emit = () => {
  listeners.forEach(listener => listener());
};

const updateStore = (updater: (current: OperatorMockState) => OperatorMockState) => {
  store = enrichState(updater(store));
  emit();
};

const nowLabel = () => {
  const date = new Date();
  return `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
};

const reorderIncidentToTop = (incidents: OperatorIncident[], incidentId: number) => {
  const target = incidents.find(item => item.id === incidentId);
  if (!target) {
    return incidents;
  }

  const rest = incidents.filter(item => item.id !== incidentId);
  return [target, ...rest];
};

export const operatorMockActions = {
  clearToast: () => {
    updateStore(current => ({
      ...current,
      toastMessage: '',
    }));
  },

  setFocusedIncidentId: (incidentId: number | null) => {
    updateStore(current => ({
      ...current,
      focusedIncidentId: incidentId,
    }));
  },

  dispatchIncident: (incidentId: number, rescuerId: number) => {
    updateStore((current) => {
      const rescuer = current.rescuers.find(item => item.id === rescuerId);
      if (!rescuer) {
        return {
          ...current,
          toastMessage: 'Không tìm thấy đội cứu hộ để điều phối.',
        };
      }

      const incidents = current.incidents.map((incident) => {
        if (incident.id !== incidentId) {
          return incident;
        }

        return {
          ...incident,
          stage: 'Dispatched' as const,
          bucket: 'progress' as const,
          currentRescuerId: rescuerId,
          needsRedispatch: false,
          eta: `${Math.max(4, Math.round(distanceKm(incident.lat, incident.lng, rescuer.lat, rescuer.lng) * 3))} phút`,
          eventHistory: [...incident.eventHistory, `${nowLabel()} Đã điều phối tới ${rescuer.name}`],
          timeline: updateTimelineByStage(incident.timeline, 'Dispatched', nowLabel()),
        };
      });

      const rescuers = current.rescuers.map((item) => {
        if (item.id !== rescuerId) {
          return item;
        }

        return {
          ...item,
          status: 'busy' as const,
        };
      });

      const incidentCode = incidents.find(item => item.id === incidentId)?.code ?? `INC-${incidentId}`;

      return {
        ...current,
        incidents,
        rescuers,
        toastMessage: `${incidentCode} đã được điều phối cho ${rescuer.name}.`,
        focusedIncidentId: incidentId,
      };
    });
  },

  acceptIncident: (incidentId: number) => {
    updateStore((current) => {
      const incidents = current.incidents.map((incident) => {
        if (incident.id !== incidentId) {
          return incident;
        }

        return {
          ...incident,
          stage: 'Assigned' as const,
          bucket: 'progress' as const,
          needsRedispatch: false,
          eventHistory: [...incident.eventHistory, `${nowLabel()} RescuerAccepted`],
          timeline: updateTimelineByStage(incident.timeline, 'Assigned', nowLabel()),
        };
      });

      const incidentCode = incidents.find(item => item.id === incidentId)?.code ?? `INC-${incidentId}`;
      return {
        ...current,
        incidents,
        toastMessage: `${incidentCode} đã được đội cứu hộ xác nhận nhận lệnh.`,
        focusedIncidentId: incidentId,
      };
    });
  },

  abortIncident: (incidentId: number) => {
    updateStore((current) => {
      const target = current.incidents.find(item => item.id === incidentId);
      if (!target) {
        return current;
      }

      const incidentsUpdated = current.incidents.map((incident) => {
        if (incident.id !== incidentId) {
          return incident;
        }

        return {
          ...incident,
          stage: 'Verified' as const,
          bucket: 'queue' as const,
          needsRedispatch: true,
          eta: undefined,
          currentRescuerId: undefined,
          eventHistory: [...incident.eventHistory, `${nowLabel()} RescuerAborted - cần điều phối lại`],
          timeline: updateTimelineByStage(incident.timeline, 'Verified', nowLabel()),
        };
      });

      const incidents = reorderIncidentToTop(incidentsUpdated, incidentId);
      const rescuers = target.currentRescuerId
        ? current.rescuers.map((rescuer) => {
            if (rescuer.id !== target.currentRescuerId) {
              return rescuer;
            }

            return {
              ...rescuer,
              status: 'available' as const,
            };
          })
        : current.rescuers;

      return {
        ...current,
        incidents,
        rescuers,
        toastMessage: `${target.code} bị hủy nhiệm vụ. Case đã được đẩy lên đầu hàng chờ.`,
        focusedIncidentId: incidentId,
      };
    });
  },

  markFalseAlarm: (incidentId: number) => {
    updateStore((current) => {
      const target = current.incidents.find(item => item.id === incidentId);
      if (!target) {
        return current;
      }

      const incidents = current.incidents.map((incident) => {
        if (incident.id !== incidentId) {
          return incident;
        }

        return {
          ...incident,
          stage: 'FalseAlarm' as const,
          bucket: 'history' as const,
          needsRedispatch: false,
          eta: undefined,
          eventHistory: [...incident.eventHistory, `${nowLabel()} Đánh dấu báo động giả`],
          timeline: updateTimelineByStage(incident.timeline, 'FalseAlarm', nowLabel()),
        };
      });

      const rescuers = target.currentRescuerId
        ? current.rescuers.map(rescuer => rescuer.id === target.currentRescuerId ? { ...rescuer, status: 'available' as const } : rescuer)
        : current.rescuers;

      return {
        ...current,
        incidents,
        rescuers,
        toastMessage: `${target.code} đã được đánh dấu báo động giả.`,
      };
    });
  },

  markContacting: (incidentId: number) => {
    updateStore((current) => {
      const incidents = current.incidents.map((incident) => {
        if (incident.id !== incidentId) {
          return incident;
        }

        return {
          ...incident,
          stage: 'Contacting' as const,
          bucket: 'queue' as const,
          eventHistory: [...incident.eventHistory, `${nowLabel()} Điều phối viên gọi lại người báo tin`],
          timeline: updateTimelineByStage(incident.timeline, 'Contacting', nowLabel()),
        };
      });

      const incidentCode = incidents.find(item => item.id === incidentId)?.code ?? `INC-${incidentId}`;

      return {
        ...current,
        incidents,
        toastMessage: `${incidentCode} đã chuyển sang trạng thái liên hệ lại.`,
        focusedIncidentId: incidentId,
      };
    });
  },

  pinRedispatch: (incidentId: number) => {
    updateStore((current) => {
      const incidents = reorderIncidentToTop(
        current.incidents.map((incident) => {
          if (incident.id !== incidentId) {
            return incident;
          }

          return {
            ...incident,
            stage: 'Verified' as const,
            bucket: 'queue' as const,
            needsRedispatch: true,
            eventHistory: [...incident.eventHistory, `${nowLabel()} Đẩy case lên đầu hàng chờ điều phối lại`],
            timeline: updateTimelineByStage(incident.timeline, 'Verified', nowLabel()),
          };
        }),
        incidentId,
      );

      const incidentCode = incidents.find(item => item.id === incidentId)?.code ?? `INC-${incidentId}`;

      return {
        ...current,
        incidents,
        toastMessage: `${incidentCode} đã được đẩy lên đầu hàng chờ.`,
        focusedIncidentId: incidentId,
      };
    });
  },

  completeIncident: (incidentId: number) => {
    updateStore((current) => {
      const target = current.incidents.find(item => item.id === incidentId);
      if (!target) {
        return current;
      }

      const incidents = current.incidents.map((incident) => {
        if (incident.id !== incidentId) {
          return incident;
        }

        return {
          ...incident,
          stage: 'Completed' as const,
          bucket: 'history' as const,
          needsRedispatch: false,
          eventHistory: [...incident.eventHistory, `${nowLabel()} Đã hoàn tất case`],
          timeline: updateTimelineByStage(incident.timeline, 'Completed', nowLabel()),
        };
      });

      const rescuers = target.currentRescuerId
        ? current.rescuers.map(rescuer => rescuer.id === target.currentRescuerId ? { ...rescuer, status: 'available' as const } : rescuer)
        : current.rescuers;

      return {
        ...current,
        incidents,
        rescuers,
        toastMessage: `${target.code} đã hoàn tất.`,
      };
    });
  },
};

const subscribe = (listener: () => void) => {
  listeners.add(listener);
  return () => listeners.delete(listener);
};

const getSnapshot = () => store;
const getServerSnapshot = () => store;

export const useOperatorMockState = () => {
  const snapshot = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  return {
    ...snapshot,
    ...operatorMockActions,
  };
};
