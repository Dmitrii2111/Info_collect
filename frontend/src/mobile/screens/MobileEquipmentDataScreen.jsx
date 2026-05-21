import {
  ArrowLeftOutlined,
  CameraOutlined,
  CheckOutlined,
  MinusOutlined,
  MoreOutlined,
  PlusOutlined,
  SyncOutlined,
  WarningOutlined,
} from "@ant-design/icons";
import { useEffect, useRef, useState } from "react";
import { MobileBottomNav } from "../components/MobileBottomNav.jsx";
import { MobileConfirmModal } from "../components/MobileConfirmModal.jsx";
import {
  MOBILE_DRAFT_ENTITY_TYPES,
  MOBILE_DRAFT_TYPES,
  createMobileDraft,
  findMobileDraftByEntity,
  markMobileDraftReadyToQueue,
  saveMobileDraft,
} from "../../services/offline/index.js";

const DRAFT_SOURCE_SCREEN = "equipmentData";
const DRAFT_AUTOSAVE_DELAY_MS = 300;

const reasonOptions = [
  "Отсутствует маркировка",
  "Неверный серийный номер",
  "Повреждено",
  "Не соответствует плану",
];

const statusOptions = [
  { key: "found", label: "Подтверждено", tone: "success" },
  { key: "notFound", label: "Не найдено", tone: "warning" },
  { key: "issue", label: "Расхождение", tone: "danger" },
];
const commissioningOptions = ["Выполнены", "Не выполнены", "Не требуется"];
const trainingOptions = ["Проведено", "Не проведено", "Не требуется"];

function getStatusByKey(statusKey) {
  return statusOptions.find((status) => status.key === statusKey) ?? statusOptions[1];
}

export function MobileEquipmentDataScreen({
  activeNavKey,
  department,
  equipment,
  room,
  onBack,
  onFinishRoom,
  onOpenNextEquipment,
  onNavSelect,
}) {
  const currentEquipment = equipment ?? {
    id: "Нет ID",
    title: "Позиция не выбрана",
    status: "Не найдено",
    tone: "empty",
    note: "Данные отсутствуют",
  };
  const defaultSelectedReasons = () => (currentEquipment.tone === "error" ? [reasonOptions[0]] : []);
  const draftEntityId = currentEquipment.id;
  const latestDraftRef = useRef(null);
  const [statusKey, setStatusKey] = useState("notFound");
  const [preferredStatusKey, setPreferredStatusKey] = useState("notFound");
  const [serialNumber, setSerialNumber] = useState(currentEquipment.serial ?? "");
  const [actualCount, setActualCount] = useState(currentEquipment.actualCount ?? 1);
  const [selectedReasons, setSelectedReasons] = useState(defaultSelectedReasons);
  const [comment, setComment] = useState(currentEquipment.note ?? "");
  const [commissioningStatus, setCommissioningStatus] = useState("Не выполнены");
  const [commissioningDate, setCommissioningDate] = useState("");
  const [trainingStatus, setTrainingStatus] = useState("Не проведено");
  const [trainingDate, setTrainingDate] = useState("");
  const [photo, setPhoto] = useState(null);
  const [photoMenuOpen, setPhotoMenuOpen] = useState(false);
  const [feedback, setFeedback] = useState("");
  const [isSaveConfirmOpen, setIsSaveConfirmOpen] = useState(false);
  const [isFinishConfirmOpen, setIsFinishConfirmOpen] = useState(false);
  const galleryInputRef = useRef(null);
  const cameraInputRef = useRef(null);
  const [isDraftLoaded, setIsDraftLoaded] = useState(false);
  const [hasDraftInputChanged, setHasDraftInputChanged] = useState(false);
  const selectedStatus = getStatusByKey(statusKey);

  const createCurrentDraft = () => createMobileDraft({
    ...(latestDraftRef.current ?? {}),
    type: MOBILE_DRAFT_TYPES.EQUIPMENT_DATA,
    entityType: MOBILE_DRAFT_ENTITY_TYPES.equipment,
    entityId: draftEntityId,
    sourceScreen: DRAFT_SOURCE_SCREEN,
    payload: {
      statusKey,
      preferredStatusKey,
      serialNumber,
      actualCount,
      selectedReasons,
      comment,
      commissioningStatus,
      commissioningDate,
      trainingStatus,
      trainingDate,
    },
    context: {
      ...((latestDraftRef.current?.context) ?? {}),
      equipmentId: currentEquipment.id,
      roomId: room?.id ?? null,
      departmentId: department?.id ?? null,
    },
  });

  useEffect(() => {
    let isCancelled = false;

    latestDraftRef.current = null;
    setIsDraftLoaded(false);
    setHasDraftInputChanged(false);
    setStatusKey("notFound");
    setPreferredStatusKey("notFound");
    setSerialNumber(currentEquipment.serial ?? "");
    setActualCount(currentEquipment.actualCount ?? 1);
    setSelectedReasons(defaultSelectedReasons());
    setComment(currentEquipment.note ?? "");
    setCommissioningStatus("Не выполнены");
    setCommissioningDate("");
    setTrainingStatus("Не проведено");
    setTrainingDate("");
    setFeedback("");

    if (!draftEntityId) {
      setIsDraftLoaded(true);
      return () => {
        isCancelled = true;
      };
    }

    findMobileDraftByEntity({
      type: MOBILE_DRAFT_TYPES.EQUIPMENT_DATA,
      entityType: MOBILE_DRAFT_ENTITY_TYPES.equipment,
      entityId: draftEntityId,
      sourceScreen: DRAFT_SOURCE_SCREEN,
    })
      .then((draft) => {
        if (isCancelled) {
          return;
        }

        latestDraftRef.current = draft;
        const payload = draft?.payload ?? {};

        setStatusKey(typeof payload.statusKey === "string" ? payload.statusKey : "notFound");
        setPreferredStatusKey(typeof payload.preferredStatusKey === "string" ? payload.preferredStatusKey : "notFound");
        setSerialNumber(typeof payload.serialNumber === "string" ? payload.serialNumber : currentEquipment.serial ?? "");
        setActualCount(payload.actualCount ?? currentEquipment.actualCount ?? 1);
        setSelectedReasons(Array.isArray(payload.selectedReasons) ? payload.selectedReasons : defaultSelectedReasons());
        setComment(typeof payload.comment === "string" ? payload.comment : currentEquipment.note ?? "");
        setCommissioningStatus(typeof payload.commissioningStatus === "string" ? payload.commissioningStatus : "Не выполнены");
        setCommissioningDate(typeof payload.commissioningDate === "string" ? payload.commissioningDate : "");
        setTrainingStatus(typeof payload.trainingStatus === "string" ? payload.trainingStatus : "Не проведено");
        setTrainingDate(typeof payload.trainingDate === "string" ? payload.trainingDate : "");
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
  }, [
    actualCount,
    comment,
    commissioningDate,
    commissioningStatus,
    draftEntityId,
    hasDraftInputChanged,
    isDraftLoaded,
    preferredStatusKey,
    selectedReasons,
    serialNumber,
    statusKey,
    trainingDate,
    trainingStatus,
  ]);

  useEffect(() => {
    return () => {
      if (photo?.url) {
        URL.revokeObjectURL(photo.url);
      }
    };
  }, [photo]);

  const handleStatusSelect = (nextStatusKey) => {
    setStatusKey(nextStatusKey);
    if (nextStatusKey !== "issue") {
      setPreferredStatusKey(nextStatusKey);
    }
    setHasDraftInputChanged(true);
    setFeedback("");
  };

  const handleReasonToggle = (reason) => {
    setSelectedReasons((currentReasons) => {
      const nextReasons = currentReasons.includes(reason)
        ? currentReasons.filter((item) => item !== reason)
        : [...currentReasons, reason];

      setStatusKey(nextReasons.length > 0 ? "issue" : preferredStatusKey || "found");

      return nextReasons;
    });
    setHasDraftInputChanged(true);
    setFeedback("");
  };

  const handleSerialNumberChange = (nextSerialNumber) => {
    setSerialNumber(nextSerialNumber);
    setHasDraftInputChanged(true);
  };

  const handleActualCountChange = (nextActualCount) => {
    setActualCount(nextActualCount);
    setHasDraftInputChanged(true);
  };

  const handleCommissioningStatusChange = (nextStatus) => {
    setCommissioningStatus(nextStatus);
    if (nextStatus !== "Выполнены") {
      setCommissioningDate("");
    }
    setHasDraftInputChanged(true);
  };

  const handleCommissioningDateChange = (nextDate) => {
    setCommissioningDate(nextDate);
    setHasDraftInputChanged(true);
  };

  const handleTrainingStatusChange = (nextStatus) => {
    setTrainingStatus(nextStatus);
    if (nextStatus !== "Проведено") {
      setTrainingDate("");
    }
    setHasDraftInputChanged(true);
  };

  const handleTrainingDateChange = (nextDate) => {
    setTrainingDate(nextDate);
    setHasDraftInputChanged(true);
  };

  const handleCommentChange = (nextComment) => {
    setComment(nextComment);
    setHasDraftInputChanged(true);
  };

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
    setFeedback("Фото добавлено");
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

  const handleSave = (message, options = {}) => {
    setFeedback(message);
    if (options.goBack) {
      onBack();
    }
  };

  const handleSaveAndNext = () => {
    if (isDraftLoaded && draftEntityId) {
      saveMobileDraft(markMobileDraftReadyToQueue(createCurrentDraft()))
        .then((savedDraft) => {
          latestDraftRef.current = savedDraft;
          setHasDraftInputChanged(false);
        })
        .catch(() => {});
    }

    setFeedback("Изменения добавлены в очередь синхронизации");
    const hasNext = onOpenNextEquipment?.();

    if (!hasNext) {
      setIsFinishConfirmOpen(true);
      return;
    }

    if (typeof window !== "undefined") {
      window.setTimeout(() => window.scrollTo({ top: 0, behavior: "smooth" }), 0);
    }
  };

  return (
    <div className="mobile-equipment-data-screen">
      <header className="mobile-equipment-data-header">
        <button type="button" aria-label="Назад к осмотру помещения" onClick={onBack}>
          <ArrowLeftOutlined aria-hidden="true" />
        </button>
        <h1>Осмотр оборудования</h1>
        <button
          type="button"
          aria-label="Дополнительно"
          onClick={() => handleSave("Проверьте статус, комментарий и фото перед сохранением")}
        >
          <MoreOutlined aria-hidden="true" />
        </button>
      </header>

      <main className="mobile-equipment-data-content">
        <section className="mobile-equipment-context">
          <span>{room?.title ?? "Помещение не выбрано"}</span>
          <p>{department?.context}</p>
        </section>

        <section className={`mobile-card mobile-equipment-info-card is-${selectedStatus.tone}`}>
          <div>
            <h2>{currentEquipment.title}</h2>
            <em>
              {selectedStatus.tone === "danger" ? <WarningOutlined aria-hidden="true" /> : null}
              {selectedStatus.label}
            </em>
          </div>
          <p>
            <span>
              ID: <strong>{currentEquipment.id}</strong>
            </span>
            <span>
              Тип: <strong>{currentEquipment.type ?? "Встроенный"}</strong>
            </span>
            <span>
              План: <strong>{currentEquipment.planned ?? "1 шт."}</strong>
            </span>
          </p>
        </section>

        <section className="mobile-card mobile-equipment-form-block">
          <h3>Статус</h3>
          <div className="mobile-equipment-segmented">
            {statusOptions.map((status) => (
              <button
                className={status.key === statusKey ? `is-active is-${status.tone}` : ""}
                type="button"
                key={status.key}
                onClick={() => handleStatusSelect(status.key)}
              >
                {status.label}
              </button>
            ))}
          </div>
        </section>

        <section className="mobile-card mobile-equipment-form-block">
          <h3>Детали</h3>
          <label className="mobile-equipment-field">
            <span>Серийный номер</span>
            <input
              placeholder="Введите серийный номер"
              value={serialNumber}
              onChange={(event) => handleSerialNumberChange(event.target.value)}
            />
          </label>
          <label className="mobile-equipment-field">
            <span>Количество по факту</span>
            <div className="mobile-equipment-counter">
              <button type="button" onClick={() => handleActualCountChange(Math.max(0, Number(actualCount) - 1))}>
                <MinusOutlined aria-hidden="true" />
              </button>
              <input
                type="number"
                value={actualCount}
                onChange={(event) => handleActualCountChange(event.target.value)}
              />
              <button type="button" onClick={() => handleActualCountChange(Number(actualCount) + 1)}>
                <PlusOutlined aria-hidden="true" />
              </button>
            </div>
          </label>
          <div className="mobile-equipment-select-group">
            <span>ПНР</span>
            <div>
              {commissioningOptions.map((option) => (
                <button
                  className={commissioningStatus === option ? "is-active" : ""}
                  type="button"
                  key={option}
                  onClick={() => handleCommissioningStatusChange(option)}
                >
                  {option}
                </button>
              ))}
            </div>
          </div>
          {commissioningStatus === "Выполнены" ? (
            <label className="mobile-equipment-field">
              <span>Дата выполнения ПНР</span>
              <input
                type="date"
                value={commissioningDate}
                onChange={(event) => handleCommissioningDateChange(event.target.value)}
              />
            </label>
          ) : null}
          <div className="mobile-equipment-select-group">
            <span>Обучение</span>
            <div>
              {trainingOptions.map((option) => (
                <button
                  className={trainingStatus === option ? "is-active" : ""}
                  type="button"
                  key={option}
                  onClick={() => handleTrainingStatusChange(option)}
                >
                  {option}
                </button>
              ))}
            </div>
          </div>
          {trainingStatus === "Проведено" ? (
            <label className="mobile-equipment-field">
              <span>Дата проведения обучения</span>
              <input
                type="date"
                value={trainingDate}
                onChange={(event) => handleTrainingDateChange(event.target.value)}
              />
            </label>
          ) : null}
          <div className="mobile-equipment-reasons">
            <p>
              <WarningOutlined aria-hidden="true" />
              Расхождение (требуется указать причину)
            </p>
            <div>
              {reasonOptions.map((reason, index) => (
                <button
                  className={selectedReasons.includes(reason) ? "is-active" : ""}
                  type="button"
                  key={reason}
                  onClick={() => handleReasonToggle(reason)}
                >
                  {selectedReasons.includes(reason) ? <CheckOutlined aria-hidden="true" /> : null}
                  {reason}
                </button>
              ))}
            </div>
          </div>
          <label className="mobile-equipment-field">
            <span>Комментарий</span>
            <textarea
              placeholder="Добавьте пояснение..."
              value={comment}
              rows={3}
              onChange={(event) => handleCommentChange(event.target.value)}
            />
          </label>
          <div className="mobile-equipment-photo">
            <div>
              <span>Фотофиксация</span>
              <small>{photo ? "1/5" : "0/5"}</small>
            </div>
            {photo ? (
              <div className="mobile-equipment-photo-preview">
                <img src={photo.url} alt="Выбранное фото оборудования" />
                <span>{photo.name}</span>
                <button type="button" onClick={handleRemovePhoto}>
                  Удалить фото
                </button>
              </div>
            ) : null}
            <button type="button" onClick={() => setPhotoMenuOpen((isOpen) => !isOpen)}>
              <CameraOutlined aria-hidden="true" />
              {photo ? "Заменить фото" : "Добавить фото"}
            </button>
            {photoMenuOpen ? (
              <div className="mobile-equipment-photo-actions">
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
              className="mobile-equipment-file-input"
              type="file"
              accept="image/*"
              onChange={handlePhotoChange}
            />
            <input
              ref={cameraInputRef}
              className="mobile-equipment-file-input"
              type="file"
              accept="image/*"
              capture="environment"
              onChange={handlePhotoChange}
            />
          </div>
        </section>

        <section className="mobile-equipment-sync">
          <SyncOutlined aria-hidden="true" />
          <span>Онлайн • 2 изменения не отправлены</span>
          <button type="button" onClick={() => handleSave("Откройте экран синхронизации для отправки изменений")}>
            <SyncOutlined aria-hidden="true" />
          </button>
        </section>
        {feedback ? <div className="mobile-equipment-feedback">{feedback}</div> : null}
      </main>

      <div className="mobile-equipment-action-bar">
        <div>
          <button type="button" onClick={onBack}>
            Отмена
          </button>
          <button type="button" onClick={() => setIsSaveConfirmOpen(true)}>
            Сохранить
          </button>
        </div>
      </div>

      <MobileBottomNav activeKey={activeNavKey} onSelect={onNavSelect} />
      <MobileConfirmModal
        isOpen={isSaveConfirmOpen}
        title="Вы уверены?"
        text="Сохранить результат проверки и перейти к следующей позиции?"
        confirmLabel="Сохранить и к следующему"
        cancelLabel="Отмена"
        onCancel={() => setIsSaveConfirmOpen(false)}
        onConfirm={() => {
          setIsSaveConfirmOpen(false);
          handleSaveAndNext();
        }}
      />
      <MobileConfirmModal
        isOpen={isFinishConfirmOpen}
        title="Все оборудование проверено"
        text="Все оборудование проверено. Закончить помещение?"
        confirmLabel="Закончить помещение"
        cancelLabel="Остаться"
        onCancel={() => setIsFinishConfirmOpen(false)}
        onConfirm={() => {
          setIsFinishConfirmOpen(false);
          onFinishRoom?.();
        }}
      />
    </div>
  );
}
