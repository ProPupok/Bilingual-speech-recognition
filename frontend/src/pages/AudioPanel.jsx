import { useState, useEffect } from 'react';
import { audioApi } from '../api/audioApi';
import AudioPlayer from '../components/AudioPlayer';
import TranscriptionBox from '../components/TranscriptionBox';

function AudioPanel({ userRole, pendingUploads, uploadVersion }) {
  const [audioList, setAudioList] = useState([]);
  const [selectedAudioId, setSelectedAudioId] = useState(null);
  const [selectedTranscription, setSelectedTranscription] = useState('');
  const [selectedTranscriptionWords, setSelectedTranscriptionWords] = useState([]);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [totalStorageMb, setTotalStorageMb] = useState(null);

  useEffect(() => {
    loadAudioList();
  }, []);

  useEffect(() => {
    if (uploadVersion > 0) loadAudioList();
  }, [uploadVersion]);

  const loadAudioList = async () => {
    try {
      const data = await audioApi.fetchAudioList();
      setAudioList(data);
    } catch (error) {
      console.error("Ошибка загрузки аудио:", error);
    }
    loadTotalStorage();
  };

  const loadTotalStorage = async () => {
    try {
      const data = await audioApi.fetchTotalStorage();
      setTotalStorageMb(data.total_allocated_mb);
    } catch (error) {
      console.error("Ошибка загрузки общего размера хранилища:", error);
    }
  };

  const handleDeleteSuccess = () => {
    setSelectedAudioId(null);
    setSelectedTranscription('');
    setSelectedTranscriptionWords([]);
    loadAudioList();
  };

  const handleTranscribeClick = async (audioId) => {
    if (selectedAudioId === audioId) {
      setSelectedAudioId(null);
      setSelectedTranscription('');
      setSelectedTranscriptionWords([]);
    } else {
      setSelectedAudioId(audioId);
      setIsTranscribing(true);
      try {
        const data = await audioApi.fetchTranscription(audioId);
        setSelectedTranscription(data.transcription_text || 'Транскрипция не найдена.');
        setSelectedTranscriptionWords(data.words || []);
      } catch (error) {
        console.error(error);
        setSelectedTranscription('Ошибка загрузки транскрипции');
        setSelectedTranscriptionWords([]);
      } finally {
        setIsTranscribing(false);
      }
    }
  };

  const selectedAudioIndex = audioList.findIndex(a => a.id === selectedAudioId);
  const currentAudioName = selectedAudioIndex !== -1 ? `Аудио ${selectedAudioIndex + 1}` : '';
  const combinedAudioList = [...pendingUploads, ...audioList];

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '48px', height: '100%', minHeight: 0 }}>
      <div style={{ display: 'flex', flexDirection: 'column', minHeight: 0, height: '100%', alignItems: 'stretch' }}>
        <div style={{ marginBottom: '20px', width: '100%', display: 'flex', justifyContent: 'flex-start', alignItems: 'center', gap: '12px', flexShrink: 0 }}>
          <h2 style={{ fontSize: '28px', fontWeight: 'bold', margin: 0, padding: 0, textAlign: 'left', lineHeight: 1 }}>Аудиозаписи</h2>
          {totalStorageMb !== null && (
            <span style={{ fontSize: '14px', fontWeight: '500', lineHeight: 1, color: '#2e7d32', backgroundColor: '#e8f5e9', padding: '4px 10px', borderRadius: '12px', whiteSpace: 'nowrap', transform: 'translateY(3px)' }}>
              Всего: {totalStorageMb} МБ
            </span>
          )}
        </div>

        <div style={{ flex: 1, overflowY: 'auto', paddingRight: '12px', boxSizing: 'border-box', width: '100%' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', width: '100%' }}>
            {combinedAudioList.map((audio, index) => (
              <AudioPlayer
                key={audio.id}
                audio={audio}
                index={audio.isPending ? null : index - pendingUploads.length}
                isSelected={selectedAudioId === audio.id}
                onTranscribeToggle={handleTranscribeClick}
                onDeleteSuccess={handleDeleteSuccess}
                userRole={userRole}
              />
            ))}
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', minHeight: 0, height: '100%', alignItems: 'stretch' }}>
        <div style={{ flex: 1, height: '100%', minHeight: 0, width: '100%' }}>
          {selectedAudioId ? (
            <div style={{ display: 'flex', flexDirection: 'column', height: '100%', width: '100%' }}>
              <div style={{ marginBottom: '20px', width: '100%', display: 'flex', justifyContent: 'flex-start', flexShrink: 0 }}>
                <h2 style={{ fontSize: '28px', fontWeight: 'bold', margin: 0, padding: 0, textAlign: 'left' }}>Транскрипция</h2>
              </div>
              <TranscriptionBox
                transcriptionText={selectedTranscription}
                transcriptionWords={selectedTranscriptionWords}
                isLoading={isTranscribing}
                audioName={currentAudioName}
              />
            </div>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#9e9e9e', border: '2px dashed #e0e0e0', borderRadius: '6px' }}>
              Выберите аудиозапись для просмотра транскрипции
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default AudioPanel;
