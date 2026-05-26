import { useEffect, useRef, useState } from "react";
import {
  ArrowLeftOutlined,
  CameraOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  InboxOutlined,
  SyncOutlined,
} from "@ant-design/icons";
import { MobileBottomNav } from "../components/MobileBottomNav.jsx";
import { MobileBottomSheet } from "../components/MobileBottomSheet.jsx";
import { mobileReceiptFixtureBatches } from "../data/mobileReceiptFixtureData.js";
import { addReceiptItemsToWarehouse, listActiveLocalWarehouses } from "../../domain/warehouse/localWarehouseRepository.js";
import { saveLocalReceiptState } from "../../domain/receipts/localReceiptRepository.js";
import {
  MOBILE_DRAFT_ENTITY_TYPES,
  MOBILE_DRAFT_TYPES,
  createMobileDraft,
  enqueueMobileDraft,
  findMobileDraftByEntity,
  markMobileDraftReadyToQueue,
  saveMobileDraft,
} from "../../services/offline/index.js";
import { MobileResultModal } from "../components/MobileResultModal.jsx";

const resultOptions = [
  { key: "confirmed", label: "Подтвердить", tone: "success", icon: CheckCircleOutlined },
  { key: "rejected", label: "Отклонить", tone: "danger", icon: CloseCircleOutlined },
];
const DRAFT_SOURCE_SCREEN = "receiptBatchConfirm";
const DRAFT_AUTOSAVE_DELAY_MS = 300;

export function MobileReceiptBatchConfirmScreen({
  activeNavKey,
  batch,
  onBack,
  onCompleteReceiptBatch,
  onNavSelect,
  operatorName = "Оператор",
  onReceiptStateChanged,
  onSaveReceiptBatchDraft,
}) {
  const data = batch ?? mobileReceiptFixtureBatches[0];
  const getPositionLineId = (position) => position.lineId ?? position.id;
  const defaultLineChecks = () => Object.fromEntries((data.positions ?? []).map((position) => [getPositionLineId(position), false]));
  const defaultLineActualQuantities = () => Object.fromEntries((data.positions ?? []).map((position) => [getPositionLineId(position), Number(position.quantity ?? 0) || 0]));
  const draftEntityId = data.id;
  const latestDraftRef = useRef(null);
  const [lineChecks, setLineChecks] = useState(defaultLineChecks);
  const [lineActualQuantities, setLineActualQuantities] = useState(defaultLineActualQuantities);
  const [result, setResult] = useState("confirmed");
  const [selectedReasons, setSelectedReasons] = useState([]);
  const [comment, setComment] = useState("");
  const [photoMenuOpen, setPhotoMenuOpen] = useState(false);
  const [photo, setPhoto] = useState(null);
  const [feedback, setFeedback] = useState("");
  const [resultModal, setResultModal] = useState(null);
  const [destinationWarehouses, setDestinationWarehouses] = useState([]);
  const [isDestinationSheetOpen, setIsDestinationSheetOpen] = useState(false);
  const [isDraftLoaded, setIsDraftLoaded] = useState(false);
  const [hasDraftInputChanged, setHasDraftInputChanged] = useState(false);
  const galleryInputRef = useRef(null);
  const cameraInputRef = useRef(null);
  const receiptPositions = data.positions ?? [];
  const totalDocumentQuantity = receiptPositions.reduce((sum, position) => sum + (Number(position.quantity ?? 0) || 0), 0);
  const rawLineReviewItems = receiptPositions.map((position) => {
    const lineId = getPositionLineId(position);
    const documentQuantity = Number(position.quantity ?? 0) || 0;
    const actualQuantity = Number(lineActualQuantities[lineId] ?? documentQuantity) || 0;
    const checked = Boolean(lineChecks[lineId]);

    return {
      lineId,
      positionCode: position.positionCode ?? position.designPositionCode ?? null,
      designPositionCode: position.designPositionCode ?? position.positionCode ?? null,
      name: position.name ?? position.title ?? "Позиция поступления",
      supplier: position.supplier ?? data.supplier ?? null,
      documentQuantity,
      actualQuantity,
      unit: position.unit ?? data.unit ?? "шт.",
      checked,
      hasQuantityMismatch: checked && actualQuantity !== documentQuantity,
    };
  });
  const lineReviewItems = rawLineReviewItems.map((item) => {
    const actualQuantity = item.checked ? item.actualQuantity : 0;
    const uncheckedReason = item.checked ? null : "Позиция не отмечена оператором";
    const hasQuantityMismatch = actualQuantity !== item.documentQuantity;
    const discrepancyReasons = uncheckedReason ? [uncheckedReason] : [];

    return {
      ...item,
      actualQuantity,
      hasQuantityMismatch,
      hasDiscrepancy: !item.checked || hasQuantityMismatch,
      discrepancyReasons,
      discrepancyComment: uncheckedReason ?? "",
    };
  });
  const totalActualQuantity = lineReviewItems.reduce((sum, item) => sum + (item.checked ? item.actualQuantity : 0), 0);
  const hasQuantityMismatch = lineReviewItems.some((item) => item.hasQuantityMismatch);
  const checkedLineItems = lineReviewItems.filter((item) => item.checked);
  const mismatchLines = lineReviewItems.filter((item) => item.hasQuantityMismatch);

  const createCurrentDraft = ({
    receiptOutcome = null,
    destinationWarehouse = null,
    confirmedAt = null,
  } = {}) => createMobileDraft({
    ...(latestDraftRef.current ?? {}),
    type: MOBILE_DRAFT_TYPES.RECEIPT_BATCH_CONFIRM,
    entityType: MOBILE_DRAFT_ENTITY_TYPES.receiptBatch,
    entityId: draftEntityId,
    sourceScreen: DRAFT_SOURCE_SCREEN,
    payload: {
      actualQuantity: totalActualQuantity,
      lineChecks,
      lineActualQuantities,
      lineReviewItems,
      mismatchLines,
      totalDocumentQuantity,
      totalActualQuantity,
      result: receiptOutcome ?? result,
      selectedReasons,
      comment,
      photo: photo ? { name: photo.name } : null,
      receiptOutcome,
      destinationWarehouseId: destinationWarehouse?.id ?? null,
      destinationWarehouseName: destinationWarehouse?.roomName ?? null,
      destinationWarehouseRoomCode: destinationWarehouse?.roomCode ?? null,
      positions: data.positions ?? [],
      operatorName,
      confirmedAt,
    },
    context: {
      ...((latestDraftRef.current?.context) ?? {}),
      receiptBatchId: data.id,
      itemCode: data.itemCode,
      batchNumber: data.batchNumber ?? data.number ?? data.displayNumber,
      receiptOutcome,
      destinationWarehouseId: destinationWarehouse?.id ?? null,
      destinationWarehouseName: destinationWarehouse?.roomName ?? null,
      destinationWarehouseRoomCode: destinationWarehouse?.roomCode ?? null,
      positionsCount: data.positionsCount ?? data.positions?.length ?? 0,
      totalQuantity: data.totalQuantity ?? data.quantity,
      totalDocumentQuantity,
      totalActualQuantity,
      mismatchCount: mismatchLines.length,
      operatorName,
      confirmedAt,
    },
  });

  useEffect(() => {
    let isCancelled = false;

    latestDraftRef.current = null;
    setIsDraftLoaded(false);
    setHasDraftInputChanged(false);
    setLineChecks(defaultLineChecks());
    setLineActualQuantities(defaultLineActualQuantities());
    setResult("confirmed");
    setSelectedReasons([]);
    setComment("");
    setPhoto(null);
    setFeedback("");
    setIsDestinationSheetOpen(false);

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
        setLineChecks(payload.lineChecks && typeof payload.lineChecks === "object" && !Array.isArray(payload.lineChecks) ? payload.lineChecks : defaultLineChecks());
        setLineActualQuantities(payload.lineActualQuantities && typeof payload.lineActualQuantities === "object" && !Array.isArray(payload.lineActualQuantities) ? payload.lineActualQuantities : defaultLineActualQuantities());
        setResult(typeof payload.result === "string" ? payload.result : "confirmed");
        setSelectedReasons(Array.isArray(payload.selectedReasons) ? payload.selectedReasons : []);
        setComment(typeof payload.comment === "string" ? payload.comment : "");
        setPhoto(payload.photo?.name ? { name: payload.photo.name, url: null } : null);
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
  }, [comment, draftEntityId, hasDraftInputChanged, isDraftLoaded, lineActualQuantities, lineChecks, result, selectedReasons]);

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

  const handleLineCheckToggle = (lineId) => {
    setLineChecks((current) => ({ ...current, [lineId]: !current[lineId] }));
    setHasDraftInputChanged(true);
  };

  const handleLineActualQuantityChange = (lineId, nextQuantity) => {
    setLineActualQuantities((current) => ({ ...current, [lineId]: Number(nextQuantity) || 0 }));
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

  const hasExplicitNegativeInput = () => (
    result === "rejected" ||
    selectedReasons.length > 0 ||
    hasQuantityMismatch ||
    Number(data.conflictCount ?? 0) > 0
  );
  const isPositiveReceiptReady = () => (
    allReceiptLinesChecked() &&
    !hasQuantityMismatch &&
    selectedReasons.length === 0 &&
    result !== "rejected" &&
    Number(data.conflictCount ?? 0) === 0
  );

  const allReceiptLinesChecked = () => (
    (data.positions ?? []).length > 0 &&
    (data.positions ?? []).every((position) => Boolean(lineChecks[getPositionLineId(position)]))
  );

  const getReceiptStatePatch = (status, destinationWarehouse = null, timestamp = new Date().toISOString()) => {
    return {
      status,
      displayStatus: status === "placed" ? "Размещено" : status === "placed_with_discrepancy" ? "С расхождениями" : status === "conflict" ? "Конфликт" : "В проверке",
      destinationWarehouseId: destinationWarehouse?.id ?? null,
      destinationWarehouseName: destinationWarehouse?.roomName ?? null,
      destinationWarehouseRoomCode: destinationWarehouse?.roomCode ?? null,
      comment,
      reasons: selectedReasons,
      hasPhotos: Boolean(photo),
      lineChecks,
      lineActualQuantities,
      lineReviewItems,
      mismatchLines,
      placedAt: ["placed", "placed_with_discrepancy"].includes(status) ? timestamp : data.localState?.placedAt ?? null,
      conflictedAt: status === "conflict" ? timestamp : data.localState?.conflictedAt ?? null,
      checkedAt: timestamp,
      confirmedAt: timestamp,
      confirmedBy: operatorName,
      operatorName,
      receiptBatchId: data.id,
      batchNumber: data.batchNumber ?? data.number ?? data.displayNumber,
      displayNumber: data.displayNumber ?? data.batchNumber ?? data.number,
      documentName: data.documentName ?? data.document ?? null,
      supplier: data.supplier ?? null,
      positionsCount: data.positionsCount ?? data.positions?.length ?? 0,
      checkedPositionsCount: checkedLineItems.length,
      totalQuantity: data.totalQuantity ?? data.quantity,
      totalDocumentQuantity,
      totalActualQuantity,
      source: data.sourceKey ?? "dispatcher-dev-fixture",
    };
  };

  const getSuccessfulReceiptBatchForStock = () => ({
    ...data,
    positions: lineReviewItems
      .filter((item) => item.checked)
      .map((item) => {
        const sourcePosition = receiptPositions.find((position) => getPositionLineId(position) === item.lineId) ?? {};

        return {
          ...sourcePosition,
          id: item.lineId,
          lineId: item.lineId,
          positionCode: item.positionCode,
          designPositionCode: item.designPositionCode,
          name: item.name,
          title: item.name,
          quantity: item.actualQuantity,
          unit: item.unit,
        };
      }),
  });

  const getReceiptBatchForStock = () => ({
    ...data,
    positions: checkedLineItems.map((item) => {
      const sourcePosition = receiptPositions.find((position) => getPositionLineId(position) === item.lineId) ?? {};
      const lineReasons = Array.isArray(item.discrepancyReasons) ? item.discrepancyReasons.filter(Boolean) : [];
      const itemHasDiscrepancy = Boolean(item.hasDiscrepancy || item.hasQuantityMismatch || lineReasons.length > 0);

      return {
        ...sourcePosition,
        id: item.lineId,
        lineId: item.lineId,
        positionCode: item.positionCode,
        designPositionCode: item.designPositionCode,
        name: item.name,
        title: item.name,
        quantity: item.actualQuantity,
        documentQuantity: item.documentQuantity,
        actualQuantity: item.actualQuantity,
        unit: item.unit,
        hasDiscrepancy: itemHasDiscrepancy,
        receiptResult: "placed_with_discrepancy",
        discrepancyReason: itemHasDiscrepancy
          ? lineReasons.join(", ") || (item.hasQuantityMismatch ? "Расхождение количества" : item.discrepancyReason ?? "")
          : null,
        discrepancyReasons: itemHasDiscrepancy ? lineReasons : [],
        discrepancyComment: itemHasDiscrepancy ? (item.discrepancyComment ?? comment) : "",
      };
    }),
  });

  const handleSaveDraft = () => {
    if (!isDraftLoaded || !draftEntityId) {
      return;
    }

    saveMobileDraft(createCurrentDraft())
      .then((savedDraft) => {
        latestDraftRef.current = savedDraft;
        setHasDraftInputChanged(false);
        return saveLocalReceiptState(draftEntityId, getReceiptStatePatch("inProgress"));
      })
      .then(() => {
        onReceiptStateChanged?.();
        onSaveReceiptBatchDraft?.(draftEntityId, "В проверке");
        setResultModal({
          status: "success",
          title: "Черновик сохранён",
          text: "Данные проверки поступления сохранены локально.",
        });
      })
      .catch(() => {});
  };

  const saveReadyReceipt = ({ nextStatus, receiptOutcome, destinationWarehouse = null }) => {
    if (isDraftLoaded && draftEntityId) {
      const confirmedAt = new Date().toISOString();

      return saveMobileDraft(markMobileDraftReadyToQueue(createCurrentDraft({
        receiptOutcome,
        destinationWarehouse,
        confirmedAt,
      })))
        .then((savedDraft) => {
          latestDraftRef.current = savedDraft;
          setHasDraftInputChanged(false);
          return enqueueMobileDraft(savedDraft)
            .then((result) => {
              if (result?.draft) {
                latestDraftRef.current = result.draft;
              }
              return result;
            })
            .catch(() => null);
        })
        .then(() => (["placed", "placed_with_discrepancy"].includes(receiptOutcome) && destinationWarehouse
          ? addReceiptItemsToWarehouse(destinationWarehouse.id, receiptOutcome === "placed" ? getSuccessfulReceiptBatchForStock() : getReceiptBatchForStock(), {
            stockStatus: receiptOutcome === "placed" ? "in_stock" : "accepted_with_discrepancy",
            hasDiscrepancy: receiptOutcome === "placed_with_discrepancy",
            discrepancyReason: selectedReasons.length > 0 ? selectedReasons.join(", ") : hasQuantityMismatch ? "Расхождение количества" : comment,
            discrepancyReasons: selectedReasons,
            discrepancyComment: comment,
            operatorName,
            identifiedAt: confirmedAt,
          })
          : null))
        .then(() => saveLocalReceiptState(draftEntityId, getReceiptStatePatch(receiptOutcome, destinationWarehouse, confirmedAt)))
        .then(() => {
          onReceiptStateChanged?.();
          onCompleteReceiptBatch?.({ batchId: draftEntityId, status: nextStatus });
        });
    }

    return Promise.resolve();
  };

  const handleConfirmReceipt = () => {
    if (!isDraftLoaded || !draftEntityId) {
      return;
    }

    if (["placed", "placed_with_discrepancy"].includes(data.localState?.status)) {
      setFeedback("Поступление уже размещено");
      return;
    }

    if (!hasExplicitNegativeInput()) {
      if (!allReceiptLinesChecked()) {
        setFeedback("Для успешного подтверждения отметьте все позиции");
        return;
      }

      if (!isPositiveReceiptReady()) {
        setFeedback("Проверьте все позиции поступления");
        return;
      }

      listActiveLocalWarehouses()
        .then((warehouses) => {
          if (!warehouses.length) {
            setFeedback("Нет ни одного склада. Создайте склад перед размещением поступления.");
            return;
          }

          setDestinationWarehouses(warehouses);
          setIsDestinationSheetOpen(true);
        })
        .catch(() => setFeedback("Не удалось загрузить список складов"));
      return;
    }

    if (hasExplicitNegativeInput()) {
      if (checkedLineItems.length > 0) {
        listActiveLocalWarehouses()
          .then((warehouses) => {
            if (!warehouses.length) {
              setFeedback("Нет ни одного склада. Создайте склад перед размещением поступления.");
              return;
            }

            setDestinationWarehouses(warehouses);
            setIsDestinationSheetOpen(true);
          })
          .catch(() => setFeedback("Не удалось загрузить список складов"));
        return;
      }

      saveReadyReceipt({ nextStatus: "Конфликт", receiptOutcome: "conflict" })
        .then(() => setFeedback("Поступление сохранено с замечаниями"))
        .catch(() => setFeedback("Не удалось сохранить результат поступления"));
      return;
    }
  };

  const handleSelectDestinationWarehouse = (warehouse) => {
    if (!warehouse) {
      return;
    }

    setIsDestinationSheetOpen(false);
    const receiptOutcome = hasExplicitNegativeInput() ? "placed_with_discrepancy" : "placed";
    const nextStatus = receiptOutcome === "placed_with_discrepancy" ? "С расхождениями" : "Размещено";

    saveReadyReceipt({ nextStatus, receiptOutcome, destinationWarehouse: warehouse })
      .then(() => setFeedback(`Поступление размещено на склад ${warehouse.roomCode ?? warehouse.roomName}`))
      .catch(() => setFeedback("Не удалось разместить поступление на склад"));
  };

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
              {data.positionsCount ?? receiptPositions.length} позиций
            </span>
            <span>
              <InboxOutlined aria-hidden="true" />
              {totalDocumentQuantity} {data.unit}
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
                {field.value}
              </strong>
            </div>
          ))}
        </section>

        <section className="mobile-card mobile-receipt-block">
          <h3>Проверка оператором</h3>
          <div className="mobile-receipt-quantity-summary">
            <span>По документам: <strong>{totalDocumentQuantity} {data.unit}</strong></span>
            <span>По факту: <strong>{totalActualQuantity} {data.unit}</strong></span>
          </div>

          <div className="mobile-receipt-line-checks">
            {lineReviewItems.map((item) => (
              <label className={item.hasQuantityMismatch ? "is-mismatch" : ""} key={item.lineId}>
                <input
                  type="checkbox"
                  checked={item.checked}
                  onChange={() => handleLineCheckToggle(item.lineId)}
                />
                <span>
                  <strong>{item.positionCode ?? "Без ПОЗ"}</strong>
                  <em>{item.name}</em>
                  <small>По документу: {item.documentQuantity} {item.unit}</small>
                </span>
                <input
                  aria-label={`Количество по факту ${item.positionCode ?? item.name}`}
                  type="number"
                  min="0"
                  value={item.actualQuantity}
                  onChange={(event) => handleLineActualQuantityChange(item.lineId, event.target.value)}
                />
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
              {(data.rejectReasons ?? []).map((reason) => (
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
                {photo.url ? <img src={photo.url} alt="Фото партии" /> : null}
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
        <button type="button" onClick={handleSaveDraft}>
          Сохранить
        </button>
        <button
          type="button"
          onClick={handleConfirmReceipt}
        >
          Подтвердить поступление
        </button>
        <button type="button" onClick={onBack}>Отмена</button>
      </div>

      <MobileBottomNav activeKey={activeNavKey} onSelect={onNavSelect} />

      <MobileResultModal
        isOpen={Boolean(resultModal)}
        status={resultModal?.status}
        title={resultModal?.title}
        text={resultModal?.text}
        onClose={() => setResultModal(null)}
      />

      {isDestinationSheetOpen ? (
        <MobileBottomSheet
          title="Выберите склад"
          subtitle="Поступление будет размещено в выбранном активном складе"
          onClose={() => setIsDestinationSheetOpen(false)}
        >
          <div className="mobile-warehouse-list">
            {destinationWarehouses.map((warehouse) => (
              <button
                className="mobile-warehouse-item"
                type="button"
                key={warehouse.id}
                onClick={() => handleSelectDestinationWarehouse(warehouse)}
              >
                <div className="mobile-warehouse-item-head">
                  <div>
                    <h4>{warehouse.roomCode} • {warehouse.roomName}</h4>
                    <p>{warehouse.building ?? warehouse.corpus} · {warehouse.floor} · {warehouse.departmentName}</p>
                  </div>
                  <span>Активен</span>
                </div>
              </button>
            ))}
          </div>
        </MobileBottomSheet>
      ) : null}
    </div>
  );
}
