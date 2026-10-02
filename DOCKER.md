# Run ISF Capstone demo in Docker (local machine)

Requires Docker Desktop (or Docker Engine + Compose).

```bash
cd IncidentSensoryFabric   # or wherever you extracted/cloned the repo
docker compose up --build
```

Open **http://127.0.0.1:4317** in your browser on the same machine.

Stop: `Ctrl+C` or `docker compose down`.

Equivalent without Compose:

```bash
docker build -t incident-sensory-fabric .
docker run --rm -p 4317:4317 incident-sensory-fabric
```

This is the simulated Capstone UI only — no live MCPTT/FirstNet/Axon connection.
