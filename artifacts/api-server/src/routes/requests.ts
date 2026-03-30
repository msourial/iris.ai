import { Router, type IRouter } from 'express';
import {
  createRequest,
  getRequest,
  listByStatus,
  claimRequest,
  resolveRequest,
  setFilecoinCid,
  getStats,
  type RequestStatus,
} from '../lib/store';
import { uploadToFilecoin } from '../lib/filecoin';
import { logger } from '../lib/logger';

const router: IRouter = Router();

/** POST /requests — blind user submits a help request */
router.post('/requests', (req, res) => {
  const { blindUserAddr, imageCid, aiDescription, aiDescriptionHash, flowEscrowTxId } = req.body;

  if (!blindUserAddr || !imageCid || !aiDescription) {
    res.status(400).json({ error: 'Missing required fields: blindUserAddr, imageCid, aiDescription' });
    return;
  }

  const helpReq = createRequest({
    blindUserAddr,
    imageCid,
    aiDescription,
    aiDescriptionHash: aiDescriptionHash ?? '',
    flowEscrowTxId,
  });

  // Fire-and-forget: upload AI description + metadata to Filecoin
  const metadata = JSON.stringify({
    requestId: helpReq.id,
    aiDescription,
    aiDescriptionHash: aiDescriptionHash ?? '',
    imageCid,
    timestamp: helpReq.createdAt,
    app: 'Iris.ai',
  });
  uploadToFilecoin(metadata, `iris-request-${helpReq.id}.json`)
    .then((result) => {
      setFilecoinCid(helpReq.id, result.cid, result.url);
      logger.info({ requestId: helpReq.id, filecoinCid: result.cid }, 'Filecoin upload complete');
    })
    .catch((err) => {
      logger.error({ requestId: helpReq.id, err }, 'Filecoin upload failed');
    });

  res.status(201).json(helpReq);
});

/** GET /requests — list requests, optionally filtered by status */
router.get('/requests', (req, res) => {
  const status = req.query.status as RequestStatus | undefined;
  const results = listByStatus(status);
  res.json(results);
});

/** GET /requests/:id — get a single request */
router.get('/requests/:id', (req, res) => {
  const helpReq = getRequest(req.params.id);
  if (!helpReq) {
    res.status(404).json({ error: 'Request not found' });
    return;
  }
  res.json(helpReq);
});

/** POST /requests/:id/claim — volunteer claims a request */
router.post('/requests/:id/claim', (req, res) => {
  const { volunteerAddr } = req.body;
  if (!volunteerAddr) {
    res.status(400).json({ error: 'Missing volunteerAddr' });
    return;
  }

  const helpReq = claimRequest(req.params.id, volunteerAddr);
  if (!helpReq) {
    res.status(404).json({ error: 'Request not found or not pending' });
    return;
  }
  res.json(helpReq);
});

/** POST /requests/:id/resolve — volunteer submits an answer */
router.post('/requests/:id/resolve', (req, res) => {
  const { volunteerAddr, answer, flowRewardTxId } = req.body;
  if (!volunteerAddr || !answer) {
    res.status(400).json({ error: 'Missing volunteerAddr or answer' });
    return;
  }

  const helpReq = resolveRequest(req.params.id, volunteerAddr, answer, flowRewardTxId);
  if (!helpReq) {
    res.status(404).json({ error: 'Request not found or already resolved' });
    return;
  }
  res.json(helpReq);
});

/** GET /stats — aggregated impact metrics */
router.get('/stats', (_req, res) => {
  res.json(getStats());
});

export default router;
