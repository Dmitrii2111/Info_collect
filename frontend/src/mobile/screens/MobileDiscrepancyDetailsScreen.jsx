import { useEffect, useRef, useState } from "react";
import {
  ArrowLeftOutlined,
  CameraOutlined,
  CheckCircleOutlined,
  ExportOutlined,
  SyncOutlined,
  WarningOutlined,
} from "@ant-design/icons";
import { MobileBottomNav } from "../components/MobileBottomNav.jsx";
import { MobileBottomSheet } from "../components/MobileBottomSheet.jsx";
import { MobileResultModal } from "../components/MobileResultModal.jsx";
import {
  MOBILE_DRAFT_ENTITY_TYPES,
  MOBILE_DRAFT_TYPES,
  createMobileDraft,
  enqueueMobileDraft,
  findMediaDraftByEntity,
  findMobileDraftByEntity,
  markMobileDraftReadyToQueue,
  saveMobileDraft,
} from "../../services/offline/index.js";

const resolutionOptions = [
  "Оставить открытым",
  "Требует проверки",
  "Передать ответственному",
  "Отметить как решено",
];
const DEFAULT_RESOLUTION = "Требует проверки";
const DRAFT_SOURCE_SCREEN = "discrepancyDetails";
const EQUIPMENT_DRAFT_SOURCE_SCREEN = "equipmentData";
const PHOTO_SLOT = "primary";
const DRAFT_AUTOSAVE_DELAY_MS = 300;

function createPhotoFromMediaDraft(mediaDraft) {
  if (!mediaDraft?.blob) {
    return null;
  }

  return {
    name: mediaDraft.name ?? "Фото оборудования",
    url: URL.createObjectURL(mediaDraft.blob),
    size: mediaDraft.size ?? mediaDraft.blob.size ?? null,
    type: mediaDraft.type ?? mediaDraft.blob.type ?? null,
  };
}

export function MobileDiscrepancyDetailsScreen({
  activeNavKey,
  discrepancy,
  onBack,
  onOpenEquipment,
  onNavSelect,
}) {
  const currentDiscrepancy = discrepancy ?? {
    title: "Расхождение не выбрано",
    itemCode: "Без шифра",
    context: "Контекст не указан",
    severity: "review",
    severityLabel: "Требует проверки",
    status: "Новое",
    type: "Не указано",
    reason: "Описание отсутствует",
    details: [],
    history: [],
  };
  const [resolution, setResolution] = useState(DEFAULT_RESOLUTION);
  const [comment, setComment] = useState("");
  const [feedback, setFeedback] = useState("");
  const [evidencePhoto, setEvidencePhoto] = useState(null);
  const [isPhotoSheetOpen, setIsPhotoSheetOpen] = useState(false);
  const [result, setResult] = useState(null);
  const [isDraftLoaded, setIsDraftLoaded] = useState(false);
  const [hasDraftInputChanged, setHasDraftInputChanged] = useState(false);
  const latestDraftRef = useRef(null);
  const discrepancyId = currentDiscrepancy.id ?? null;
  const itemCode = currentDiscrepancy.itemCode ?? null;
  const draftEntityId = discrepancy ? (discrepancyId ?? itemCode) : null;

  const createCurrentDraft = () => createMobileDraft({
    ...(latestDraftRef.current ?? {}),
    type: MOBILE_DRAFT_TYPES.DISCREPANCY_RESOLUTION,
    entityType: MOBILE_DRAFT_ENTITY_TYPES.discrepancy,
    entityId: draftEntityId,
    sourceScreen: DRAFT_SOURCE_SCREEN,
    payload: {
      resolution,
      comment,
      sourceDiscrepancyId: discrepancyId,
      sourceDraftId: currentDiscrepancy.sourceDraftId ?? currentDiscrepancy.draftId ?? null,
      equipmentId: currentDiscrepancy.equipmentId ?? currentDiscrepancy.entityId ?? null,
      roomId: currentDiscrepancy.roomId ?? null,
      departmentId: currentDiscrepancy.departmentId ?? null,
      positionCode: currentDiscrepancy.positionCode ?? currentDiscrepancy.itemCode ?? null,
      designPositionCode: currentDiscrepancy.designPositionCode ?? currentDiscrepancy.itemCode ?? null,
    },
    context: {
      ...((latestDraftRef.current?.context) ?? {}),
      discrepancyId,
      itemCode,
      sourceDraftId: currentDiscrepancy.sourceDraftId ?? currentDiscrepancy.draftId ?? null,
      equipmentId: currentDiscrepancy.equipmentId ?? currentDiscrepancy.entityId ?? null,
      roomId: currentDiscrepancy.roomId ?? null,
      departmentId: currentDiscrepancy.departmentId ?? null,
    },
  });

  useEffect(() => {
    let isCancelled = false;

    latestDraftRef.current = null;
    setIsDraftLoaded(false);
    setHasDraftInputChanged(false);
    setResolution(DEFAULT_RESOLUTION);
    setComment("");

    if (!draftEntityId) {
      setIsDraftLoaded(true);
      return () => {
        isCancelled = true;
      };
    }

    findMobileDraftByEntity({
      type: MOBILE_DRAFT_TYPES.DISCREPANCY_RESOLUTION,
      entityType: MOBILE_DRAFT_ENTITY_TYPES.discrepancy,
      entityId: draftEntityId,
      sourceScreen: DRAFT_SOURCE_SCREEN,
    })
      .then((draft) => {
        if (isCancelled) {
          return;
        }

        latestDraftRef.current = draft;
        setResolution(typeof draft?.payload?.resolution === "string" ? draft.payload.resolution : DEFAULT_RESOLUTION);
        setComment(typeof draft?.payload?.comment === "string" ? draft.payload.comment : "");
        setIsDraftLoaded(true);
      })
      .catch(() => {
        if (isCancelled) {
          return;
        }

        setResolution(DEFAULT_RESOLUTION);
        setComment("");
        setIsDraftLoaded(true);
      });

    return () => {
      isCancelled = true;
    };
  }, [draftEntityId]);

  useEffect(() => {
    let isCancelled = false;
    const equipmentId = currentDiscrepancy.equipmentId ?? currentDiscrepancy.entityId ?? null;

    setEvidencePhoto(null);

    if (!equipmentId && !currentDiscrepancy.photoName) {
      return () => {
        isCancelled = true;
      };
    }

    findMediaDraftByEntity({
      entityType: MOBILE_DRAFT_ENTITY_TYPES.equipment,
      entityId: equipmentId,
      sourceScreen: EQUIPMENT_DRAFT_SOURCE_SCREEN,
      slot: PHOTO_SLOT,
    })
      .then((mediaDraft) => {
        if (isCancelled) {
          return;
        }

        setEvidencePhoto(createPhotoFromMediaDraft(mediaDraft) ?? (
          currentDiscrepancy.photoName
            ? {
                name: currentDiscrepancy.photoName,
                url: null,
                size: currentDiscrepancy.photoSize ?? null,
                type: currentDiscrepancy.photoType ?? null,
              }
            : null
        ));
      })
      .catch(() => {
        if (!isCancelled && currentDiscrepancy.photoName) {
          setEvidencePhoto({
            name: currentDiscrepancy.photoName,
            url: null,
            size: currentDiscrepancy.photoSize ?? null,
            type: currentDiscrepancy.photoType ?? null,
          });
        }
      });

    return () => {
      isCancelled = true;
    };
  }, [
    currentDiscrepancy.entityId,
    currentDiscrepancy.equipmentId,
    currentDiscrepancy.photoName,
    currentDiscrepancy.photoSize,
    currentDiscrepancy.photoType,
  ]);

  useEffect(() => () => {
    if (evidencePhoto?.url) {
      URL.revokeObjectURL(evidencePhoto.url);
    }
  }, [evidencePhoto]);

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
  }, [comment, draftEntityId, hasDraftInputChanged, isDraftLoaded, resolution]);

  const handleResolutionChange = (nextResolution) => {
    setResolution(nextResolution);
    setHasDraftInputChanged(true);
  };

  const handleCommentChange = (nextComment) => {
    setComment(nextComment);
    setHasDraftInputChanged(true);
  };

  const handleSaveResolution = () => {
    setFeedback("");
    if (!draftEntityId) {
      setResult({
        status: "error",
        title: "Решение не сохранено",
        text: "Расхождение не выбрано. Вернитесь к списку и откройте карточку заново.",
      });
      return;
    }

    saveMobileDraft(markMobileDraftReadyToQueue(createCurrentDraft()))
      .then((savedDraft) => {
        latestDraftRef.current = savedDraft;
        setHasDraftInputChanged(false);
        enqueueMobileDraft(savedDraft)
          .then((result) => {
            if (result?.draft) {
              latestDraftRef.current = result.draft;
            }
          })
          .catch(() => {});
        setResult({
          status: "success",
          title: "Решение сохранено",
          text: "Решение по расхождению добавлено в очередь синхронизации.",
        });
      })
      .catch(() => {
        setResult({
          status: "error",
          title: "Решение не сохранено",
          text: "Не удалось сохранить локальный черновик. Попробуйте ещё раз.",
        });
      });
  };

  const handleOpenEquipment = () => {
    const didOpen = onOpenEquipment?.(currentDiscrepancy);

    if (!didOpen) {
      setFeedback("Оборудование не найдено в текущем локальном обходе");
    }
  };

  return (
    <div className="mobile-discrepancy-details-screen">
      <header className="mobile-discrepancy-details-header">
        <button type="button" aria-label="Назад" onClick={onBack}>
          <ArrowLeftOutlined aria-hidden="true" />
        </button>
        <h1>Детали расхождения</h1>
        <button
          type="button"
          aria-label="Синхронизация"
          onClick={() => setFeedback("Откройте экран синхронизации для отправки изменений")}
        >
          <SyncOutlined aria-hidden="true" />
        </button>
      </header>

      <main className="mobile-discrepancy-details-content">
        <section className="mobile-discrepancy-context">
          <strong>{currentDiscrepancy.context}</strong>
          <span>{currentDiscrepancy.locationLine ?? "Локальный обход"}</span>
        </section>

        <section className="mobile-card mobile-discrepancy-detail-summary">
          <div>
            <h2>{currentDiscrepancy.title}</h2>
            <p>ПОЗ: {currentDiscrepancy.itemCode} • Тип: {currentDiscrepancy.type}</p>
          </div>
          <div className="mobile-discrepancy-detail-tags">
            <span className={`is-${currentDiscrepancy.severity}`}>{currentDiscrepancy.severityLabel}</span>
            <span>{currentDiscrepancy.status}</span>
            <span>{currentDiscrepancy.syncState ?? "Локально"}</span>
          </div>
          <div className="mobile-discrepancy-detail-problem">
            <WarningOutlined aria-hidden="true" />
            <div>
              <h3>{currentDiscrepancy.reason}</h3>
              <p>{currentDiscrepancy.comment ?? "Требуется уточнение и подтверждение на месте"}</p>
            </div>
          </div>
          <div className="mobile-discrepancy-detail-grid">
            {(currentDiscrepancy.details ?? []).map((detail) => (
              <div key={detail.label}>
                <span>{detail.label}</span>
                <strong>{detail.value}</strong>
              </div>
            ))}
          </div>
          <div className="mobile-discrepancy-detail-history">
            <h3>История</h3>
            {(currentDiscrepancy.history ?? []).map((event) => (
              <p key={`${event.time}-${event.text}`}>
                <span>{event.time}</span>
                {event.text}
              </p>
            ))}
          </div>
        </section>

        <section className="mobile-card mobile-discrepancy-detail-block">
          <h3>Фотофиксация</h3>
          {evidencePhoto ? (
            <div className="mobile-discrepancy-evidence-photo">
              {evidencePhoto.url ? <img src={evidencePhoto.url} alt="Фото расхождения" /> : null}
              <span>{evidencePhoto.name}</span>
            </div>
          ) : (
            <button type="button" onClick={() => setIsPhotoSheetOpen(true)}>
              <CameraOutlined aria-hidden="true" />
              Добавить фото
            </button>
          )}
        </section>

        <section className="mobile-card mobile-discrepancy-detail-block">
          <h3>Решение</h3>
          <div className="mobile-discrepancy-resolution-list">
            {resolutionOptions.map((option) => (
              <label className={option === resolution ? "is-active" : ""} key={option}>
                <input
                  type="radio"
                  name="discrepancy-resolution"
                  checked={option === resolution}
                  onChange={() => handleResolutionChange(option)}
                />
                <span>{option}</span>
              </label>
            ))}
          </div>
          <textarea
            placeholder="Комментарий к решению..."
            rows={3}
            value={comment}
            onChange={(event) => handleCommentChange(event.target.value)}
          />
        </section>

        {feedback ? <div className="mobile-discrepancy-detail-feedback">{feedback}</div> : null}
      </main>

      <div className="mobile-discrepancy-detail-action-bar">
        <span>
          <CheckCircleOutlined aria-hidden="true" />
          1 изменение ожидает отправки
        </span>
        <button
          type="button"
          onClick={handleSaveResolution}
          disabled={!draftEntityId}
        >
          Сохранить решение
        </button>
        <button type="button" onClick={handleOpenEquipment}>
          <ExportOutlined aria-hidden="true" />
          Открыть оборудование
        </button>
      </div>

      <MobileBottomNav activeKey={activeNavKey} onSelect={onNavSelect} />

      {isPhotoSheetOpen ? (
        <MobileBottomSheet
          title="Фотофиксация"
          subtitle={currentDiscrepancy.title}
          mode="sheet"
          onClose={() => setIsPhotoSheetOpen(false)}
          footer={({ close }) => (
            <button className="mobile-primary-button" type="button" onClick={() => close(() => setIsPhotoSheetOpen(false))}>
              Закрыть
            </button>
          )}
        >
          <div className="mobile-discrepancy-photo-sheet">
            <CameraOutlined aria-hidden="true" />
            <p>Фото будет прикреплено к расхождению и отправлено вместе с решением.</p>
          </div>
        </MobileBottomSheet>
      ) : null}

      <MobileResultModal
        isOpen={Boolean(result)}
        status={result?.status}
        title={result?.title}
        text={result?.text}
        onClose={() => setResult(null)}
      />
    </div>
  );
}
