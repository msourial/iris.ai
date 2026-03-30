/**
 * Iris.ai — API client for the volunteer request system
 *
 * Talks to the Express API server for creating, listing, and resolving help requests.
 * Uses EXPO_PUBLIC_API_URL for the base URL (defaults to empty for same-origin).
 */

const API_BASE = process.env.EXPO_PUBLIC_API_URL ?? '';

export interface HelpRequest {
  id: string;
  blindUserAddr: string;
  imageCid: string;
  aiDescription: string;
  aiDescriptionHash: string;
  status: 'pending' | 'claimed' | 'resolved' | 'expired';
  volunteerAddr: string | null;
  volunteerAnswer: string | null;
  flowEscrowTxId: string | null;
  flowRewardTxId: string | null;
  filecoinCid: string | null;
  filecoinUrl: string | null;
  createdAt: string;
  updatedAt: string;
}

async function apiFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}/api${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error((body as { error?: string }).error ?? `API error ${res.status}`);
  }
  return res.json() as Promise<T>;
}

export function createHelpRequest(data: {
  blindUserAddr: string;
  imageCid: string;
  aiDescription: string;
  aiDescriptionHash: string;
  flowEscrowTxId?: string;
}): Promise<HelpRequest> {
  return apiFetch('/requests', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export function getHelpRequest(id: string): Promise<HelpRequest> {
  return apiFetch(`/requests/${id}`);
}

export function listPendingRequests(): Promise<HelpRequest[]> {
  return apiFetch('/requests?status=pending');
}

export function claimRequest(id: string, volunteerAddr: string): Promise<HelpRequest> {
  return apiFetch(`/requests/${id}/claim`, {
    method: 'POST',
    body: JSON.stringify({ volunteerAddr }),
  });
}

export function resolveRequest(
  id: string,
  volunteerAddr: string,
  answer: string,
  flowRewardTxId?: string,
): Promise<HelpRequest> {
  return apiFetch(`/requests/${id}/resolve`, {
    method: 'POST',
    body: JSON.stringify({ volunteerAddr, answer, flowRewardTxId }),
  });
}

export function getStats(): Promise<{
  totalRequests: number;
  totalResolved: number;
  totalPending: number;
  totalVolunteers: number;
  avgResponseTimeSec: number;
}> {
  return apiFetch('/stats');
}
