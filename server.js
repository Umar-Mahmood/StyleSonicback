// const express = require("express");
// const multer = require("multer");
// const cors = require("cors");
// const fs = require("fs");
// const path = require("path");
// const getColors = require("get-image-colors"); // ✅ Import Color Extraction

// const app = express();
// app.use(cors());
// app.use(express.json());

// // 🔹 Create "uploads" directory if it doesn't exist
// const uploadDir = path.join(__dirname, "uploads");
// if (!fs.existsSync(uploadDir)) {
//   fs.mkdirSync(uploadDir);
// }

// // 🔹 Configure Multer for local file storage
// const storage = multer.diskStorage({
//   destination: (req, file, cb) => {
//     cb(null, "uploads/");
//   },
//   filename: (req, file, cb) => {
//     const fileName = `${Date.now()}-${file.originalname}`;
//     cb(null, fileName);
//   },
// });

// const seasonalColorRanges = {
//   spring: { r: [200, 255], g: [150, 255], b: [150, 255] }, // Light pastels, warm colors
//   summer: { r: [150, 200], g: [150, 255], b: [200, 255] }, // Cool blues, aquas
//   autumn: { r: [150, 255], g: [100, 200], b: [50, 150] }, // Warm earthy tones
//   winter: { r: [0, 150], g: [0, 150], b: [0, 150] }, // Dark, cool tones
// };

// /** ✅ Check if a Color Falls Within a Seasonal Range */
// const isColorInRange = (rgb, seasonRange) => {
//   return (
//     rgb.r >= seasonRange.r[0] &&
//     rgb.r <= seasonRange.r[1] &&
//     rgb.g >= seasonRange.g[0] &&
//     rgb.g <= seasonRange.g[1] &&
//     rgb.b >= seasonRange.b[0] &&
//     rgb.b <= seasonRange.b[1]
//   );
// };

// /** ✅ Determine Season Based on RGB Values */
// const getSeasonFromColor = (hexColor) => {
//   const rgb = hexToRgb(hexColor);

//   for (const [season, range] of Object.entries(seasonalColorRanges)) {
//     if (isColorInRange(rgb, range)) {
//       return season;
//     }
//   }

//   return "unknown";
// };

// const getOutfitSuggestions = (season) => {
//   const outfitSuggestions = {
//     spring: ["Wear light pastels, warm yellows, and soft greens."],
//     summer: ["Go for cool blues, aquas, and light fabrics."],
//     autumn: ["Opt for earthy tones like mustard, deep reds, and browns."],
//     winter: [
//       "Choose bold, high-contrast colors like black, red, and icy blues.",
//     ],
//   };

//   return outfitSuggestions[season] || ["No specific outfit recommendations."];
// };

// /** ✅ Convert HEX to RGB */
// const hexToRgb = (hex) => {
//   const match = hex.match(/^#?([\da-f]{2})([\da-f]{2})([\da-f]{2})$/i);
//   return match
//     ? {
//         r: parseInt(match[1], 16),
//         g: parseInt(match[2], 16),
//         b: parseInt(match[3], 16),
//       }
//     : null;
// };

// const upload = multer({ storage });

// /** ✅ Upload Image, Extract Colors & Return Data */
// app.post("/upload", upload.single("image"), async (req, res) => {
//   try {
//     console.log("Processing image...");
//     console.log("Uploaded file:", req.body);
//     if (!req.file) {
//       return res.status(400).json({ error: "No file uploaded" });
//     }

//     const imageId = req.file.filename; // Unique filename
//     const imagePath = path.join(__dirname, "uploads", imageId);

//     // 🔹 Extract dominant colors (returns array of hex colors)
//     const colors = await getColors(imagePath);
//     const colorPalette = colors.map((color) => color.hex());

//     // 🔹 Select dominant color (first color in the palette)
//     const dominantColor = colorPalette[0] || "#000000";

//     // 🔹 Determine the closest matching season using RGB range
//     const detectedSeason = getSeasonFromColor(dominantColor);

//     // 🔹 Get outfit suggestions based on detected season
//     const outfitSuggestions = getOutfitSuggestions(detectedSeason);

//     res.json({
//       message: "Image uploaded",
//       imageId,
//       dominantColor,
//       colorPalette,
//       detectedSeason,
//       outfitSuggestions,
//     });
//   } catch (error) {
//     console.error("Error processing image:", error);
//     res.status(500).json({ error: "Internal server error" });
//   }
// });

// /** ✅ Serve Uploaded Images */
// app.use("/uploads", express.static("uploads"));

// /** ✅ Start Server */
// const PORT = process.env.PORT || 5000;
// app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
const express = require("express");
const multer = require("multer");
const cors = require("cors");
const fs = require("fs");
const path = require("path");
const getColors = require("get-image-colors"); // ✅ Extract dominant colors
const getPixels = require("get-pixels"); // ✅ Extract pixel colors from coordinates

const app = express();
app.use(cors());
app.use(express.json());

// 🔹 Create "uploads" directory if it doesn't exist
const uploadDir = path.join(__dirname, "uploads");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir);
}

// 🔹 Configure Multer for local file storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/");
  },
  filename: (req, file, cb) => {
    const fileName = `${Date.now()}-${file.originalname}`;
    cb(null, fileName);
  },
});

const upload = multer({ storage });

/** ✅ Convert RGB to HSL */
const rgbToHsl = (r, g, b) => {
  (r /= 255), (g /= 255), (b /= 255);
  let max = Math.max(r, g, b),
    min = Math.min(r, g, b);
  let h,
    s,
    l = (max + min) / 2;

  if (max === min) {
    h = s = 0;
  } else {
    let d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r:
        h = (g - b) / d + (g < b ? 6 : 0);
        break;
      case g:
        h = (b - r) / d + 2;
        break;
      case b:
        h = (r - g) / d + 4;
        break;
    }
    h /= 6;
  }

  return { h: h * 360, s: s * 100, l: l * 100 };
};

/** ✅ Determine Season Based on HSL */
const determineSeason = (faceHsl, hairHsl, eyeHsl) => {
  const avgHue = (faceHsl.h + hairHsl.h + eyeHsl.h) / 3;
  const avgSat = (faceHsl.s + hairHsl.s + eyeHsl.s) / 3;
  const avgLight = (faceHsl.l + hairHsl.l + eyeHsl.l) / 3;

  console.log("Average HSL:", avgHue, avgSat, avgLight);
  console.log("Face HSL:", faceHsl);
  console.log("Hair HSL:", hairHsl);
  console.log("Eye HSL:", eyeHsl);

  if (avgLight > 75) {
    if (avgHue >= 0 && avgHue <= 50) return "Light Spring";
    if (avgHue > 50 && avgHue <= 150) return "Light Summer";
  } else if (avgLight >= 40 && avgLight <= 75) {
    if (avgHue >= 0 && avgHue <= 50)
      return avgSat > 50 ? "True Spring" : "Soft Spring";
    if (avgHue > 50 && avgHue <= 150)
      return avgSat > 50 ? "True Summer" : "Soft Summer";
    if (avgHue > 150 && avgHue <= 280)
      return avgSat > 50 ? "True Autumn" : "Soft Autumn";
    if (avgHue > 280 && avgHue <= 360)
      return avgSat > 50 ? "True Winter" : "Cool Winter";
  } else {
    if (avgHue >= 0 && avgHue <= 50) return "Warm Spring";
    if (avgHue > 50 && avgHue <= 150) return "Cool Summer";
    if (avgHue > 150 && avgHue <= 280) return "Deep Autumn";
    if (avgHue > 280 && avgHue <= 360) return "Deep Winter";
  }

  return "Unknown Season";
};

/** ✅ Suggested Colors for Each Season */
const getOutfitSuggestions = (season) => {
  const outfitColors = {
    "Light Spring": ["Soft peach", "Warm pink", "Pale gold"],
    "True Spring": ["Bright coral", "Leaf green", "Golden yellow"],
    "Warm Spring": ["Sunny orange", "Turquoise", "Rich cream"],
    "Light Summer": ["Lavender", "Powder blue", "Cool mint"],
    "True Summer": ["Soft navy", "Rose pink", "Cool taupe"],
    "Cool Summer": ["Dusky teal", "Ice blue", "Slate grey"],
    "Soft Autumn": ["Warm olive", "Dusty rose", "Burnt sienna"],
    "True Autumn": ["Rust", "Pumpkin", "Mustard yellow"],
    "Deep Autumn": ["Espresso", "Dark teal", "Burgundy"],
    "Cool Winter": ["Deep emerald", "Ruby red", "Icy silver"],
    "True Winter": ["Black", "Royal blue", "Pure white"],
    "Deep Winter": ["Dark charcoal", "Electric blue", "Jewel tones"],
  };

  return outfitColors[season] || ["No specific outfit recommendations."];
};

/** ✅ Upload Image, Extract Colors & Return Data */
app.post("/upload", upload.single("image"), async (req, res) => {
  try {
    console.log("Processing image...");
    console.log("Uploaded file:", req.file);
    console.log("Request body:", req.body);
    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded" });
    }

    const imageId = req.file.filename;
    const imagePath = path.join(__dirname, "uploads", imageId);
    const faceCoords = JSON.parse(req.body.faceCoords);
    const hairCoords = JSON.parse(req.body.hairCoords);
    const eyeCoords = JSON.parse(req.body.eyeCoords);

    // 🔹 Extract dominant colors
    const colors = await getColors(imagePath);
    const colorPalette = colors.map((color) => color.hex());
    const dominantColor = colorPalette[0] || "#000000";

    getPixels(imagePath, function (err, pixels) {
      if (err) {
        return res.status(500).json({ error: "Error processing image" });
      }

      const getColorAt = (coords) => {
        const index = (coords.y * pixels.shape[0] + coords.x) * 4;
        return {
          r: pixels.data[index],
          g: pixels.data[index + 1],
          b: pixels.data[index + 2],
        };
      };

      // Extract colors from user-selected coordinates
      const faceRgb = getColorAt(faceCoords);
      const hairRgb = getColorAt(hairCoords);
      const eyeRgb = getColorAt(eyeCoords);

      const faceHsl = rgbToHsl(faceRgb.r, faceRgb.g, faceRgb.b);
      const hairHsl = rgbToHsl(hairRgb.r, hairRgb.g, hairRgb.b);
      const eyeHsl = rgbToHsl(eyeRgb.r, eyeRgb.g, eyeRgb.b);

      // 🔹 Determine season based on selected colors
      const detectedSeason = determineSeason(faceHsl, hairHsl, eyeHsl);
      const outfitSuggestions = getOutfitSuggestions(detectedSeason);

      res.json({
        message: "Image uploaded",
        imageId,
        dominantColor,
        colorPalette,
        detectedSeason,
        outfitSuggestions,
        faceColor: `rgb(${faceRgb.r},${faceRgb.g},${faceRgb.b})`,
        hairColor: `rgb(${hairRgb.r},${hairRgb.g},${hairRgb.b})`,
        eyeColor: `rgb(${eyeRgb.r},${eyeRgb.g},${eyeRgb.b})`,
      });
    });
  } catch (error) {
    console.error("Error processing image:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

/** ✅ Serve Uploaded Images */
app.use("/uploads", express.static("uploads"));

/** ✅ Start Server */
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
