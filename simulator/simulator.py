#!/usr/bin/env python3
"""
Cloud Monitoring System — Metric Simulator
==========================================
Produces realistic metric patterns for multiple services:
  • Steady state   — normal operation with small variance
  • Gradual degradation — metrics creep toward threshold
  • Sudden spike   — brief sharp anomaly
  • Recovery       — metrics return to normal

Usage:
    python simulator.py [--url URL] [--interval SECONDS] [--services N]
"""
import argparse
import json
import math
import random
import time
from dataclasses import dataclass, field
from datetime import datetime, timezone
from typing import Callable
import urllib.request
import urllib.error


# ── Service definitions ─────────────────────────────────────────────────────
@dataclass
class ServiceConfig:
    name: str
    metrics: list[str] = field(default_factory=lambda: ["cpu", "memory", "latency"])
    base: dict = field(default_factory=lambda: {"cpu": 30.0, "memory": 45.0, "latency": 120.0})
    max_values: dict = field(default_factory=lambda: {"cpu": 100.0, "memory": 100.0, "latency": 2000.0})


SERVICES = [
    ServiceConfig("api-gateway"),
    ServiceConfig("auth-service"),
    ServiceConfig("data-processor",
                  base={"cpu": 50.0, "memory": 60.0, "latency": 80.0}),
    ServiceConfig("cache-layer",
                  base={"cpu": 15.0, "memory": 70.0, "latency": 5.0},
                  max_values={"cpu": 100.0, "memory": 100.0, "latency": 500.0}),
]


# ── Pattern generators ────────────────────────────────────────────────────────
class PatternEngine:
    """
    Each service cycles through phases:
      steady (60s) → spike (20s) → degradation (90s) → recovery (60s) → repeat
    """

    def __init__(self, cfg: ServiceConfig):
        self.cfg = cfg
        self.t = 0.0
        self.phase_durations = [60, 20, 90, 60]  # seconds per phase
        self.phase_idx = 0
        self.phase_elapsed = 0.0
        # Add a random offset so services aren't in sync
        self.phase_elapsed = random.uniform(0, self.phase_durations[0])

    def _phase(self):
        return ["steady", "spike", "degradation", "recovery"][self.phase_idx]

    def step(self, dt: float):
        self.t += dt
        self.phase_elapsed += dt
        if self.phase_elapsed >= self.phase_durations[self.phase_idx]:
            self.phase_elapsed -= self.phase_durations[self.phase_idx]
            self.phase_idx = (self.phase_idx + 1) % 4

    def _noise(self, scale=1.0) -> float:
        return random.gauss(0, scale)

    def sample(self, metric: str) -> float:
        base = self.cfg.base.get(metric, 50.0)
        max_v = self.cfg.max_values.get(metric, 100.0)
        phase = self._phase()
        progress = self.phase_elapsed / self.phase_durations[self.phase_idx]

        if metric == "cpu":
            if phase == "steady":
                v = base + self._noise(3)
            elif phase == "spike":
                v = base + math.sin(progress * math.pi) * 60 + self._noise(5)
            elif phase == "degradation":
                v = base + progress * 55 + self._noise(4)
            else:  # recovery
                v = (base + 55) + (1 - progress) * -55 + self._noise(3)

        elif metric == "memory":
            if phase == "steady":
                v = base + self._noise(2)
            elif phase == "spike":
                v = base + progress * 20 + self._noise(3)
            elif phase == "degradation":
                v = base + progress * 30 + self._noise(2)
            else:
                v = (base + 30) + (1 - progress) * -30 + self._noise(2)

        elif metric == "latency":
            if phase == "steady":
                v = base + self._noise(10)
            elif phase == "spike":
                v = base + math.sin(progress * math.pi) * 800 + self._noise(50)
            elif phase == "degradation":
                v = base + progress * 500 + self._noise(20)
            else:
                v = (base + 500) + (1 - progress) * -500 + self._noise(15)

        else:
            v = base + self._noise(5)

        return round(max(0.0, min(max_v, v)), 2)


# ── HTTP sender ───────────────────────────────────────────────────────────────
def post_metric(url: str, service: str, name: str, value: float, verbose: bool):
    payload = json.dumps({
        "service": service,
        "name": name,
        "value": value,
        "timestamp": datetime.now(timezone.utc).isoformat(),
    }).encode()
    req = urllib.request.Request(
        url, data=payload,
        headers={"Content-Type": "application/json"},
        method="POST"
    )
    try:
        with urllib.request.urlopen(req, timeout=5) as resp:
            if verbose:
                print(f"  ✓ {service}/{name} = {value}")
    except urllib.error.URLError as e:
        print(f"  ✗ {service}/{name} failed: {e.reason}")
    except Exception as e:
        print(f"  ✗ {service}/{name} error: {e}")


# ── Main loop ─────────────────────────────────────────────────────────────────
def main():
    parser = argparse.ArgumentParser(description="Cloud Monitor — Metric Simulator")
    parser.add_argument("--url", default="http://localhost:8000/metrics",
                        help="Backend /metrics endpoint URL")
    parser.add_argument("--interval", type=float, default=2.0,
                        help="Seconds between metric batches")
    parser.add_argument("--services", type=int, default=len(SERVICES),
                        help="Number of services to simulate (max: %(default)s)")
    parser.add_argument("--verbose", action="store_true",
                        help="Print each metric as it's sent")
    args = parser.parse_args()

    services = SERVICES[:args.services]
    engines = {svc.name: PatternEngine(svc) for svc in services}

    print(f"🚀 Simulator started")
    print(f"   Backend:  {args.url}")
    print(f"   Services: {[s.name for s in services]}")
    print(f"   Interval: {args.interval}s")
    print(f"   Ctrl+C to stop\n")

    while True:
        start = time.time()
        ts = datetime.now(timezone.utc).strftime("%H:%M:%S")
        print(f"[{ts}] Sending metrics batch…")

        for svc in services:
            engine = engines[svc.name]
            for metric in svc.metrics:
                value = engine.sample(metric)
                post_metric(args.url, svc.name, metric, value, args.verbose)
            engine.step(args.interval)

        elapsed = time.time() - start
        sleep_time = max(0, args.interval - elapsed)
        time.sleep(sleep_time)


if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        print("\n\n👋 Simulator stopped.")
