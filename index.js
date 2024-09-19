// index.js
require("dotenv").config();
const fs = require("fs-extra");
const path = require("path");
const axios = require("axios");
const ffmpeg = require("fluent-ffmpeg");

// Change these values to your desired values ⚠️
const ARTICLE_FILE_NAME = "article2.txt"; // Replace with the name of the article file
const SPEED_OF_SPEECH = 1.25; // Replace with the speed of speech you want to use
const API_KEY = process.env.ELEVEN_LABS_API_KEY; // Replace with your Eleven Labs API Key in .env
const VOICE_ID = process.env.VOICE_ID; // Replace with your Eleven Labs Voice ID in .env, or use the default ('Christopher')

// Configuration
const CONFIG = {
  ARTICLE_PATH: path.join(__dirname, "articles", ARTICLE_FILE_NAME),
  FINAL_AUDIO_PATH: path.join(
    __dirname,
    "output",
    `${ARTICLE_FILE_NAME.replace(".txt", "")}.mp3`
  ),
  OUTPUT_AUDIO_DIR: path.join(__dirname, "audio_chunks"),
  CHUNK_SIZE: 5000,
  VOICE_ID,
  API_KEY,
  SPEED_OF_SPEECH,
};

async function main() {
  try {
    console.log("🎙️ Starting article to speech conversion...");

    // Ensure the necessary directories exist
    await fs.ensureDir(path.join(__dirname, "articles"));
    await fs.ensureDir(path.join(__dirname, "output"));
    await fs.ensureDir(CONFIG.OUTPUT_AUDIO_DIR);

    // Step 1: Read the article
    const article = await fs.readFile(CONFIG.ARTICLE_PATH, "utf-8");
    console.log("↳ Article read successfully.");

    // Step 2: Split into chunks
    const chunks = splitIntoChunks(article, CONFIG.CHUNK_SIZE);
    console.log(`↳ Article split into ${chunks.length} chunks.`);

    // Step 3: Convert chunks to audio
    const audioFiles = [];
    for (let i = 0; i < chunks.length; i++) {
      const chunk = chunks[i];
      const audioPath = path.join(
        CONFIG.OUTPUT_AUDIO_DIR,
        `chunk_${i + 1}.mp3`
      );
      console.log(`🧵 Converting chunk ${i + 1} to audio...`);
      await textToSpeech(chunk, audioPath);
      const spedUpAudioPath = path.join(
        CONFIG.OUTPUT_AUDIO_DIR,
        `chunk_${i + 1}_spedup.mp3`
      );
      await speedUpAudio(audioPath, spedUpAudioPath, CONFIG.SPEED_OF_SPEECH);
      audioFiles.push(spedUpAudioPath);
      console.log(`↳ Chunk ${i + 1} converted and sped up.`);
    }

    // Step 4: Combine audio chunks
    console.log("🔗 Combining audio chunks...");
    await combineAudio(audioFiles, CONFIG.FINAL_AUDIO_PATH);
    console.log(`💾 Final audio saved to ${CONFIG.FINAL_AUDIO_PATH}`);

    // Step 5: Remove the audio_chunks directory
    await fs.remove(CONFIG.OUTPUT_AUDIO_DIR);
    console.log("↳ Temporary audio chunks directory removed.");
    console.log("✅ Article to speech conversion completed.");
  } catch (error) {
    console.error("❌ An error occurred:", error);
    process.exit(1);
  }
}

/**
 * Splits text into chunks without breaking words, ensuring each chunk is under maxSize.
 * @param {string} text - The text to split.
 * @param {number} maxSize - Maximum characters per chunk.
 * @returns {string[]} - Array of text chunks.
 */
function splitIntoChunks(text, maxSize) {
  const words = text.split(/\s+/);
  const chunks = [];
  let currentChunk = "";

  for (const word of words) {
    // If adding the next word exceeds maxSize, start a new chunk
    if ((currentChunk + " " + word).trim().length > maxSize) {
      if (currentChunk) {
        chunks.push(currentChunk.trim());
        currentChunk = word;
      } else {
        // Single word exceeds maxSize, force split
        chunks.push(word);
        currentChunk = "";
      }
    } else {
      currentChunk += " " + word;
    }
  }

  if (currentChunk.trim()) {
    chunks.push(currentChunk.trim());
  }

  return chunks;
}

/**
 * Converts text to speech using Eleven Labs TTS API.
 * @param {string} text - The text to convert.
 * @param {string} outputPath - Path to save the audio file.
 */
async function textToSpeech(text, outputPath) {
  const url = `https://api.elevenlabs.io/v1/text-to-speech/${CONFIG.VOICE_ID}`;
  try {
    const response = await axios.post(
      url,
      {
        text: text,
        // You can add more parameters here as per Eleven Labs API documentation
      },
      {
        responseType: "stream",
        headers: {
          "Content-Type": "application/json",
          "xi-api-key": CONFIG.API_KEY,
        },
      }
    );

    return new Promise((resolve, reject) => {
      const writeStream = fs.createWriteStream(outputPath);
      response.data.pipe(writeStream);
      writeStream.on("finish", resolve);
      writeStream.on("error", reject);
    });
  } catch (error) {
    console.error(
      "Error in textToSpeech:",
      error.response ? error.response.data : error.message
    );
    process.exit(1);
  }
}

/**
 * Speeds up an audio file using FFmpeg.
 * @param {string} inputPath - Path to the input audio file.
 * @param {string} outputPath - Path to save the sped-up audio file.
 * @param {number} speed - Speed factor to apply.
 */
function speedUpAudio(inputPath, outputPath, speed) {
  return new Promise((resolve, reject) => {
    ffmpeg(inputPath)
      .audioFilters(`atempo=${speed}`)
      .on("error", (err) => {
        console.error("Error speeding up audio:", err.message);
        reject(err);
        process.exit(1);
      })
      .on("end", () => {
        resolve();
      })
      .save(outputPath);
  });
}

/**
 * Combines multiple audio files into a single MP3 using FFmpeg.
 * @param {string[]} audioFiles - Array of audio file paths.
 * @param {string} outputPath - Path to save the combined audio.
 */
function combineAudio(audioFiles, outputPath) {
  return new Promise((resolve, reject) => {
    const command = ffmpeg();

    audioFiles.forEach((file) => {
      command.input(file);
    });

    command
      .on("error", (err) => {
        console.error("Error combining audio:", err.message);
        reject(err);
        process.exit(1);
      })
      .on("end", () => {
        resolve();
      })
      .mergeToFile(outputPath, CONFIG.OUTPUT_AUDIO_DIR);
  });
}

main();
