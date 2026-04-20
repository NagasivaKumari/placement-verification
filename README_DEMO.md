Demo run instructions

Prerequisites:
- Set `MONGODB_URI` (MongoDB instance)
- Set `ALGOD_MNEMONIC` (relayer account mnemonic) for on-chain anchoring

Run the batch worker (demo loop):
```bash
python backend/batch_worker.py
```

Run smoke test (inserts demo placement and runs one batch pass):
```bash
python tests/smoke_test.py
```

Admin UI (lightweight):
- Open `http://localhost:8000/admin` in your browser.
- Paste a valid `Bearer <JWT>` into the token field (get a token via existing auth endpoints for a user with role `college` or `admin`).
- Click `Run Batch Notarize` to trigger an immediate anchoring run.

Notes:
- This admin UI is intentionally minimal for demos. It calls the demo endpoints: `/api/admin/batch-notarize`, `/api/admin/events`, `/api/admin/batches`.
- For the hackathon, we recommend running the worker and showing the `/lookup/{code}` or the company dashboard to demonstrate a real anchor tx.
