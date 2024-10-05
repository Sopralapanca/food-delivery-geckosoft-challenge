document.getElementById("csv-form").addEventListener("submit", async function(event) {
  event.preventDefault();

  const fileInput = document.getElementById("csv-file");
  const threshold = parseFloat(document.getElementById("threshold").value);
  const file = fileInput.files[0];

  if (!file || isNaN(threshold) || threshold < 0 || threshold > 1) {
    alert("Please upload a CSV file and ensure the threshold is between 0 and 1.");
    return;
  }

  // Send the file to the back-end
  const formData = new FormData();
  formData.append("file", file);

  try {
    const response = await fetch("/upload", {
      method: "POST",
      body: formData
    });

    const data = await response.json();

    // Clear previous results
    const resultsBody = document.getElementById('results-body');
    resultsBody.innerHTML = '';


    let totalPredictions = 0;
    let correctFoodPredictions = 0;
    let correctDeliveryPredictions = 0;
    let correctAcceptancePredictions = 0;

    // Populate the table with CSV data and API responses
    data.csvData.forEach((row, index) => {

      const apiResponse = data.apiData[index + 1] || {};
      const foodRatingGroq = apiResponse[0] || 1; // Default to 1 if no response
      const deliveryRatingGroq = apiResponse[1] || 1; // Default to 1 if no response
      const acceptanceScore = apiResponse[2] || 0.5; // Default to 0.5 if no response

      const newRow = resultsBody.insertRow();
      newRow.insertCell(0).innerText = row.id;
      newRow.insertCell(1).innerText = row.review;
      newRow.insertCell(2).innerText = row.food_rating;
      newRow.insertCell(3).innerText = row.delivery_rating;
      newRow.insertCell(4).innerText = row.acceptance_score;
      newRow.insertCell(5).innerText = parseInt(foodRatingGroq);
      newRow.insertCell(6).innerText = parseInt(deliveryRatingGroq);
      newRow.insertCell(7).innerText = parseFloat(acceptanceScore);

      totalPredictions++;


      if (parseInt(row.food_rating) === foodRatingGroq) correctFoodPredictions++;
      if (parseInt(row.delivery_rating) === deliveryRatingGroq) correctDeliveryPredictions++;

      const actualAcceptance = parseFloat(row.acceptance_score) >= threshold ? 1 : 0;
      const predictedAcceptance = acceptanceScore >= threshold ? 1 : 0;
      if (actualAcceptance === predictedAcceptance) correctAcceptancePredictions++;

    });

     // Compute precision scores
    const foodPrecision = (correctFoodPredictions / totalPredictions) * 100;
    const deliveryPrecision = (correctDeliveryPredictions / totalPredictions) * 100;
    const acceptancePrecision = (correctAcceptancePredictions / totalPredictions) * 100;

    document.getElementById('precision-result').innerHTML = `
      <p>Food Rating Precision: ${foodPrecision.toFixed(2)}%</p>
      <p>Delivery Rating Precision: ${deliveryPrecision.toFixed(2)}%</p>
      <p>Acceptance Precision: ${acceptancePrecision.toFixed(2)}%</p>
    `;

  } catch (error) {
    console.error("Error:", error);
  }
});