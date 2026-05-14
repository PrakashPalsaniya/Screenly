/**
 * sync-theater-logos.js
 * 
 * Uploads theater logos (PVR, INOX, Cinepolis) to S3 'theaters/' folder.
 */

require("dotenv").config({ path: require("path").resolve(__dirname, "../../../.env") });

const { uploadTheaterLogo } = require("../utils/posterUploader");

const logos = {
  PVR: "https://placehold.co/200x200?text=TheaterLogo",
  INOX: "https://placehold.co/200x200?text=TheaterLogo",
  Cinepolis: "https://placehold.co/200x200?text=TheaterLogo",
};

async function main() {
  console.log("Starting theater logo upload to S3...");

  for (const [brand, url] of Object.entries(logos)) {
    try {
      const result = await uploadTheaterLogo(brand, url);
      console.log(`[${brand}] ${result.status}: ${result.key}`);
    } catch (err) {
      console.error(`[${brand}] Failed:`, err.message);
    }
  }

  console.log("Done.");
  process.exit(0);
}

main();
