'use client';

import type { HubConnection } from '@microsoft/signalr';
import type {
  AdminLogPayload,
  DispatchRequestedPayload,
  IncidentCancelledPayload,
  IncidentClaimedPayload,
  IncidentFalseAlarmPayload,
  IncidentLocationUpdatedPayload,
  IncidentNoAnswerPayload,
  OperatorContactingPayload,
  OperatorOnlineStatusPayload,
  RescuerAbortedPayload,
  RescuerAcceptedPayload,
  RescuerDeclinedPayload,
  RescuerDispatchedPayload,
  RescuerIdleLocationUpdatedPayload,
  RescuerOnlineStatusPayload,
} from '@/types/signalr.type';
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
  onIncidentLocationUpdated?: (payload: IncidentLocationUpdatedPayload) => void;
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
};

const ACCESS_TOKEN_KEY = 'access_token';

const getAccessToken = () => storage.get<string>(ACCESS_TOKEN_KEY) ?? '';

const attachHandlers = (connection: HubConnection, handlers: RescuerHubEvents) => {
  if (handlers.onRescuerOnlineStatus) {
    connection.on('RescuerOnlineStatus', handlers.onRescuerOnlineStatus);
  }
  if (handlers.onRescuerIdleLocationUpdated) {
    connection.on('RescuerIdleLocationUpdated', handlers.onRescuerIdleLocationUpdated);
  }
  if (handlers.onRescuerAccepted) {
    connection.on('RescuerAccepted', handlers.onRescuerAccepted);
  }
  if (handlers.onRescuerDeclined) {
    connection.on('RescuerDeclined', handlers.onRescuerDeclined);
  }
  if (handlers.onIncidentLocationUpdated) {
    connection.on('IncidentLocationUpdated', handlers.onIncidentLocationUpdated);
  }
  if (handlers.onOperatorOnlineStatus) {
    connection.on('OperatorOnlineStatus', handlers.onOperatorOnlineStatus);
  }
  if (handlers.onIncidentClaimed) {
    connection.on('IncidentClaimed', handlers.onIncidentClaimed);
  }
  if (handlers.onOperatorContacting) {
    connection.on('OperatorContacting', handlers.onOperatorContacting);
  }
  if (handlers.onDispatchRequested) {
    connection.on('DispatchRequested', handlers.onDispatchRequested);
  }
  if (handlers.onIncidentFalseAlarm) {
    connection.on('IncidentFalseAlarm', handlers.onIncidentFalseAlarm);
  }
  if (handlers.onIncidentNoAnswer) {
    connection.on('IncidentNoAnswer', handlers.onIncidentNoAnswer);
  }
  if (handlers.onRescuerDispatched) {
    connection.on('RescuerDispatched', handlers.onRescuerDispatched);
  }
  if (handlers.onIncidentCancelled) {
    connection.on('IncidentCancelled', handlers.onIncidentCancelled);
  }
  if (handlers.onRescuerAborted) {
    connection.on('RescuerAborted', handlers.onRescuerAborted);
  }
  if (handlers.onAdminLog) {
    connection.on('AdminLog', handlers.onAdminLog);
  }
};

const detachHandlers = (connection: HubConnection, handlers: RescuerHubEvents) => {
  if (handlers.onRescuerOnlineStatus) {
    connection.off('RescuerOnlineStatus', handlers.onRescuerOnlineStatus);
  }
  if (handlers.onRescuerIdleLocationUpdated) {
    connection.off('RescuerIdleLocationUpdated', handlers.onRescuerIdleLocationUpdated);
  }
  if (handlers.onRescuerAccepted) {
    connection.off('RescuerAccepted', handlers.onRescuerAccepted);
  }
  if (handlers.onRescuerDeclined) {
    connection.off('RescuerDeclined', handlers.onRescuerDeclined);
  }
  if (handlers.onIncidentLocationUpdated) {
    connection.off('IncidentLocationUpdated', handlers.onIncidentLocationUpdated);
  }
  if (handlers.onOperatorOnlineStatus) {
    connection.off('OperatorOnlineStatus', handlers.onOperatorOnlineStatus);
  }
  if (handlers.onIncidentClaimed) {
    connection.off('IncidentClaimed', handlers.onIncidentClaimed);
  }
  if (handlers.onOperatorContacting) {
    connection.off('OperatorContacting', handlers.onOperatorContacting);
  }
  if (handlers.onDispatchRequested) {
    connection.off('DispatchRequested', handlers.onDispatchRequested);
  }
  if (handlers.onIncidentFalseAlarm) {
    connection.off('IncidentFalseAlarm', handlers.onIncidentFalseAlarm);
  }
  if (handlers.onIncidentNoAnswer) {
    connection.off('IncidentNoAnswer', handlers.onIncidentNoAnswer);
  }
  if (handlers.onRescuerDispatched) {
    connection.off('RescuerDispatched', handlers.onRescuerDispatched);
  }
  if (handlers.onIncidentCancelled) {
    connection.off('IncidentCancelled', handlers.onIncidentCancelled);
  }
  if (handlers.onRescuerAborted) {
    connection.off('RescuerAborted', handlers.onRescuerAborted);
  }
  if (handlers.onAdminLog) {
    connection.off('AdminLog', handlers.onAdminLog);
  }
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

  const token = getAccessToken();

  useEffect(() => {
    const connection = createRescuerHubConnection(token);
    connectionRef.current = connection;

    let mounted = true;

    const startConnection = async () => {
      try {
        if (connection.state !== HubConnectionState.Disconnected) {
          return;
        }

        if (!token) {
          setError('No access token available for SignalR connection');
          return;
        }

        await connection.start();
        if (!mounted) {
          return;
        }

        setConnected(true);

        if (autoJoin) {
          // Join operator group (backend expects this)
          if (resolvedOperatorId) {
            await connection.invoke('JoinAsOperator', resolvedOperatorId);
          } else {
            await connection.invoke('JoinAsOperator');
          }
        }
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
        connectionRef.current.invoke('LeaveAsOperator').catch(() => undefined);
        connectionRef.current.stop().catch(() => undefined);
      } catch {
        // ignore
      }
    };
  }, [token, operatorId, autoJoin]);

  useEffect(() => {
    const connection = connectionRef.current;
    if (!connected || !connection) {
      return;
    }

    attachHandlers(connection, handlers);

    return () => {
      detachHandlers(connection, handlers);
    };
  }, [connected, handlers]);

  return { connected, error };
}
