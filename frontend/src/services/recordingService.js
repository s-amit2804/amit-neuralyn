import api from './api';

function blobToBase64(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const [, result] = String(reader.result).split(',');
      resolve(result);
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

export async function submitRecording(audioBlob, fileName = 'voice-note.webm') {
  const audioBase64 = await blobToBase64(audioBlob);
  const response = await api.post('/assessment/analyze', {
    audioBase64,
    audioFileName: fileName,
  });

  return response.data.data;
}
