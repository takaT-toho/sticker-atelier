# Stage 1: Build the application using a "builder" stage
FROM node:20-slim AS builder

# Set the working directory
WORKDIR /usr/src/app

# Copy package files and install dependencies
COPY package*.json ./
RUN npm install

# Copy the rest of the source code
COPY . .

# Securely mount the secret file and use it during the build.
# The secret is only available to this RUN command and is not stored in the image.
RUN --mount=type=secret,id=gemini_api_key \
    export VITE_GEMINI_API_KEY=$(cat /run/secrets/gemini_api_key) && npm run build

# Stage 2: Create the final, lean production image
FROM node:20-slim

# Set the working directory
WORKDIR /usr/src/app

# Install 'serve' to host the static files
RUN npm install -g serve

# Copy only the built application files from the 'builder' stage
COPY --from=builder /usr/src/app/dist ./dist

# Expose the port Cloud Run uses
EXPOSE 8080

# The command to start the server
CMD ["serve", "-s", "dist"]
