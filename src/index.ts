import express, { request, response } from "express";
import cors from "cors";

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.get("/api/classify", async (req, res) => {
  try {
    const name = req.query.name;
    // name Validation
    if (name === undefined) {
      return res.status(400).json({
        status: "error",
        message: "name query parameter is required",
      });
    }

    if (typeof name !== "string") {
      return res.status(422).json({
        status: "error",
        message: "name must be a string",
      });
    }

    if (name.trim() === "") {
      return res.status(400).json({
        status: "error",
        message: "Missing or empty name parameter",
      });
    }

    const response = await fetch(
      `https://api.genderize.io?name=${encodeURIComponent(name)}`,
    );

    if (!response.ok) {
      return res.status(502).json({
        status: "error",
        message: "Failed to fetch data from upstream service",
      });
    }

    const data = await response.json();

    if (data.gender === null || data.count === 0) {
      return res.status(422).json({
        status: "error",
        message: "No prediction available for the provided name",
      });
    }

    const processedData = {
      name: data.name,
      gender: data.gender,
      probability: data.probability,
      sample_size: data.count,
      is_confident: data.probability >= 0.7 && data.count >= 100,
      processed_at: new Date().toISOString(),
    };

    return res.status(200).json({
      status: "success",
      data: processedData,
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      status: "error",
      message: "Internal server error",
    });
  }
});

app.listen(PORT, () => {
  console.log(`Server is running  on port ${PORT}`);
  console.log(`You are running on http://localhost:${PORT}`);
});
