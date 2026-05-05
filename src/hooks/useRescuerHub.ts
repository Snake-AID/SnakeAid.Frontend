'use client';

import type { HubConnection } from '@microsoft/signalr';
import type {
  AdminLogPayload,
  DispatchRequestedPayload,
  IncidentCancelledPayload,
  IncidentClaimedPayload,
  IncidentFalseAlarmPayload,
  IncidentNoAnswerPayload,
  MissionCompletedPayload,
  NewIncidentCreatedPayload,
  OperatorContactingPayload,
  OperatorOnlineStatusPayload,
  RescuerAbortedPayload,
  RescuerAcceptedPayload,
  RescuerDeclinedPayload,
  RescuerDispatchedPayload,
  RescuerIdleLocationUpdatedPayload,
  RescuerMissionLocationUpdatedPayload,
  RescuerOnlineStatusPayload,
} from '@/types/signalr.type';
import type {
  SnakeCatchingMissionAbortedPayload,
  SnakeCatchingMissionCompletedPayload,
  SnakeCatchingRequestAssignedPayload,
  SnakeCatchingRequestCancelledPayload,
  SnakeCatchingRequestConfirmedPayload,
  SnakeCatchingRequestCreatedPayload,
} from '@/types/snakecatching-request.type';
import { HubConnectionState } from '@microsoft/signalr';

import { useEffect, useRef, useState } from 'react';

import { storage } from '@/utils';
import { getStoredUser } from '@/utils/auth-session';
import { createRescuerHubConnection } from '@/utils/signalR';

export interface RescuerHubEvents {
  onRescuerOnlineStatus?: (payload: RescuerOnlineStatusPayload) => void;
  onRescuerIdleLocationUpdated?: (payload: RescuerIdleLocationUpdatedPayload) => void;
  onRescuerAccepted?: (payload: RescuerAcceptedPayload) => void;
  onRescuerDeclined?: (payload: RescuerDeclinedPayload) => void;
  onNewIncidentCreated?: (payload: NewIncidentCreatedPayload) => void;
  onSnakeCatchingRequestCreated?: (payload: SnakeCatchingRequestCreatedPayload) => void;
  onSnakeCatchingRequestAccepted?: (payload: SnakeCatchingRequestConfirmedPayload) => void;
  onSnakeCatchingRequestAssigned?: (payload: SnakeCatchingRequestAssignedPayload) => void;
  onSnakeCatchingRequestCancelled?: (payload: SnakeCatchingRequestCancelledPayload) => void;
  onSnakeCatchingMissionAborted?: (payload: SnakeCatchingMissionAbortedPayload) => void;
  onSnakeCatchingMissionCompleted?: (payload: SnakeCatchingMissionCompletedPayload) => void;
  onOperatorOnlineStatus?: (payload: OperatorOnlineStatusPayload) => void;
  onAdminLog?: (payload: AdminLogPayload) => void;
  onIncidentClaimed?: (payload: IncidentClaimedPayload) => void;
  onOperatorContacting?: (payload: OperatorContactingPayload) => void;
  onDispatchRequested?: (payload: DispatchRequestedPayload) => void;
  onIncidentFalseAlarm?: (payload: IncidentFalseAlarmPayload) => void;
  onIncidentNoAnswer?: (payload: IncidentNoAnswerPayload) => void;
  onRescuerDispatched?: (payload: RescuerDispatchedPayload) => void;
  onIncidentCancelled?: (payload: IncidentCancelledPayload) => void;
  onRescuerAborted?: (payload: RescuerAbortedPayload) => void;
  onRescuerMissionLocationUpdated?: (payload: RescuerMissionLocationUpdatedPayload) => void;
  onMissionCompleted?: (payload: MissionCompletedPayload) => void;
  onIncidentCompleted?: (payload: { incidentId: string; rescuerId: string; completedAt: string }) => void;
};

const ACCESS_TOKEN_KEY = 'access_token';

const getAccessToken = () => storage.get<string>(ACCESS_TOKEN_KEY) ?? '';

const attachHandlers = (connection: HubConnection, handlersRef: React.MutableRefObject<RescuerHubEvents>) => {
  // Backend sends events in lowercase, so we need to listen with lowercase event names
  // Use wrapper functions that reference handlersRef.current to always get latest handlers
  connection.on('rescueronlinestatus', (payload) => {
    handlersRef.current.onRescuerOnlineStatus?.(payload);
  });

  connection.on('rescueridlelocationupdated', (payload) => {
    handlersRef.current.onRescuerIdleLocationUpdated?.(payload);
  });

  connection.on('rescueraccepted', (payload) => {
    handlersRef.current.onRescuerAccepted?.(payload);
  });

  connection.on('rescuerdeclined', (payload) => {
    handlersRef.current.onRescuerDeclined?.(payload);
  });

  connection.on('newincidentcreated', (payload) => {
    handlersRef.current.onNewIncidentCreated?.(payload);
  });

  connection.on('snakecatchingrequestcreated', (payload) => {
    handlersRef.current.onSnakeCatchingRequestCreated?.(payload);
  });

  connection.on('snakecatchingrequestaccepted', (payload) => {
    handlersRef.current.onSnakeCatchingRequestAccepted?.(payload);
  });

  connection.on('snakecatchingrequestassigned', (payload) => {
    handlersRef.current.onSnakeCatchingRequestAssigned?.(payload);
  });
  connection.on('SnakeCatchingRequestAssigned', (payload) => {
    handlersRef.current.onSnakeCatchingRequestAssigned?.(payload);
  });

  connection.on('snakecatchingrequestcancelled', (payload) => {
    handlersRef.current.onSnakeCatchingRequestCancelled?.(payload);
  });

  connection.on('snakecatchingmissionaborted', (payload) => {
    handlersRef.current.onSnakeCatchingMissionAborted?.(payload);
  });
  connection.on('SnakeCatchingMissionAborted', (payload) => {
    handlersRef.current.onSnakeCatchingMissionAborted?.(payload);
  });

  connection.on('snakecatchingmissioncompleted', (payload) => {
    handlersRef.current.onSnakeCatchingMissionCompleted?.(payload);
  });
  connection.on('SnakeCatchingMissionCompleted', (payload) => {
    handlersRef.current.onSnakeCatchingMissionCompleted?.(payload);
  });

  connection.on('operatoronlinestatus', (payload) => {
    handlersRef.current.onOperatorOnlineStatus?.(payload);
  });

  connection.on('incidentclaimed', (payload) => {
    handlersRef.current.onIncidentClaimed?.(payload);
  });

  connection.on('operatorcontacting', (payload) => {
    handlersRef.current.onOperatorContacting?.(payload);
  });

  connection.on('dispatchrequested', (payload) => {
    handlersRef.current.onDispatchRequested?.(payload);
  });

  connection.on('incidentfalsealarm', (payload) => {
    handlersRef.current.onIncidentFalseAlarm?.(payload);
  });

  connection.on('incidentnoanswer', (payload) => {
    handlersRef.current.onIncidentNoAnswer?.(payload);
  });

  connection.on('rescuerdispatched', (payload) => {
    handlersRef.current.onRescuerDispatched?.(payload);
  });

  connection.on('incidentcancelled', (payload) => {
    handlersRef.current.onIncidentCancelled?.(payload);
  });

  connection.on('rescueraborted', (payload: RescuerAbortedPayload) => {
    // eslint-disable-next-line no-console
    console.log('[SignalR][RescuerHub] rescueraborted received:', payload);
    handlersRef.current.onRescuerAborted?.(payload);
  });
  connection.on('RescuerAborted', (payload: RescuerAbortedPayload) => {
    // eslint-disable-next-line no-console
    console.log('[SignalR][RescuerHub] RescuerAborted received:', payload);
    handlersRef.current.onRescuerAborted?.(payload);
  });

  connection.on('adminlog', (payload) => {
    handlersRef.current.onAdminLog?.(payload);
  });

  connection.on('rescuermissionlocationupdated', (payload) => {
    handlersRef.current.onRescuerMissionLocationUpdated?.(payload);
  });

  connection.on('missioncompleted', (payload) => {
    handlersRef.current.onMissionCompleted?.(payload);
  });

  connection.on('incidentcompleted', (payload) => {
    handlersRef.current.onIncidentCompleted?.(payload);
  });
};

const detachHandlers = (connection: HubConnection) => {
  // Remove all listeners - we use wrapper functions now so we don't need specific handler references
  connection.off('rescueronlinestatus');
  connection.off('rescueridlelocationupdated');
  connection.off('rescueraccepted');
  connection.off('rescuerdeclined');
  connection.off('newincidentcreated');
  connection.off('snakecatchingrequestcreated');
  connection.off('snakecatchingrequestaccepted');
  connection.off('snakecatchingrequestassigned');
  connection.off('SnakeCatchingRequestAssigned');
  connection.off('snakecatchingrequestcancelled');
  connection.off('snakecatchingmissionaborted');
  connection.off('SnakeCatchingMissionAborted');
  connection.off('snakecatchingmissioncompleted');
  connection.off('SnakeCatchingMissionCompleted');
  connection.off('operatoronlinestatus');
  connection.off('incidentclaimed');
  connection.off('operatorcontacting');
  connection.off('dispatchrequested');
  connection.off('incidentfalsealarm');
  connection.off('incidentnoanswer');
  connection.off('rescuerdispatched');
  connection.off('incidentcancelled');
  connection.off('rescueraborted');
  connection.off('RescuerAborted');
  connection.off('rescuermissionlocationupdated');
  connection.off('adminlog');
  connection.off('missioncompleted');
  connection.off('incidentcompleted');
};

export interface UseRescuerHubOptions {
  /** Optional operator id to pass into JoinAsOperator */
  operatorId?: string;
  /** Skip auto-joining the operator group on connect (useful for manual join) */
  autoJoin?: boolean;
}

export function useRescuerHub(handlers: RescuerHubEvents = {}, options: UseRescuerHubOptions = {}) {
  const { operatorId, autoJoin = true } = options;

  // If no operatorId is explicitly provided, pick it from stored user session.
  const storedUserId = getStoredUser()?.id;
  const resolvedOperatorId = operatorId ?? storedUserId;

  const [connected, setConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const connectionRef = useRef<HubConnection | null>(null);
  const handlersRef = useRef<RescuerHubEvents>(handlers);

  const token = getAccessToken();

  // Update handlers ref when handlers change (without triggering reconnect)
  useEffect(() => {
    handlersRef.current = handlers;
  }, [handlers]);

  useEffect(() => {
    const connection = createRescuerHubConnection(token);
    connectionRef.current = connection;

    let mounted = true;

    const joinAsOperator = async () => {
      if (!autoJoin) {
        return;
      }

      if (resolvedOperatorId) {
        await connection.invoke('JoinAsOperator', resolvedOperatorId);
        return;
      }

      await connection.invoke('JoinAsOperator');
    };

    connection.onreconnected(() => {
      if (!mounted) {
        return;
      }

      setConnected(true);
      void joinAsOperator().catch((err) => {
        setError((err as Error)?.message ?? 'Failed to rejoin operator group after reconnect');
      });
    });

    connection.onclose(() => {
      if (!mounted) {
        return;
      }

      setConnected(false);
    });

    const startConnection = async () => {
      try {
        if (connection.state !== HubConnectionState.Disconnected) {
          return;
        }

        if (!token) {
          setError('No access token available for SignalR connection');
          return;
        }

        // Use handlersRef.current to get latest handlers without causing reconnect
        attachHandlers(connection, handlersRef);

        await connection.start();
        if (!mounted) {
          return;
        }

        setConnected(true);

        await joinAsOperator();
      } catch (err) {
        if (!mounted) {
          return;
        }
        setError((err as Error)?.message ?? 'SignalR connection failed');
      }
    };

    startConnection();

    return () => {
      mounted = false;

      if (!connectionRef.current) {
        return;
      }

      try {
        // Detach handlers before disconnecting
        detachHandlers(connectionRef.current);
        connectionRef.current.invoke('LeaveAsOperator').catch(() => undefined);
        connectionRef.current.stop().catch(() => undefined);
      } catch {
        // ignore
      }
    };
  }, [token, resolvedOperatorId, autoJoin]);

  return { connected, error };
}
