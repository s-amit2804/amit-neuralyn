const { execFile } = require('child_process');
const path = require('path');
const fs = require('fs/promises');
const os = require('os');
const crypto = require('crypto');

const REPO_ROOT = path.resolve(__dirname, '..', '..');
const PYTHON_BIN = process.env.ML_PYTHON_BIN || path.join(REPO_ROOT, 'venv', 'bin', 'python');
const PIPELINE_SCRIPT = path.join(__dirname, '..', 'scripts', 'run_ml_pipeline.py');

const EXTENSION_BY_MIME = {
  'audio/mpeg': '.mpeg',
  'audio/mp3': '.mp3',
  'audio/wav': '.wav',
  'audio/x-wav': '.wav',
  'audio/webm': '.webm',
  'audio/ogg': '.ogg',
  'audio/mp4': '.mp4',
  'audio/x-m4a': '.m4a',
  'audio/aac': '.aac',
};

const runMlPipeline = (payload) =>
  new Promise((resolve, reject) => {
    console.log(
      `[ML] Invoking Python pipeline via ${PYTHON_BIN} ` +
      `(text=${Boolean(payload.text)}, audio=${Boolean(payload.audio_path)})`
    );

    const child = execFile(
      PYTHON_BIN,
      [PIPELINE_SCRIPT],
      {
        cwd: REPO_ROOT,
        maxBuffer: 10 * 1024 * 1024,
        timeout: 180000,
      },
      (error, stdout, stderr) => {
        if (error) {
          const details = stderr?.trim() || stdout?.trim() || error.message;
          return reject(new Error(`ML pipeline execution failed: ${details}`));
        }

        try {
          const parsed = JSON.parse(stdout);
          console.log(
            `[ML] Pipeline completed successfully ` +
            `(language=${parsed.detected_language || 'unknown'}, intensity=${parsed.scoring?.intensity || 'n/a'})`
          );
          resolve(parsed);
        } catch (parseError) {
          reject(
            new Error(
              `ML pipeline returned invalid JSON: ${parseError.message}${
                stderr?.trim() ? ` | stderr: ${stderr.trim()}` : ''
              }`
            )
          );
        }
      }
    );

    child.stdin.write(JSON.stringify(payload));
    child.stdin.end();
  });

const parseBase64Audio = (audioBase64) => {
  if (!audioBase64) {
    return null;
  }

  const dataUrlMatch = audioBase64.match(/^data:(.+?);base64,(.+)$/);
  if (dataUrlMatch) {
    return {
      mimeType: dataUrlMatch[1],
      buffer: Buffer.from(dataUrlMatch[2], 'base64'),
    };
  }

  return {
    mimeType: null,
    buffer: Buffer.from(audioBase64, 'base64'),
  };
};

const getAudioExtension = (mimeType, fileName = '') => {
  const fileExtension = path.extname(fileName);
  if (fileExtension) {
    return fileExtension;
  }

  return EXTENSION_BY_MIME[mimeType] || '.wav';
};

const withTemporaryAudioFile = async ({ audioBase64, fileName }, callback) => {
  const parsed = parseBase64Audio(audioBase64);
  if (!parsed) {
    return callback(null);
  }

  const extension = getAudioExtension(parsed.mimeType, fileName);
  const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'mindbridge-audio-'));
  const tempFilePath = path.join(
    tempDir,
    `${crypto.randomUUID ? crypto.randomUUID() : Date.now()}${extension}`
  );

  await fs.writeFile(tempFilePath, parsed.buffer);
  console.log(`[ML] Temporary audio file created: ${path.basename(tempFilePath)}`);

  try {
    return await callback(tempFilePath);
  } finally {
    await fs.rm(tempDir, { recursive: true, force: true });
    console.log(`[ML] Temporary audio file cleaned up: ${path.basename(tempFilePath)}`);
  }
};

module.exports = {
  runMlPipeline,
  withTemporaryAudioFile,
};
