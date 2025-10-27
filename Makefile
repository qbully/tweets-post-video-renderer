.PHONY: help build run stop restart logs shell clean test health

# Default target
help:
	@echo "Twitter Video Generator - Docker Commands"
	@echo ""
	@echo "Available targets:"
	@echo "  build          - Build the Docker image"
	@echo "  run            - Run the container in detached mode"
	@echo "  stop           - Stop the running container"
	@echo "  restart        - Restart the container"
	@echo "  logs           - View container logs (follow mode)"
	@echo "  shell          - Open a shell in the running container"
	@echo "  clean          - Remove container and image"
	@echo "  test           - Run a test request against the API"
	@echo "  health         - Check container health status"
	@echo "  compose-up     - Start with docker-compose"
	@echo "  compose-down   - Stop docker-compose services"
	@echo "  compose-logs   - View docker-compose logs"

# Docker image name
IMAGE_NAME=twitter-video-generator
CONTAINER_NAME=twitter-video-generator

# Build the Docker image
build:
	docker build -t $(IMAGE_NAME):latest .

# Run the container
run:
	docker run -d \
		--name $(CONTAINER_NAME) \
		-p 3000:3000 \
		-v video-data:/data/videos \
		-e STORAGE_PROVIDER=local \
		-e STORAGE_PATH=/data/videos \
		-e STORAGE_TTL_HOURS=24 \
		$(IMAGE_NAME):latest

# Stop the container
stop:
	docker stop $(CONTAINER_NAME)

# Restart the container
restart:
	docker restart $(CONTAINER_NAME)

# View logs
logs:
	docker logs -f $(CONTAINER_NAME)

# Open shell in container
shell:
	docker exec -it $(CONTAINER_NAME) /bin/sh

# Clean up container and image
clean:
	-docker stop $(CONTAINER_NAME)
	-docker rm $(CONTAINER_NAME)
	-docker rmi $(IMAGE_NAME):latest

# Test the API
test:
	@echo "Testing health endpoint..."
	@curl -f http://localhost:3000/health || echo "Container not responding"

# Check health status
health:
	@docker inspect --format='{{.State.Health.Status}}' $(CONTAINER_NAME) || echo "Container not found"

# Docker Compose targets
compose-up:
	docker-compose up -d

compose-down:
	docker-compose down

compose-logs:
	docker-compose logs -f

# Build and run in one command
start: build run
	@echo "Container started. Waiting for health check..."
	@sleep 5
	@make health

# Full cleanup including volumes
clean-all: clean
	-docker volume rm video-data
