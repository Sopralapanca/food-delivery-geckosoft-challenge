require('dotenv').config();

const express = require("express");
const multer = require("multer");
const fs = require("fs");
const csv = require("csv-parser");
const path = require("path");
const Groq = require("groq-sdk");


const groq_api_key = process.env.GROQ_API_KEY;
if (!groq_api_key) {
  throw new Error("The GROQ_API_KEY environment variable is missing or empty.");
}

const groq = new Groq({ apiKey: groq_api_key });

const app = express();
const upload = multer({ dest: "uploads/" });



// Function to call Groq API
async function getGroqChatCompletion(prompt) {
  try {
    const chatCompletion = await groq.chat.completions.create({
      messages: [
        {
          role: "user",
          content: prompt,
        },
      ],
      model: "llama-3.1-8b-instant",
    });
    return chatCompletion.choices[0]?.message?.content || "No response from Groq";
  } catch (error) {
    console.error("Error with Groq API:", error);
    return "Error contacting Groq API";
  }
}


// Serve static files from the "static" folder
app.use(express.static(path.join(__dirname, 'static')));

// Route for the home page (index.html)
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, 'templates', 'index.html'));
});

// Endpoint to handle CSV upload
app.post("/upload", upload.single("file"), (req, res) => {
  const file = req.file;

  if (!file) {
    return res.status(400).send({ message: "No file uploaded" });
  }

  const results = [];
  let idCounter = 0;

  // Process the CSV file row by row
  fs.createReadStream(file.path)
    .pipe(csv())
    .on("data", (row) => {
      results.push({
        id: ++idCounter,
        review: row.review,
        food_rating: row.food_rating,
        delivery_rating: row.delivery_rating,
        acceptance_score: row.acceptance_score
      });

    })
    .on("end", async () => {
      let prompt =
          "You are a food delivery service and you have to predict the rating of the food and the delivery of a review. " +
          "I will pass you a list of reviews, the reviews can be positive or negative " +
          "and you will have to tell me the rating to be given to the food (an integer number between 1 and 5) and the rating to be given to the delivery (an integer number between 1 and 5). " +
          "Finally, you will have to tell me if the review is accepted or rejected with a float number between 0 and 1 representing confidence in accepting the review. " +
          "Reject the reviews if they are found to be offensive or contain hate. " +
          "Pay attention, some reviews may be negatives about the user experience with the restaurant but still they can be accepted since they are not offensive."+
          "Your answer must be in the JSON format, with the a string for the ID as key and as value the food_rating, delivery_rating, and confidence. Don't write other information."+
          "example of your answer: {\"1\": [5, 5, 0.69], \"2\": [1, 1, 1.0], \"3\": [1, 1, 0.2]}.\n"+
          "do not write any comments in the JSON, just the keys and values.\n"+
          "Below I will write a list of reviews and their IDs, you have to predict the values.\n\n";


      results.forEach((row) => {
            prompt += `ID: ${row.id} Review: ${row.review}\n`;
        });

      const groqResponse = await getGroqChatCompletion(prompt);


      let apiResults;
      try {
        apiResults = JSON.parse(groqResponse);
      } catch (error) {
        console.error("Error parsing Groq API response:", error);
        apiResults = {}; // Handle parsing error
      }

      res.send({
        message: "Upload complete",
        csvData: results,
        apiData: apiResults
      });


      fs.unlinkSync(file.path)

    })
    .on("error", (error) => {
      // Handle any error that occurs during file reading
      console.error("Error processing CSV:", error);
      res.status(500).send({ message: "Error processing CSV file" });
    });
});

// Start the server
app.listen(3000, () => {
  console.log("Server running on http://localhost:3000");
});
