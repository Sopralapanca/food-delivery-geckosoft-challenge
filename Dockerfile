# Use the official Node.js image as a base image
FROM node:18

# Set the working directory inside the container
WORKDIR /usr/src/food-delivery-geckosoft-app

# Copy the package.json and package-lock.json files
COPY package*.json ./

# Install the dependencies
RUN npm install
RUN npm install express multer csv-parser axios dotenv
RUN npm install --save groq-sdk

# Copy the rest of the application files
COPY . .

# Expose the port the app runs on
EXPOSE 3000

# Command to start the app
CMD ["npm", "start"]