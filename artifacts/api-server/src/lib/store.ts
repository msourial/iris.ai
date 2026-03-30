import { randomUUID } from 'node:crypto';

export type RequestStatus = 'pending' | 'claimed' | 'resolved' | 'expired';

export interface HelpRequest {
  id: string;
  blindUserAddr: string;
  imageCid: string;
  aiDescription: string;
  aiDescriptionHash: string;
  status: RequestStatus;
  volunteerAddr: string | null;
  volunteerAnswer: string | null;
  flowEscrowTxId: string | null;
  flowRewardTxId: string | null;
  filecoinCid: string | null;
  filecoinUrl: string | null;
  createdAt: string;
  updatedAt: string;
}

const requests = new Map<string, HelpRequest>();

export function createRequest(data: {
  blindUserAddr: string;
  imageCid: string;
  aiDescription: string;
  aiDescriptionHash: string;
  flowEscrowTxId?: string;
}): HelpRequest {
  const now = new Date().toISOString();
  const req: HelpRequest = {
    id: randomUUID(),
    blindUserAddr: data.blindUserAddr,
    imageCid: data.imageCid,
    aiDescription: data.aiDescription,
    aiDescriptionHash: data.aiDescriptionHash,
    status: 'pending',
    volunteerAddr: null,
    volunteerAnswer: null,
    flowEscrowTxId: data.flowEscrowTxId ?? null,
    flowRewardTxId: null,
    filecoinCid: null,
    filecoinUrl: null,
    createdAt: now,
    updatedAt: now,
  };
  requests.set(req.id, req);
  return req;
}

export function getRequest(id: string): HelpRequest | undefined {
  return requests.get(id);
}

export function listByStatus(status?: RequestStatus): HelpRequest[] {
  const all = Array.from(requests.values());
  if (!status) return all.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  return all
    .filter((r) => r.status === status)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export function claimRequest(id: string, volunteerAddr: string): HelpRequest | null {
  const req = requests.get(id);
  if (!req || req.status !== 'pending') return null;
  req.status = 'claimed';
  req.volunteerAddr = volunteerAddr;
  req.updatedAt = new Date().toISOString();
  return req;
}

export function resolveRequest(
  id: string,
  volunteerAddr: string,
  answer: string,
  flowRewardTxId?: string,
): HelpRequest | null {
  const req = requests.get(id);
  if (!req || (req.status !== 'pending' && req.status !== 'claimed')) return null;
  req.status = 'resolved';
  req.volunteerAddr = volunteerAddr;
  req.volunteerAnswer = answer;
  req.flowRewardTxId = flowRewardTxId ?? null;
  req.updatedAt = new Date().toISOString();
  return req;
}

export function setFilecoinCid(id: string, cid: string, url: string): void {
  const req = requests.get(id);
  if (!req) return;
  req.filecoinCid = cid;
  req.filecoinUrl = url;
  req.updatedAt = new Date().toISOString();
}

export function getStats() {
  const all = Array.from(requests.values());
  const resolved = all.filter((r) => r.status === 'resolved');
  const volunteers = new Set(resolved.map((r) => r.volunteerAddr).filter(Boolean));
  const avgResponseMs =
    resolved.length > 0
      ? resolved.reduce((sum, r) => {
          return sum + (new Date(r.updatedAt).getTime() - new Date(r.createdAt).getTime());
        }, 0) / resolved.length
      : 0;

  return {
    totalRequests: all.length,
    totalResolved: resolved.length,
    totalPending: all.filter((r) => r.status === 'pending').length,
    totalVolunteers: volunteers.size,
    avgResponseTimeSec: Math.round(avgResponseMs / 1000),
  };
}
