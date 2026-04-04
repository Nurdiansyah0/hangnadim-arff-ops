FROM rust:slim-bookworm AS builder
WORKDIR /app
COPY . .
RUN apt-get update && apt-get install -y pkg-config libssl-dev
RUN cargo build --release

FROM debian:bookworm-slim
WORKDIR /app
RUN apt-get update && apt-get install -y libssl3 ca-certificates curl && rm -rf /var/lib/apt/lists/*
COPY --from=builder /app/target/release/backend /usr/local/bin/backend
COPY --from=builder /app/migrations ./migrations

# Not strictly needed since docker-compose provides it, but good fallback
COPY --from=builder /app/.env . 
EXPOSE 8000
CMD ["backend"]
