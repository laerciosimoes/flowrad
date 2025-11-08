# --- Stage 1: Builder (Install Dependencies) ---
# Use a slim version for smaller image size
FROM python:3.11-slim as builder

# Set environment variables
ENV PYTHONUNBUFFERED 1
ENV PYTHONDONTWRITEBYTECODE 1

# Create and set the working directory
WORKDIR /app

# Copy the dependency files
# We use pyproject.toml and poetry.lock if you are using Poetry
# If using requirements.txt, adjust the COPY command
COPY pyproject.toml poetry.lock ./

# Install Poetry (a modern package manager)
RUN pip install poetry

# Install dependencies into a separate virtual environment
# We use --no-root to skip installing the service itself in this stage
RUN poetry install --no-root --only main

# --- Stage 2: Final Image (Runtime) ---
FROM python:3.11-slim as final

# Set environment variables for better performance/logs
ENV PYTHONUNBUFFERED 1
ENV PYTHONDONTWRITEBYTECODE 1

# Create the user and set permissions
RUN useradd --no-create-home appuser
WORKDIR /app

# Copy only the necessary packages (the installed virtual environment)
# This keeps the final image clean and small.
COPY --from=builder /usr/local/bin/poetry /usr/local/bin/poetry
COPY --from=builder /root/.cache/pypoetry/virtualenvs /root/.cache/pypoetry/virtualenvs

# Ensure the app user can access the virtual environment
ENV PATH="/root/.cache/pypoetry/virtualenvs/$(ls /root/.cache/pypoetry/virtualenvs)/bin:$PATH"

# Copy the source code
# We only copy the src folder, as tests and config files aren't needed at runtime
COPY src/ ./src/

# Change ownership to the non-root user
RUN chown -R appuser:appuser /app
USER appuser

# Expose the port FastAPI/Uvicorn will listen on
EXPOSE 8000

# Command to run the application with Uvicorn
# We use the recommended gunicorn/uvicorn setup for production
CMD ["uvicorn", "src.main:app", "--host", "0.0.0.0", "--port", "8000"]