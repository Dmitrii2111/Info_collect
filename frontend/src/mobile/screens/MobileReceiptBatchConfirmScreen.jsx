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
import {
  MOBILE_DRAFT_ENTITY_TYPES,
  MOBILE_DRAFT_TYPES,
  createMobileDraft,
  findMobileDraftByEntity,
  markMobileDraftReadyToQueue,
  saveMobileDraft,
} from "../../services/offline/index.js";

const resultOptions = [
  { key: "confirmed", label: "Подтвердить", tone: "success", icon: CheckCircleOutlined },
  { key: "rejected", label: "Отклонить", tone: "danger", icon: CloseCircleOutlined },
];
const DRAFT_SOURCE_SCREEN = "receiptBatchConfirm";
const DRAFT_AUTOSAVE_DELAY_MS = 300;

export function MobileReceiptBatchConfirmScreen({ activeNavKey, batch, onBack, onNavSelect }) {
  const data = batch ?? mobileReceiptBatchConfirmData;
  const defaultChecks = () => Object.fromEntries(data.checks.map((check) => [check.id, check.checked]));
  const draftEntityId = data.id;
  const latestDraftRef = useRef(null);
  const [actualQuantity, setActualQuantity] = useState(data.quantity);
  const [checks, setChecks] = useState(defaultChecks);
  const [result, setResult] = useState("confirmed");
  const [selectedReasons, setSelectedReasons] = useState([]);
  const [comment, setComment] = useState("");
  const [photoMenuOpen, setPhotoMenuOpen] = useState(false);
  const [photo, setPhoto] = useState(null);
  const [feedback, setFeedback] = useState("");
  const [isDraftLoaded, setIsDraftLoaded] = useState(false);
  const [hasDraftInputChanged, setHasDraftInputChanged] = useState(false);
  const galleryInputRef = useRef(null);
  const cameraInputRef = useRef(null);

  const createCurrentDraft = () => createMobileDraft({
    ...(latestDraftRef.current ?? {}),
    type: MOBILE_DRAFT_TYPES.RECEIPT_BATCH_CONFIRM,
    entityType: MOBILE_DRAFT_ENTITY_TYPES.receiptBatch,
    entityId: draftEntityId,
    sourceScreen: DRAFT_SOURCE_SCREEN,
    payload: {
      actualQuantity,
      checks,
      result,
      selectedReasons,
      comment,
    },
    context: {
      ...((latestDraftRef.current?.context) ?? {}),
      receiptBatchId: data.id,
      itemCode: data.itemCode,
    },
  });

  useEffect(() => {
    let isCancelled = false;

    latestDraftRef.current = null;
    setIsDraftLoaded(false);
    setHasDraftInputChanged(false);
    setActualQuantity(data.quantity);
    setChecks(defaultChecks());
    setResult("confirmed");
    setSelectedReasons([]);
    setComment("");

    if (!draftEntityId) {
      setIsDraftLoaded(true);
      return () => {
        isCancelled = true;
      };
    }

    findMobileDraftByEntity({
      type: MOBILE_DRAFT_TYPES.RECEIPT_BATCH_CONFIRM,
      entityType: MOBILE_DRAFT_ENTITY_TYPES.receiptBatch,
      entityId: draftEntityId,
      sourceScreen: DRAFT_SOURCE_SCREEN,
    })
      .then((draft) => {
        if (isCancelled) {
          return;
        }

        latestDraftRef.current = draft;
        const payload = draft?.payload ?? {};
        setActualQuantity(payload.actualQuantity ?? data.quantity);
        setChecks(payload.checks && typeof payload.checks === "object" && !Array.isArray(payload.checks) ? payload.checks : defaultChecks());
        setResult(typeof payload.result === "string" ? payload.result : "confirmed");
        setSelectedReasons(Array.isArray(payload.selectedReasons) ? payload.selectedReasons : []);
        setComment(typeof payload.comment === "string" ? payload.comment : "");
        setIsDraftLoaded(true);
      })
      .catch(() => {
        if (isCancelled) {
          return;
        }

        setIsDraftLoaded(true);
      });

    return () => {
      isCancelled = true;
    };
  }, [draftEntityId]);

  useEffect(() => {
    if (!isDraftLoaded || !hasDraftInputChanged || !draftEntityId) {
      return undefined;
    }

    const timeoutId = window.setTimeout(() => {
      saveMobileDraft(createCurrentDraft())
        .then((savedDraft) => {
          latestDraftRef.current = savedDraft;
        })
        .catch(() => {});
    }, DRAFT_AUTOSAVE_DELAY_MS);

    return () => window.clearTimeout(timeoutId);
  }, [actualQuantity, checks, comment, draftEntityId, hasDraftInputChanged, isDraftLoaded, result, selectedReasons]);

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
    setHasDraftInputChanged(true);
  };

  const handleActualQuantityChange = (nextQuantity) => {
    setActualQuantity(nextQuantity);
    setHasDraftInputChanged(true);
  };

  const handleCheckToggle = (checkId) => {
    setChecks((current) => ({ ...current, [checkId]: !current[checkId] }));
    setHasDraftInputChanged(true);
  };

  const handleResultChange = (nextResult) => {
    setResult(nextResult);
    setHasDraftInputChanged(true);
  };

  const handleCommentChange = (nextComment) => {
    setComment(nextComment);
    setHasDraftInputChanged(true);
  };

  const handleConfirmReceipt = () => {
    if (isDraftLoaded && draftEntityId) {
      saveMobileDraft(markMobileDraftReadyToQueue(createCurrentDraft()))
        .then((savedDraft) => {
          latestDraftRef.current = savedDraft;
          setHasDraftInputChanged(false);
        })
        .catch(() => {});
    }

    setFeedback(`${selectedResult.label}: проверка сохранена локально`);
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
                onClick={() => handleActualQuantityChange(Math.max(0, Number(actualQuantity) - 1))}
              >
                <MinusOutlined aria-hidden="true" />
              </button>
              <input
                type="number"
                value={actualQuantity}
                onChange={(event) => handleActualQuantityChange(event.target.value)}
              />
              <button type="button" onClick={() => handleActualQuantityChange(Number(actualQuantity) + 1)}>
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
                  onChange={() => handleCheckToggle(check.id)}
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
                    onClick={() => handleResultChange(option.key)}
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
              onChange={(event) => handleCommentChange(event.target.value)}
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
          onClick={handleConfirmReceipt}
        >
          Подтвердить поступление
        </button>
        <button type="button" onClick={onBack}>Отмена</button>
      </div>

      <MobileBottomNav activeKey={activeNavKey} onSelect={onNavSelect} />
    </div>
  );
}
