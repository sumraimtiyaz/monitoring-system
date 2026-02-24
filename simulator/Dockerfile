FROM python:3.11-slim

# Set working directory
WORKDIR /app

# Copy the simulator script
COPY simulator.py .

# No pip install needed — simulator uses only Python standard library

# Environment variable defaults (all overridable at runtime with -e flags)
ENV METRICS_URL=http://backend:8000/metrics
ENV INTERVAL=2.0
ENV SERVICES=4
ENV VERBOSE=false

# Run the simulator
CMD ["python", "simulator.py"]