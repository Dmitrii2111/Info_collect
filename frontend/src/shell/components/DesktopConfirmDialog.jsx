import { useEffect, useRef, useState } from "react";
import {
  CheckCircleOutlined,
  FileTextOutlined,
  InfoCircleOutlined,
  LoadingOutlined,
  SyncOutlined,
  WarningOutlined,
} from "@ant-design/icons";
import { DesktopModalShell } from "./DesktopModalShell";

export function DesktopConfirmDialog({ config, onClose }) {
  const loadingTimerRef = useRef(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => () => window.clearTimeout(loadingTimerRef.current), []);

  const handleConfirm = () => {
    if (loading) {
      return;
    }

    setLoading(true);
    loadingTimerRef.current = window.setTimeout(() => {
      setLoading(false);
      setSuccess(true);
    }, 3000);
  };

  return (
    <DesktopModalShell
      onClose={onClose}
      size="narrow"
      closeDisabled={loading}
      headerContent={(
        <div className="reg-confirm-title-row">
          <div className="reg-confirm-icon">
            {loading ? <LoadingOutlined aria-hidden="true" /> : <SyncOutlined aria-hidden="true" />}
          </div>
          <div>
            <h2 className="reg-modal-title" id="desktop-modal-title">
              {success ? "Структура обновлена" : loading ? "Обновляем структуру" : config.title}
            </h2>
            <p className="reg-modal-subtitle">
              {loading ? "Получаем актуальные данные из реестра" : success ? "Новые помещения добавлены, инспекции не удалялись." : config.subtitle}
            </p>
          </div>
        </div>
      )}
      footer={(
        <>
          <button className="reg-modal-btn reg-modal-btn-secondary" type="button" onClick={onClose} disabled={loading}>
            {success ? "Закрыть" : "Отмена"}
          </button>
          {!success ? (
            <button className="reg-modal-btn reg-modal-btn-primary" type="button" onClick={handleConfirm} disabled={loading}>
              {loading ? <LoadingOutlined aria-hidden="true" /> : <CheckCircleOutlined aria-hidden="true" />}
              Обновить структуру
            </button>
          ) : null}
        </>
      )}
    >
      {success ? (
        <div className="reg-success-card reg-success-card-full">
          <CheckCircleOutlined aria-hidden="true" />
          <div>
            <strong>Обновление завершено</strong>
            <span>Структура объектов пересчитана по текущему реестру.</span>
          </div>
        </div>
      ) : (
        <>
          <div className="reg-confirm-file">
            <FileTextOutlined aria-hidden="true" />
            <div>
              <strong>{config.fileName}</strong>
              <span>{config.fileMeta}</span>
            </div>
            <span className="reg-confirm-warning">Требует внимания</span>
          </div>
          {loading ? (
            <div className="reg-loading-card reg-loading-card-full">
              <LoadingOutlined aria-hidden="true" />
              <div>
                <strong>Обновляем структуру</strong>
                <span>Получаем актуальные данные из реестра</span>
              </div>
            </div>
          ) : (
            <>
              <div className="reg-modal-note reg-modal-note-yellow">
                <InfoCircleOutlined aria-hidden="true" />
                <span>Изменения в системе:</span>
              </div>
              <div className="reg-confirm-list">
                <div><CheckCircleOutlined aria-hidden="true" /> Структура объектов будет пересчитана</div>
                <div><CheckCircleOutlined aria-hidden="true" /> Новые помещения будут добавлены</div>
                <div><WarningOutlined aria-hidden="true" /> Инспекции не будут удалены</div>
              </div>
            </>
          )}
        </>
      )}
    </DesktopModalShell>
  );
}
