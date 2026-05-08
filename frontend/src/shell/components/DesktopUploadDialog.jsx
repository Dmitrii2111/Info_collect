import { useEffect, useRef, useState } from "react";
import {
  CheckCircleOutlined,
  FileExcelOutlined,
  FileTextOutlined,
  InboxOutlined,
  InfoCircleOutlined,
  LoadingOutlined,
  ReloadOutlined,
  SyncOutlined,
  TableOutlined,
  WarningOutlined,
} from "@ant-design/icons";
import { DesktopModalShell } from "./DesktopModalShell";

const MAX_EXCEL_SIZE = 10 * 1024 * 1024;
const EXCEL_EXTENSIONS = [".xlsx", ".xls"];

function formatFileSize(size) {
  if (size >= 1024 * 1024) {
    return `${(size / 1024 / 1024).toFixed(1)} MB`;
  }

  return `${Math.max(1, Math.round(size / 1024))} KB`;
}

function getFileExtension(fileName) {
  const dotIndex = fileName.lastIndexOf(".");
  return dotIndex >= 0 ? fileName.slice(dotIndex).toLowerCase() : "";
}

function validateExcelFile(file) {
  const extension = getFileExtension(file.name);

  if (!EXCEL_EXTENSIONS.includes(extension)) {
    return "Разрешены только Excel-файлы .xlsx или .xls.";
  }

  if (file.size > MAX_EXCEL_SIZE) {
    return "Размер файла не должен превышать 10 МБ.";
  }

  return "";
}

export function DesktopUploadDialog({ config, onClose }) {
  const inputRef = useRef(null);
  const loadingTimerRef = useRef(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [pendingFile, setPendingFile] = useState(null);
  const [validationError, setValidationError] = useState("");
  const [loadingState, setLoadingState] = useState(null);
  const [successMessage, setSuccessMessage] = useState("");

  useEffect(() => () => window.clearTimeout(loadingTimerRef.current), []);

  const isLoading = Boolean(loadingState);

  const runLoading = ({ title, description, nextFile, onComplete }) => {
    window.clearTimeout(loadingTimerRef.current);
    setSuccessMessage("");
    setValidationError("");
    setLoadingState({ title, description });

    loadingTimerRef.current = window.setTimeout(() => {
      setLoadingState(null);
      onComplete?.(nextFile);
    }, 3000);
  };

  const handleFile = (file) => {
    if (!file || isLoading) {
      return;
    }

    const error = validateExcelFile(file);
    if (error) {
      setPendingFile(null);
      setSelectedFile(null);
      setSuccessMessage("");
      setValidationError(error);
      return;
    }

    setPendingFile(file);
    setSelectedFile(null);
    runLoading({
      title: "Проверяем файл",
      description: "Проверяем формат и структуру Excel",
      nextFile: file,
      onComplete: (checkedFile) => {
        setPendingFile(null);
        setSelectedFile(checkedFile);
      },
    });
  };

  const handleInputChange = (event) => {
    handleFile(event.target.files?.[0]);
    event.target.value = "";
  };

  const handleDrop = (event) => {
    event.preventDefault();
    handleFile(event.dataTransfer.files?.[0]);
  };

  const handleRecheck = () => {
    if (!selectedFile || isLoading) {
      return;
    }

    const file = selectedFile;
    setSelectedFile(null);
    setPendingFile(file);
    runLoading({
      title: "Проверяем файл повторно",
      description: "Сверяем структуру и обязательные поля",
      nextFile: file,
      onComplete: (checkedFile) => {
        setPendingFile(null);
        setSelectedFile(checkedFile);
      },
    });
  };

  const handleUpdate = () => {
    if (!selectedFile || isLoading) {
      return;
    }

    runLoading({
      title: "Обновляем данные",
      description: "Заглушка до подключения backend/API",
      onComplete: () => {
        setPendingFile(null);
        setSelectedFile(null);
        setSuccessMessage("Данные реестра обновлены. Версия сохранена в истории импортов.");
      },
    });
  };

  const fileForLoading = pendingFile ?? selectedFile;

  return (
    <DesktopModalShell
      onClose={onClose}
      size="wide"
      title={config.title}
      subtitle={config.subtitle}
      closeDisabled={isLoading}
      bodyClassName="reg-import-body"
      footer={(
        <>
          <button className="reg-modal-btn reg-modal-btn-secondary" type="button" onClick={onClose} disabled={isLoading}>Отмена</button>
          <button className="reg-modal-btn reg-modal-btn-secondary" type="button" onClick={handleRecheck} disabled={isLoading || !selectedFile}>
            <ReloadOutlined aria-hidden="true" />
            Проверить заново
          </button>
          <button className="reg-modal-btn reg-modal-btn-primary" type="button" onClick={handleUpdate} disabled={isLoading || !selectedFile}>
            <SyncOutlined aria-hidden="true" />
            Обновить данные
          </button>
        </>
      )}
    >
      <div className="reg-import-summary">
        <div className="reg-import-current">
          <span className="reg-section-kicker">Текущий реестр</span>
          <div className="reg-file-row">
            <FileTextOutlined aria-hidden="true" />
            <div>
              <strong>{config.currentFile.name}</strong>
              <span>{config.currentFile.meta}</span>
            </div>
          </div>
        </div>
        {config.metrics.map((metric) => (
          <div className="reg-import-metric" key={metric.label}>
            <span>{metric.label}</span>
            <strong>{metric.value}</strong>
            <small className={metric.tone === "warning" ? "reg-text-warning" : undefined}>{metric.detail}</small>
          </div>
        ))}
      </div>

      <div className="reg-modal-note">
        <InfoCircleOutlined aria-hidden="true" />
        <span>{config.note}</span>
      </div>

      <div className="reg-upload-grid">
        <button
          className="reg-upload-drop"
          type="button"
          onClick={() => inputRef.current?.click()}
          onDragOver={(event) => event.preventDefault()}
          onDrop={handleDrop}
          disabled={isLoading}
        >
          <InboxOutlined aria-hidden="true" />
          <strong>Перетащите файл или выберите новую версию Excel</strong>
          <span>Поддерживаются форматы .xlsx, .xls до 10 МБ</span>
        </button>
        <input ref={inputRef} className="reg-file-input" type="file" accept=".xlsx,.xls" onChange={handleInputChange} />

        {loadingState ? (
          <div className="reg-loading-card">
            <LoadingOutlined aria-hidden="true" />
            <div>
              <strong>{loadingState.title}</strong>
              <span>{loadingState.description}</span>
              {fileForLoading ? <small>{fileForLoading.name}</small> : null}
            </div>
          </div>
        ) : selectedFile ? (
          <div className="reg-selected-file">
            <span className="reg-section-kicker">Выбран файл</span>
            <div className="reg-file-row">
              <FileExcelOutlined aria-hidden="true" />
              <div>
                <strong>{selectedFile.name}</strong>
                <span>{formatFileSize(selectedFile.size)} • выбран сейчас</span>
              </div>
              <span className="reg-selected-badge">Выбран</span>
            </div>
          </div>
        ) : successMessage ? (
          <div className="reg-success-card">
            <CheckCircleOutlined aria-hidden="true" />
            <div>
              <strong>Обновление завершено</strong>
              <span>{successMessage}</span>
            </div>
          </div>
        ) : null}
      </div>

      {validationError ? (
        <div className="reg-inline-error">
          <WarningOutlined aria-hidden="true" />
          <span>{validationError}</span>
        </div>
      ) : null}

      {selectedFile || successMessage ? (
        <>
          <div className="reg-validation-card">
            <h3>Проверка файла</h3>
            <div className="reg-validation-grid">
              {config.validationItems.map((item) => (
                <div className="reg-validation-item" key={item}>
                  <CheckCircleOutlined aria-hidden="true" />
                  {item}
                </div>
              ))}
            </div>
            <div className="reg-warning-list">
              <WarningOutlined aria-hidden="true" />
              <div>
                <strong>{config.warning.title}</strong>
                <span>{config.warning.text}</span>
              </div>
            </div>
          </div>

          <div className="reg-compare-card">
            <div className="reg-compare-title">
              <TableOutlined aria-hidden="true" />
              <div>
                <h3>{config.compare.title}</h3>
                <span>{config.compare.subtitle}</span>
              </div>
            </div>
            <div className="reg-change-list">
              {config.compare.changes.map((change) => <span key={change}>{change}</span>)}
            </div>
            <table className="reg-modal-table">
              <thead>
                <tr><th>Параметр</th><th>Текущий</th><th>Новый</th><th>Изменения</th></tr>
              </thead>
              <tbody>
                {config.compare.rows.map((row) => (
                  <tr key={row[0]}>
                    {row.map((cell) => <td key={cell}>{cell}</td>)}
                  </tr>
                ))}
              </tbody>
            </table>
            <label className="reg-checkbox-line">
              <input type="checkbox" defaultChecked disabled={isLoading} />
              <span>Сохранить текущую версию в истории импортов</span>
            </label>
          </div>
        </>
      ) : null}
    </DesktopModalShell>
  );
}
