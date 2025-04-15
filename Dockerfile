# Use Node.js base image
FROM node:20

# Set working directory
WORKDIR /usr/src/app

# Install dependencies
COPY package*.json ./
RUN npm install

# Copy source code
COPY . .

# Compile TypeScript
RUN npm run build

# Expose app port
EXPOSE 3000

# Start compiled JS file (assuming "dist/server.js" is the output)
CMD ["node", "dist/server.js"]
