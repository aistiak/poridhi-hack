# Use an official Node.js runtime as a base image
FROM node:20

# Set the working directory in the container
WORKDIR /usr/src/importDataApp

# Copy package.json and package-lock.json to the working directory
COPY package*.json ./

# Install the dependencies
RUN npm install

# Copy the application code to the container
COPY . .

# Expose the port that the application will run on
EXPOSE 3011

# Define the command to run your application
CMD ["node", "main.js"]
