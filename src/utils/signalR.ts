'use client';

import type { HubConnection } from '@microsoft/signalr';
import { HubConnectionBuilder, LogLevel } from '@microsoft/signalr';

const stripTrailingSlash = (value: string) => value.replace(/\/+$/, '');

const getApiBaseUrl = () => {
  const base = process.env.NEXT_PUBLIC_API_BASE_URL?.trim();
  if (!base) {
    throw new Error('NEXT_PUBLIC_API_BASE_URL must be defined to use SignalR');
  }
  return stripTrailingSlash(base);
};

const buildHubUrl = (hubPath: string) => {
  const normalizedHubPath = hubPath.startsWith('/') ? hubPath : `/${hubPath}`;
  return `${getApiBaseUrl()}${normalizedHubPath}`;
};

export const createHubConnection = (hubPath: string, accessToken?: string): HubConnection => {
  const hubUrl = buildHubUrl(hubPath);

  return new HubConnectionBuilder()
    .withUrl(hubUrl, {
      accessTokenFactory: () => accessToken ?? '',
      transport: 0, // WebSockets preferred (0 = WebSockets, 1 = ServerSentEvents, 2 = LongPolling)
    })
    .withAutomaticReconnect()
    .configureLogging(LogLevel.Information)
    .build();
};

export const createRescuerHubConnection = (accessToken?: string) =>
  createHubConnection('/rescuer-hub', accessToken);

export const createMissionHubConnection = (accessToken?: string) =>
  createHubConnection('/mission-hub', accessToken);
