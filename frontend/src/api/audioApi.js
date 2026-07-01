import apiClient from './apiClient';

export const audioApi = {
  // Matches GET /api/v1/audio/ (supports optional corpus filters)
  fetchAudioList: async (filters = {}) => {
    const params = {};
    if (filters.word && filters.word.trim()) params.q = filters.word.trim();
    if (filters.lang) params.lang = filters.lang;
    if (filters.status) params.status = filters.status;
    if (filters.speaker && filters.speaker.trim()) params.speaker = filters.speaker.trim();
    if (filters.dateFrom) params.date_from = filters.dateFrom;
    if (filters.dateTo) params.date_to = filters.dateTo;

    const response = await apiClient.get('/api/v1/audio/', { params });
    return response.data;
  },

  // Matches GET /api/v1/audio/by-filename
  searchByFilename: async (filename) => {
    const response = await apiClient.get('/api/v1/audio/by-filename', {
      params: { filename: filename.trim() },
    });
    return response.data;
  },

  // Matches POST /api/v1/upload-audio/
  uploadAudioFile: async (file, { title, recordedAt } = {}) => {
    const formData = new FormData();
    formData.append('file', file);
    if (title) formData.append('title', title);
    if (recordedAt) formData.append('recorded_at', recordedAt);

    const response = await apiClient.post('/api/v1/upload-audio/', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  // Matches GET /api/v1/audio/{audio_id}/status
  fetchAudioStatus: async (audioId) => {
    const response = await apiClient.get(`/api/v1/audio/${audioId}/status`);
    return response.data;
  },

  // Matches GET /api/v1/audio/{audio_id}/sizes
  fetchAudioSizes: async (audioId) => {
    const response = await apiClient.get(`/api/v1/audio/${audioId}/sizes`);
    return response.data;
  },

  // Matches GET /api/v1/audio/storage/total
  fetchTotalStorage: async () => {
    const response = await apiClient.get('/api/v1/audio/storage/total');
    return response.data;
  },

  // Matches GET /api/v1/audio/{audio_id}?type=processed
  fetchAudioFile: async (audioId, type) => {
    const response = await apiClient.get(`/api/v1/audio/${audioId}?type=${type}`, {
      responseType: 'blob'
    });
    return URL.createObjectURL(response.data);
  },

  // Matches GET /api/v1/transcriptions/{audio_id}
  fetchTranscription: async (audioId) => {
    const response = await apiClient.get(`/api/v1/transcriptions/${audioId}`);
    return response.data;
  },

  // Matches DELETE /api/v1/audio/{audio_id}
  deleteAudio: async (audioId) => {
    const response = await apiClient.delete(`/api/v1/audio/${audioId}`);
    return response.data;
  }
};