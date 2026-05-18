import { useEffect, useRef, useState } from "react";
import {
  ArrowLeftOutlined,
  CameraOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  FileTextOutlined,
  InboxOutlined,
  MinusOutlined,
  PlusOutlined,
  SyncOutlined,
} from "@ant-design/icons";
import { MobileBottomNav } from "../components/MobileBottomNav.jsx";
import { mobileReceiptBatchConfirmData } from "../data/mobileMockData.js";

const resultOptions = [
  { key: "confirmed", label: "Подтвердить", tone: "success", icon: CheckCircleOutlined },
  { key: "rejected", label: "Отклонить", tone: "danger", icon: CloseCircleOutlined },
];

export function MobileReceiptBatchConfirmScreen({ activeNavKey, onBack, onNavSelect }) {
  const data = mobileReceiptBatchConfirmData;
  const [actualQuantity, setActualQuantity] = useState(data.quantity);
  const [checks, setChecks] = useState(() =>
    Object.fromEntries(data.checks.map((check) => [check.id, check.checked])),
  );
  const [result, setResult] = useState("confirmed");
  const [selectedReasons, setSelectedReasons] = useState([]);
  const [comment, setComment] = useState("");
  const [photoMenuOpen, setPhotoMenuOpen] = useState(false);
  const [photo, setPhoto] = useState(null);
  const [feedback, setFeedback] = useState("");
  const galleryInputRef = useRef(null);
  const cameraInputRef = useRef(null);

  useEffect(() => {
    return () => {
      if (photo?.url) {
        URL.revokeObjectURL(photo.url);
      }
    };
  }, [photo]);

  const handlePhotoChange = (event) => {
    const file = event.target.files?.[0];

    if (!file) return;

    const url = URL.createObjectURL(file);
    setPhoto((currentPhoto) => {
      if (currentPhoto?.url) {
        URL.revokeObjectURL(currentPhoto.url);
      }

      return { name: file.name, url };
    });
    setPhotoMenuOpen(false);
    setFeedback("Фото добавлено локально");
    event.target.value = "";
  };

  const handleRemovePhoto = () => {
    setPhoto((currentPhoto) => {
      if (currentPhoto?.url) {
        URL.revokeObjectURL(currentPhoto.url);
      }

      return null;
    });
    setFeedback("Фото удалено");
  };

  const toggleReason = (reason) => {
    setSelectedReasons((current) =>
      current.includes(reason) ? current.filter((item) => item !== reason) : [...current, reason],
    );
  };

  const selectedResult = resultOptions.find((option) => option.key === result) ?? resultOptions[0];

  return (
    <div className="mobile-receipt-screen">
      <header className="mobile-receipt-header">
        <button type="button" aria-label="Назад на склад" onClick={onBack}>
          <ArrowLeftOutlined aria-hidden="true" />
        </button>
        <h1>Проверка партии</h1>
        <button
          type="button"
          aria-label="Синхронизация"
          onClick={() => setFeedback("Откройте экран синхронизации для отправки изменений")}
        >
          <SyncOutlined aria-hidden="true" />
        </button>
      </header>

      <main className="mobile-receipt-content">
        <section className="mobile-card mobile-receipt-summary">
          <div className="mobile-receipt-summary-head">
            <div>
              <h2>{data.itemTitle}</h2>
              <span>ID: {data.itemCode}</span>
            </div>
            <div>
              <em>{data.status}</em>
              <em>{data.source}</em>
            </div>
          </div>
          <div className="mobile-receipt-meta-grid">
            <span>
              <InboxOutlined aria-hidden="true" />
              {data.quantity} {data.unit}
            </span>
            <span>
              <InboxOutlined aria-hidden="true" />
              {data.warehouse}
            </span>
            <span>Партия: {data.id}</span>
            <span>Создал: {data.createdBy}</span>
            <span>{data.createdAt}</span>
          </div>
        </section>

        <section className="mobile-card mobile-receipt-block">
          <h3>Данные поступления</h3>
          <p>Данные внесены диспетчером</p>
          {data.dispatcherFields.map((field) => (
            <div className="mobile-receipt-readonly-row" key={field.label}>
              <span>{field.label}</span>
              <strong>
                {field.label === "Документ" ? <FileTextOutlined aria-hidden="true" /> : null}
                {field.value}
              </strong>
            </div>
          ))}
        </section>

        <section className="mobile-card mobile-receipt-block">
          <h3>Проверка оператором</h3>
          <label className="mobile-receipt-quantity">
            <span>Количество по факту</span>
            <div>
              <button
                type="button"
                onClick={() => setActualQuantity((value) => Math.max(0, Number(value) - 1))}
              >
                <MinusOutlined aria-hidden="true" />
              </button>
              <input
                type="number"
                value={actualQuantity}
                onChange={(event) => setActualQuantity(event.target.value)}
              />
              <button type="button" onClick={() => setActualQuantity((value) => Number(value) + 1)}>
                <PlusOutlined aria-hidden="true" />
              </button>
            </div>
          </label>

          <div className="mobile-receipt-checks">
            {data.checks.map((check) => (
              <label key={check.id}>
                <input
                  type="checkbox"
                  checked={Boolean(checks[check.id])}
                  onChange={() => setChecks((current) => ({ ...current, [check.id]: !current[check.id] }))}
                />
                <span>{check.label}</span>
              </label>
            ))}
          </div>

          <div className="mobile-receipt-result">
            <span>Результат проверки</span>
            <div>
              {resultOptions.map((option) => {
                const Icon = option.icon;

                return (
                  <button
                    className={option.key === result ? `is-active is-${option.tone}` : ""}
                    type="button"
                    key={option.key}
                    onClick={() => setResult(option.key)}
                  >
                    <Icon aria-hidden="true" />
                    {option.label}
                  </button>
                );
              })}
            </div>
          </div>

          <div className={`mobile-receipt-reasons${result === "rejected" ? " is-enabled" : ""}`}>
            <span>Причина отклонения</span>
            <div>
              {data.rejectReasons.map((reason) => (
                <button
                  className={selectedReasons.includes(reason) ? "is-active" : ""}
                  type="button"
                  key={reason}
                  onClick={() => toggleReason(reason)}
                  disabled={result !== "rejected"}
                >
                  {reason}
                </button>
              ))}
            </div>
            <p>Комментарий обязателен при отклонении</p>
          </div>
        </section>

        <section className="mobile-card mobile-receipt-block">
          <div className="mobile-receipt-photo-title">
            <h3>Фото и комментарий</h3>
            <span>{photo ? "1" : "0"} / 5</span>
          </div>
          <div className="mobile-receipt-photo">
            {photo ? (
              <div className="mobile-receipt-photo-preview">
                <img src={photo.url} alt="Фото партии" />
                <span>{photo.name}</span>
                <button type="button" onClick={handleRemovePhoto}>Удалить фото</button>
              </div>
            ) : null}
            <button type="button" onClick={() => setPhotoMenuOpen((current) => !current)}>
              <CameraOutlined aria-hidden="true" />
              {photo ? "Заменить фото" : "Добавить фото"}
            </button>
            {photoMenuOpen ? (
              <div className="mobile-receipt-photo-actions">
                <button type="button" onClick={() => galleryInputRef.current?.click()}>
                  Загрузить из фото
                </button>
                <button type="button" onClick={() => cameraInputRef.current?.click()}>
                  Сделать снимок
                </button>
              </div>
            ) : null}
            <input
              ref={galleryInputRef}
              className="mobile-receipt-file-input"
              type="file"
              accept="image/*"
              onChange={handlePhotoChange}
            />
            <input
              ref={cameraInputRef}
              className="mobile-receipt-file-input"
              type="file"
              accept="image/*"
              capture="environment"
              onChange={handlePhotoChange}
            />
          </div>
          <label className="mobile-receipt-comment">
            <span>Комментарий оператора</span>
            <textarea
              placeholder="Опишите результат проверки или причину отклонения..."
              rows={3}
              value={comment}
              onChange={(event) => setComment(event.target.value)}
            />
          </label>
        </section>

        <p className="mobile-receipt-note">
          Результат проверки будет сохранен локально и синхронизирован с центральной системой при
          наличии соединения.
        </p>

        {feedback ? <div className="mobile-receipt-feedback">{feedback}</div> : null}
      </main>

      <div className="mobile-receipt-action-bar">
        <button
          type="button"
          onClick={() => setFeedback(`${selectedResult.label}: проверка сохранена локально`)}
        >
          Подтвердить поступление
        </button>
        <button type="button" onClick={onBack}>Отмена</button>
      </div>

      <MobileBottomNav activeKey={activeNavKey} onSelect={onNavSelect} />
    </div>
  );
}
