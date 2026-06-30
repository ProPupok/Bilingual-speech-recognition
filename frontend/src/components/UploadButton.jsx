import { useRef, useState, useEffect } from 'react';
import { audioApi } from '../api/audioApi';
import uploadIcon from '../assets/upload-icon.svg';
import { useToast } from './ui/toastContext';
import Modal from './ui/Modal';
import { colors, radius, focusRing } from '../theme';

// Local date as YYYY-MM-DD for the native date input default value
function todayStr() {
  const d = new Date();
  const tz = d.getTimezoneOffset() * 60000;
  return new Date(d.getTime() - tz).toISOString().slice(0, 10);
}

// Drop the extension so the default title reads like a name, not a file
function fileNameStem(name) {
  const dot = name.lastIndexOf('.');
  return dot > 0 ? name.slice(0, dot) : name;
}

// Make the default title unique against existing names by appending " (2)", " (3)"…
function makeUniqueTitle(base, takenLower) {
  if (!takenLower.includes(base.toLowerCase())) return base;
  let n = 2;
  while (takenLower.includes(`${base} (${n})`.toLowerCase())) n++;
  return `${base} (${n})`;
}

function UploadButton({ onUploadStart, onUploadEnd, userRole, style }) {
  const fileInputRef = useRef(null);
  const toast = useToast();

  const [modalOpen, setModalOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [title, setTitle] = useState('');
  const [recordedDate, setRecordedDate] = useState(todayStr());
  const [isDragOver, setIsDragOver] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [existingNames, setExistingNames] = useState([]);

  // Keep the latest names in a ref so file-pick / submit always see fresh data
  const existingNamesRef = useRef([]);
  useEffect(() => { existingNamesRef.current = existingNames; }, [existingNames]);

  // Кнопка недоступна только если роль "user"
  const isUserRole = userRole?.toLowerCase() === 'user';
  const isDisabled = isUserRole;

  const openModal = async () => {
    if (isUserRole) return;
    setSelectedFile(null);
    setTitle('');
    setRecordedDate(todayStr());
    setIsDragOver(false);
    setIsSubmitting(false);
    setErrorMsg('');
    setExistingNames([]);
    setModalOpen(true);

    // Load existing names so we can pre-generate a unique title and validate inline
    try {
      const list = await audioApi.fetchAudioList();
      setExistingNames(list.map((a) => (a.filename || '').toLowerCase()));
    } catch (error) {
      console.error('Не удалось загрузить список названий:', error);
      setExistingNames([]);
    }
  };

  const closeModal = () => {
    if (isSubmitting) return;
    setModalOpen(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const applyFile = (file) => {
    if (!file) return;
    setSelectedFile(file);
    setErrorMsg('');
    // Default the title to a unique variant of the file name (without extension),
    // unless the user already typed something.
    setTitle((prev) => (prev.trim() ? prev : makeUniqueTitle(fileNameStem(file.name), existingNamesRef.current)));
  };

  const handleFileChange = (e) => {
    applyFile(e.target.files?.[0]);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragOver(false);
    applyFile(e.dataTransfer.files?.[0]);
  };

  const handleSubmit = async () => {
    if (!selectedFile) {
      setErrorMsg('Выберите аудиофайл для загрузки');
      return;
    }

    if (dateTooLate) {
      setErrorMsg('Дата записи не может быть позже сегодняшней');
      return;
    }

    const file = selectedFile;
    const finalTitle = title.trim() || file.name;

    // Inline pre-check so the user can fix it without re-uploading
    if (existingNamesRef.current.includes(finalTitle.toLowerCase())) {
      setErrorMsg('Аудиозапись с таким названием уже существует. Измените название.');
      return;
    }

    const tempId = `temp-${Date.now()}`;
    setIsSubmitting(true);
    setErrorMsg('');
    onUploadStart(finalTitle, tempId);
    toast.info(`Загрузка «${finalTitle}»...`);

    try {
      await audioApi.uploadAudioFile(file, { title: finalTitle, recordedAt: recordedDate });
      onUploadEnd(tempId, true);
      toast.success(`«${finalTitle}» загружен и обрабатывается`);
      setIsSubmitting(false);
      setModalOpen(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    } catch (error) {
      console.error('Ошибка загрузки:', error);
      onUploadEnd(tempId, false);
      setIsSubmitting(false);
      if (error?.response?.status === 409) {
        // Remember this name so the inline check catches it immediately next time
        setExistingNames((prev) => (prev.includes(finalTitle.toLowerCase()) ? prev : [...prev, finalTitle.toLowerCase()]));
        setErrorMsg('Аудиозапись с таким названием уже существует. Измените название.');
      } else {
        setErrorMsg('Не удалось загрузить аудио. Попробуйте ещё раз.');
      }
    }
  };

  const today = todayStr();
  const dateTooLate = !!recordedDate && recordedDate > today;

  const inputBaseStyle = {
    width: '100%',
    padding: '10px 12px',
    borderRadius: radius.sm,
    border: `1px solid ${colors.borderStrong}`,
    boxSizing: 'border-box',
    outline: 'none',
    fontSize: '14px',
    fontFamily: 'inherit',
    transition: 'border-color 0.15s ease, box-shadow 0.15s ease',
  };

  const focusHandlers = {
    onFocus: (e) => { e.currentTarget.style.borderColor = colors.primary; e.currentTarget.style.boxShadow = focusRing; },
    onBlur: (e) => { e.currentTarget.style.borderColor = colors.borderStrong; e.currentTarget.style.boxShadow = 'none'; },
  };

  return (
    <>
      <button
        onClick={openModal}
        disabled={isDisabled}
        onMouseEnter={(e) => {
          if (isDisabled) return;
          e.currentTarget.style.backgroundColor = '#cfcfcf';
          e.currentTarget.style.boxShadow = '0 4px 10px rgba(0,0,0,0.12)';
          e.currentTarget.style.transform = 'translateY(-1px)';
        }}
        onMouseLeave={(e) => {
          if (isDisabled) return;
          e.currentTarget.style.backgroundColor = '#d9d9d9';
          e.currentTarget.style.boxShadow = '0 1px 2px rgba(0,0,0,0.08)';
          e.currentTarget.style.transform = 'translateY(0)';
        }}
        style={{
          width: '160px',
          height: '48px',
          padding: 0,
          backgroundColor: isDisabled ? '#e0e0e0' : '#d9d9d9',
          color: isDisabled ? '#a0a0a0' : '#000',
          border: 'none',
          borderRadius: '8px',
          cursor: isDisabled ? 'not-allowed' : 'pointer',
          fontWeight: 'bold',
          fontSize: '18px',
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          verticalAlign: 'middle',
          gap: '12px',
          boxSizing: 'border-box',
          opacity: isUserRole ? 0.7 : 1,
          boxShadow: isDisabled ? 'none' : '0 1px 2px rgba(0,0,0,0.08)',
          transition: 'background-color 0.2s ease, box-shadow 0.2s ease, transform 0.2s ease',
          ...style,
        }}
        title={isUserRole ? 'Загрузка доступна только менеджерам и администраторам' : ''}
      >
        <span>Загрузить</span>
        <img
          src={uploadIcon}
          alt=""
          style={{
            width: '24px',
            height: '24px',
            objectFit: 'contain',
            display: 'block',
            transform: 'translateY(-1px)',
            filter: isDisabled ? 'grayscale(1) opacity(0.5)' : 'none',
          }}
        />
      </button>

      <Modal open={modalOpen} onClose={closeModal} maxWidth="460px" closeOnBackdrop={!isSubmitting}>
        <h4 style={{ fontSize: '20px', fontWeight: 'bold', margin: '0 0 18px 0', color: colors.textStrong }}>
          Загрузить аудиозапись
        </h4>

        {/* File picker / drop zone */}
        <div
          onClick={() => { if (!isSubmitting) fileInputRef.current?.click(); }}
          onDragOver={(e) => { if (isSubmitting) return; e.preventDefault(); setIsDragOver(true); }}
          onDragLeave={() => setIsDragOver(false)}
          onDrop={(e) => { if (!isSubmitting) handleDrop(e); }}
          style={{
            border: `2px dashed ${isDragOver ? colors.primary : colors.borderStrong}`,
            borderRadius: radius.md,
            padding: '22px 16px',
            textAlign: 'center',
            cursor: isSubmitting ? 'default' : 'pointer',
            backgroundColor: isDragOver ? colors.primarySoft : colors.page,
            transition: 'border-color 0.15s ease, background-color 0.15s ease',
            marginBottom: '18px',
            opacity: isSubmitting ? 0.6 : 1,
          }}
        >
          {selectedFile ? (
            <div style={{ fontSize: '14px', fontWeight: 600, color: colors.text, wordBreak: 'break-all' }}>
              {selectedFile.name}
            </div>
          ) : (
            <div style={{ fontSize: '14px', color: colors.textMuted }}>
              Перетащите файл сюда или <span style={{ color: colors.primary, fontWeight: 600 }}>выберите</span>
            </div>
          )}
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept="audio/*"
          onChange={handleFileChange}
          style={{ display: 'none' }}
        />

        {/* Title */}
        <div style={{ marginBottom: '16px' }}>
          <label style={{ display: 'block', fontSize: '14px', fontWeight: 600, marginBottom: '6px' }}>
            Название
          </label>
          <input
            type="text"
            value={title}
            placeholder="Название аудиозаписи"
            disabled={isSubmitting}
            onChange={(e) => { setTitle(e.target.value); if (errorMsg) setErrorMsg(''); }}
            style={{ ...inputBaseStyle, borderColor: errorMsg ? colors.danger : colors.borderStrong }}
            {...focusHandlers}
          />
          {errorMsg && (
            <div style={{ marginTop: '8px', fontSize: '13px', fontWeight: 500, color: colors.danger }}>
              {errorMsg}
            </div>
          )}
        </div>

        {/* Recorded date */}
        <div style={{ marginBottom: '24px' }}>
          <label style={{ display: 'block', fontSize: '14px', fontWeight: 600, marginBottom: '6px' }}>
            Дата записи
          </label>
          <input
            type="date"
            value={recordedDate}
            max={today}
            disabled={isSubmitting}
            onChange={(e) => { setRecordedDate(e.target.value); if (errorMsg) setErrorMsg(''); }}
            style={{ ...inputBaseStyle, borderColor: dateTooLate ? colors.danger : colors.borderStrong }}
            {...focusHandlers}
          />
          {dateTooLate && (
            <div style={{ marginTop: '8px', fontSize: '13px', fontWeight: 500, color: colors.danger }}>
              Дата записи не может быть позже сегодняшней
            </div>
          )}
        </div>

        <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
          <button
            type="button"
            onClick={closeModal}
            disabled={isSubmitting}
            onMouseEnter={(e) => { if (!isSubmitting) e.currentTarget.style.backgroundColor = '#ececec'; }}
            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = colors.page)}
            style={{ backgroundColor: colors.page, color: '#333', border: `1px solid ${colors.borderStrong}`, padding: '10px 18px', borderRadius: radius.sm, fontWeight: 600, cursor: isSubmitting ? 'not-allowed' : 'pointer', opacity: isSubmitting ? 0.6 : 1, transition: 'background-color 0.15s ease' }}
          >
            Отмена
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={!selectedFile || isSubmitting || dateTooLate}
            onMouseEnter={(e) => { if (selectedFile && !isSubmitting && !dateTooLate) e.currentTarget.style.backgroundColor = colors.primaryHover; }}
            onMouseLeave={(e) => { if (selectedFile && !isSubmitting && !dateTooLate) e.currentTarget.style.backgroundColor = colors.primary; }}
            style={{ backgroundColor: colors.primary, color: '#fff', border: 'none', padding: '10px 18px', borderRadius: radius.sm, fontWeight: 'bold', cursor: (!selectedFile || isSubmitting || dateTooLate) ? 'not-allowed' : 'pointer', opacity: (!selectedFile || isSubmitting || dateTooLate) ? 0.5 : 1, transition: 'background-color 0.15s ease' }}
          >
            {isSubmitting ? 'Загрузка…' : 'Загрузить'}
          </button>
        </div>
      </Modal>
    </>
  );
}

export default UploadButton;
