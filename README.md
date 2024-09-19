# 🎙️ article to speech converter

A small project to convert text articles to speech using Eleven Labs' Text-to-Speech API, producing a single MP3 file – with the option to speed things up, too.

## Prerequisites

- Node.js
- FFmpeg
- Eleven Labs API key

## Installation

1. Clone the repository:

   ```
   git clone https://github.com/yourusername/article-to-speech.git
   cd article-to-speech
   ```

2. Install dependencies:

   ```
   npm install
   ```

3. Create a `.env` file in the project root:

   ```
   VOICE_ID=your_eleven_labs_voice_id
   ELEVEN_LABS_API_KEY=your_eleven_labs_api_key
   ```

## Usage

1. Place your article in the `articles` folder (e.g., `article.txt`).

2. Update `ARTICLE_FILE_NAME` in `index.js`.

3. Run the script:

   ```
   npm start
   ```

4. Find the generated MP3 in the `output` folder.

## Configuration

Adjust these variables in `index.js`:

- `ARTICLE_FILE_NAME`: Name of your input text file
- `SPEED_OF_SPEECH`: Playback speed of the generated audio
- `CHUNK_SIZE`: Maximum characters per audio chunk

## License

[MIT License](LICENSE)

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.
