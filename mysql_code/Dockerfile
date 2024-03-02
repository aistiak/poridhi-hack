# Use an official Node.js runtime as a base image
FROM node:14

# Set the working directory in the container
WORKDIR /app

# Copy package.json and package-lock.json to the working directory
COPY package*.json ./

# Install app dependencies
RUN npm install

# Install MySQL client
RUN apt-get update && \
    apt-get install -y mysql-client && \
    rm -rf /var/lib/apt/lists/*

# Bundle app source
COPY . .

# Expose the port your app runs on
EXPOSE 3001

# CMD specifies the command to run on startup
CMD ["npm", "start"]
