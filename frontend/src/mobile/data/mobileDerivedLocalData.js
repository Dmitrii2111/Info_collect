import { mobileEquipmentFixtureRooms } from "./mobileEquipmentFixtureData.js";

const EMPTY_HISTORY_SUMMARY = {
  title: "Журнал действий",
  user: "Иван Иванов",
  lastActivity: "Локальных действий пока нет",
  stats: [
    { label: "действий", value: "0", tone: "primary" },
    { label: "отправлено", value: "0", tone: "success" },
    { label: "в очереди", value: "0", tone: "warning" },
    { label: "требуют внимания", value: "0", tone: "error" },
  ],
};

const HISTORY_FILTERS = ["Все", "Сегодня", "Ошибки", "Синхронизация", "Перемещения", "Поступление", "Осмотр оборудования", "Расхождения"];
const DISCREPANCY_FILTERS = ["Все", "Новые", "В работе", "Решены"];
const fixtureEquipmentById = new Map(
  mobileEquipmentFixtureRooms.flatMap((room) => (
    (room.equipment ?? []).map((item) => [item.id, { ...item, room }])
  )),
);

function isNonEmptyString(value) {
  return typeof value === "string" && value.trim().length > 0;
}

function formatLocalTime(value) {
  if (!value) {
    return "сейчас";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "сейчас";
  }

  return new Intl.DateTimeFormat("ru-RU", { hour: "2-digit", minute: "2-digit" }).format(date);
}

function getDraftTimestamp(draft) {
  return draft?.updatedAt ?? draft?.createdAt ?? null;
}

function getPositionCode(draft) {
  return draft?.payload?.designPositionCode ??
    draft?.payload?.positionCode ??
    draft?.context?.designPositionCode ??
    draft?.context?.positionCode ??
    fixtureEquipmentById.get(draft?.entityId)?.designPositionCode ??
    fixtureEquipmentById.get(draft?.entityId)?.positionCode ??
    "Без шифра";
}

function getEquipmentTitle(draft) {
  return draft?.context?.equipmentName ??
    draft?.payload?.equipmentName ??
    fixtureEquipmentById.get(draft?.entityId)?.title ??
    "Позиция оборудования";
}

function getRoomContext(draft) {
  const context = draft?.context ?? {};
  const fixtureRoom = fixtureEquipmentById.get(draft?.entityId)?.room;
  const roomTitle = [context.roomCode ?? context.roomNumber, context.roomName].filter(Boolean).join(" — ");

  return roomTitle || context.roomName || fixtureRoom?.title || "Помещение не указано";
}

function getLocationLine(draft) {
  const context = draft?.context ?? {};
  const fixtureRoom = fixtureEquipmentById.get(draft?.entityId)?.room;

  return [
    context.building ?? context.corpus ?? fixtureRoom?.building ?? fixtureRoom?.corpus,
    context.floor ? `${context.floor} этаж` : fixtureRoom?.floor ? `${fixtureRoom.floor} этаж` : null,
    context.departmentName ?? fixtureRoom?.departmentName,
  ].filter(Boolean).join(" • ") || "Локальный обход";
}

function getQueueOperationForDraft(draft, operations = []) {
  return operations.find((operation) => (
    operation.context?.draftId === draft.id ||
    operation.idempotencyKey === `draft:${draft.id}`
  )) ?? null;
}

function getEquipmentFixture(draft) {
  return fixtureEquipmentById.get(draft?.entityId) ?? null;
}

function getQueueStatus(operation) {
  if (!operation) {
    return {
      status: "Локальное",
      statusKey: "Новые",
      syncState: "Локально",
      severity: "review",
      severityLabel: "Локально",
    };
  }

  if (operation.status === "failed" || operation.status === "cancelled") {
    return {
      status: "В работе",
      statusKey: "В работе",
      syncState: "Ошибка отправки",
      severity: "critical",
      severityLabel: "Ошибка отправки",
    };
  }

  if (operation.status === "conflict") {
    return {
      status: "В работе",
      statusKey: "В работе",
      syncState: "Конфликт",
      severity: "conflict",
      severityLabel: "Конфликт",
    };
  }

  if (operation.status === "synced") {
    return {
      status: "Решено",
      statusKey: "Решены",
      syncState: "Синхронизировано",
      severity: "resolved",
      severityLabel: "Решено",
    };
  }

  return {
    status: "Новое",
    statusKey: "Новые",
    syncState: "Ожидает отправки",
    severity: "pending",
    severityLabel: "Ожидает отправки",
  };
}

function getEquipmentIssueReason(draft) {
  const payload = draft?.payload ?? {};
  const selectedReasons = Array.isArray(payload.selectedReasons) ? payload.selectedReasons.filter(Boolean) : [];
  const statusKey = payload.statusKey ?? payload.preferredStatusKey;
  const comment = isNonEmptyString(payload.comment) ? payload.comment.trim() : "";

  if (selectedReasons.length > 0) {
    return selectedReasons.join(", ");
  }

  if (["notFound", "missing"].includes(statusKey)) {
    return "Оборудование не найдено";
  }

  if (comment) {
    return comment;
  }

  return "Требуется сверка";
}

function isEquipmentIssueDraft(draft) {
  if (draft?.type !== "EQUIPMENT_DATA" || draft?.entityType !== "equipment") {
    return false;
  }

  const payload = draft.payload ?? {};
  const statusKey = payload.statusKey ?? payload.preferredStatusKey;
  const selectedReasons = Array.isArray(payload.selectedReasons) ? payload.selectedReasons.filter(Boolean) : [];
  const hasProblemComment = isNonEmptyString(payload.comment) && ["issue", "mismatch", "discrepancy", "notFound", "missing"].includes(statusKey);
  const hasProblemEvidence = Boolean(payload.photoMediaDraftId) && ["issue", "mismatch", "discrepancy", "notFound", "missing"].includes(statusKey);

  return ["issue", "mismatch", "discrepancy", "notFound", "missing"].includes(statusKey) ||
    selectedReasons.length > 0 ||
    hasProblemComment ||
    hasProblemEvidence;
}

function createReceiptStockDiscrepancy(warehouse, stockItem) {
  const timestamp = stockItem.identifiedAt ?? stockItem.updatedAt ?? stockItem.createdAt ?? null;
  const positionCode = stockItem.positionCode ?? stockItem.designPositionCode ?? "Без ПОЗ";
  const reason = stockItem.discrepancyReason ?? "Расхождение при поступлении";
  const warehouseLabel = `${warehouse.roomCode ?? stockItem.destinationWarehouseRoomCode ?? ""} ${warehouse.roomName ?? stockItem.destinationWarehouseRoomName ?? ""}`.trim();
  const receiptLabel = stockItem.receiptDisplayNumber ?? stockItem.sourceReceiptBatchId;

  return {
    id: `receipt-discrepancy:${stockItem.sourceReceiptBatchId}:${stockItem.sourceReceiptLineId}`,
    sourceType: "receipt",
    sourceReceiptBatchId: stockItem.sourceReceiptBatchId,
    sourceReceiptLineId: stockItem.sourceReceiptLineId,
    warehouseId: warehouse.id,
    equipmentId: null,
    entityId: null,
    positionCode,
    designPositionCode: stockItem.designPositionCode ?? positionCode,
    updatedAt: timestamp,
    title: stockItem.name ?? "Позиция поступления",
    itemCode: positionCode,
    context: warehouseLabel || "Локальный склад",
    locationBadge: warehouse.status === "active" ? "Склад" : null,
    type: "Поступление",
    reason,
    comment: Array.isArray(stockItem.discrepancyReasons) && stockItem.discrepancyReasons.length > 0
      ? stockItem.discrepancyReasons.join(", ")
      : stockItem.discrepancyComment || stockItem.discrepancyReason || null,
    date: "Сегодня",
    responsible: stockItem.identifiedBy ?? "Оператор",
    locationLine: [warehouse.building ?? warehouse.corpus, warehouse.floor ? `${warehouse.floor} этаж` : null, warehouse.departmentName].filter(Boolean).join(" • ") || "Локальный склад",
    priority: "Локально",
      status: "Новое",
      statusKey: "Новые",
      syncState: "Локально",
      severity: "conflict",
      severityLabel: "Принято с замечаниями",
    details: [
      { label: "Поступление", value: receiptLabel },
      { label: "Документ", value: stockItem.receiptDocumentName ?? "Не указан" },
      { label: "Поставщик", value: stockItem.supplier ?? "Не указан" },
      { label: "ПОЗ", value: positionCode },
      { label: "Наименование", value: stockItem.name ?? "Позиция поступления" },
      { label: "Склад", value: warehouseLabel },
      { label: "Количество по документу", value: `${stockItem.documentQuantity ?? ""} ${stockItem.unit ?? ""}`.trim() },
      { label: "Количество по факту", value: `${stockItem.actualQuantity ?? stockItem.quantity ?? ""} ${stockItem.unit ?? ""}`.trim() },
      { label: "Выявил", value: stockItem.identifiedBy ?? "Оператор" },
      { label: "Когда", value: formatLocalTime(timestamp) },
      { label: "Причина", value: reason },
    ],
    history: [
      { time: formatLocalTime(timestamp), text: "расхождение выявлено при проверке поступления" },
    ],
  };
}

function createReceiptStateLineDiscrepancy(receiptState, line) {
  const timestamp = receiptState.identifiedAt ?? receiptState.confirmedAt ?? receiptState.checkedAt ?? receiptState.updatedAt ?? null;
  const positionCode = line.positionCode ?? line.designPositionCode ?? "Без ПОЗ";
  const reason = Array.isArray(line.discrepancyReasons) && line.discrepancyReasons.length > 0
    ? line.discrepancyReasons.join(", ")
    : line.discrepancyReason ?? "Расхождение при поступлении";
  const receiptLabel = receiptState.displayNumber ?? receiptState.batchNumber ?? receiptState.receiptBatchId;

  return {
    id: `receipt-discrepancy:${receiptState.receiptBatchId}:${line.lineId}`,
    sourceType: "receipt",
    sourceReceiptBatchId: receiptState.receiptBatchId,
    sourceReceiptLineId: line.lineId,
    warehouseId: null,
    equipmentId: null,
    entityId: null,
    positionCode,
    designPositionCode: line.designPositionCode ?? positionCode,
    updatedAt: timestamp,
    title: line.name ?? "Позиция поступления",
    itemCode: positionCode,
    context: receiptLabel ?? "Поступление",
    locationBadge: null,
    type: "Поступление",
    reason,
    comment: line.discrepancyComment || receiptState.comment || null,
    date: "Сегодня",
    responsible: receiptState.confirmedBy ?? receiptState.operatorName ?? "Оператор",
    locationLine: "Поступление не принято на склад",
    priority: "Локально",
    status: "Новое",
    statusKey: "Новые",
    syncState: "Локально",
    severity: "conflict",
    severityLabel: "Не принято по факту",
    details: [
      { label: "Поступление", value: receiptLabel },
      { label: "Документ", value: receiptState.documentName ?? "Не указан" },
      { label: "Поставщик", value: line.supplier ?? receiptState.supplier ?? "Не указан" },
      { label: "ПОЗ", value: positionCode },
      { label: "Наименование", value: line.name ?? "Позиция поступления" },
      { label: "Количество по документу", value: `${line.documentQuantity ?? ""} ${line.unit ?? ""}`.trim() },
      { label: "Количество по факту", value: `${line.actualQuantity ?? 0} ${line.unit ?? ""}`.trim() },
      { label: "Выявил", value: receiptState.confirmedBy ?? receiptState.operatorName ?? "Оператор" },
      { label: "Когда", value: formatLocalTime(timestamp) },
      { label: "Причина", value: reason },
    ],
    history: [
      { time: formatLocalTime(timestamp), text: "расхождение выявлено при проверке поступления" },
    ],
  };
}

export function createLocalDiscrepanciesData(drafts = [], operations = [], warehouses = [], receiptStates = []) {
  const equipmentDiscrepancies = drafts
    .filter(isEquipmentIssueDraft)
    .map((draft) => {
      const operation = getQueueOperationForDraft(draft, operations);
      const queueStatus = getQueueStatus(operation);
      const positionCode = getPositionCode(draft);
      const reason = getEquipmentIssueReason(draft);
      const fixtureEquipment = getEquipmentFixture(draft);
      const fixtureRoom = fixtureEquipment?.room;
      const context = draft.context ?? {};
      const payload = draft.payload ?? {};
      const equipmentId = context.equipmentId ?? draft.entityId ?? null;
      const roomId = context.roomId ?? fixtureRoom?.id ?? null;
      const departmentId = context.departmentId ?? fixtureRoom?.departmentId ?? null;

      return {
        id: `local-discrepancy:${draft.id}`,
        draftId: draft.id,
        sourceDraftId: draft.id,
        equipmentId,
        entityId: equipmentId,
        roomId,
        departmentId,
        positionCode,
        designPositionCode: payload.designPositionCode ?? context.designPositionCode ?? positionCode,
        photoMediaDraftId: payload.photoMediaDraftId ?? null,
        photoName: payload.photoName ?? null,
        photoSize: payload.photoSize ?? null,
        photoType: payload.photoType ?? null,
        updatedAt: getDraftTimestamp(draft),
        title: getEquipmentTitle(draft),
        itemCode: positionCode,
        context: getRoomContext(draft),
        type: "Осмотр оборудования",
        reason,
        comment: isNonEmptyString(draft?.payload?.comment) ? draft.payload.comment.trim() : null,
        date: "Сегодня",
        responsible: "Оператор",
        locationLine: getLocationLine(draft),
        priority: queueStatus.severity === "critical" ? "Высокий" : "Локально",
        details: [
          { label: "ПОЗ", value: positionCode },
          { label: "Помещение", value: getRoomContext(draft) },
          { label: "Источник", value: "Локальный черновик осмотра" },
        ],
        history: [
          { time: formatLocalTime(getDraftTimestamp(draft)), text: "создано локальное расхождение" },
        ],
        ...queueStatus,
      };
    })
  const receiptStockDiscrepancies = (Array.isArray(warehouses) ? warehouses : [])
    .flatMap((warehouse) => (
      (warehouse.stockItems ?? [])
        .filter((stockItem) => stockItem?.hasDiscrepancy)
        .map((stockItem) => createReceiptStockDiscrepancy(warehouse, stockItem))
    ));
  const stockDiscrepancyIds = new Set(receiptStockDiscrepancies.map((item) => item.id));
  const receiptStateDiscrepancies = (Array.isArray(receiptStates) ? receiptStates : [])
    .filter((receiptState) => ["conflict", "placed_with_discrepancy"].includes(receiptState?.status))
    .flatMap((receiptState) => (
      (receiptState.lineReviewItems ?? [])
        .filter((line) => line?.hasDiscrepancy)
        .map((line) => createReceiptStateLineDiscrepancy(receiptState, line))
    ))
    .filter((item) => !stockDiscrepancyIds.has(item.id));

  const discrepancies = [...equipmentDiscrepancies, ...receiptStockDiscrepancies, ...receiptStateDiscrepancies]
    .sort((first, second) => (
      new Date(second.updatedAt ?? second.date ?? 0).getTime() - new Date(first.updatedAt ?? first.date ?? 0).getTime()
    ));

  return {
    context: "Локальные расхождения",
    summary: {
      title: "Проблемные позиции",
      progressText: discrepancies.length > 0 ? `${discrepancies.length} локальных расхождений` : "Расхождений пока нет",
      progressValue: discrepancies.length > 0 ? 100 : 0,
    },
    filters: DISCREPANCY_FILTERS,
    discrepancies,
  };
}

function getOperationTypeLabel(operationType) {
  const labels = {
    DISCREPANCY_RESOLVE: "Расхождение",
    EQUIPMENT_CHECK_UPDATE: "Осмотр оборудования",
    RECEIPT_BATCH_CONFIRM: "Поступление",
    WAREHOUSE_CREATE: "Создание склада",
    WAREHOUSE_CLOSE: "Закрытие склада",
    WAREHOUSE_MOVE_CREATE: "Перемещение",
  };

  return labels[operationType] ?? "Синхронизация";
}

function getOperationStatus(operation) {
  if (operation.status === "failed" || operation.status === "cancelled") {
    return { status: "Ошибка отправки", statusKey: "Ошибки", tone: "error" };
  }

  if (operation.status === "conflict") {
    return { status: "Конфликт", statusKey: "Синхронизация", tone: "warning" };
  }

  if (operation.status === "synced") {
    return { status: "Синхронизировано", statusKey: "Синхронизация", tone: "success" };
  }

  return { status: "Ожидает отправки", statusKey: "Синхронизация", tone: "warning" };
}

function createDraftHistoryEvent(draft) {
  const positionCode = getPositionCode(draft);
  const timestamp = getDraftTimestamp(draft);
  const typeByDraftType = {
    DISCREPANCY_RESOLUTION: "Расхождения",
    EQUIPMENT_DATA: isEquipmentIssueDraft(draft) ? "Расхождения" : "Осмотр оборудования",
    RECEIPT_BATCH_CONFIRM: "Поступление",
    WAREHOUSE_MOVE: "Перемещения",
  };
  const type = typeByDraftType[draft.type] ?? "Проверки";
  const receiptOutcome = draft.payload?.receiptOutcome ?? draft.context?.receiptOutcome;
  const receiptTitle = receiptOutcome === "placed"
    ? "Поступление размещено"
    : receiptOutcome === "placed_with_discrepancy"
      ? "Поступление размещено с расхождениями"
    : receiptOutcome === "conflict"
      ? "Поступление с замечаниями"
      : `Сохранен черновик: ${type}`;

  return {
    id: `draft-history:${draft.id}`,
    timestamp,
    type,
    title: type === "Расхождения" ? "Зафиксировано локальное расхождение" : receiptTitle,
    context: draft.context?.destinationWarehouseName ?? getRoomContext(draft),
    item: draft.type === "EQUIPMENT_DATA" ? `${getEquipmentTitle(draft)} • ${positionCode}` : draft.entityId,
    user: draft.context?.operatorName ?? draft.payload?.operatorName ?? "Оператор",
    time: formatLocalTime(timestamp),
    date: "Сегодня",
    status: draft.status === "queued" ? "Ожидает отправки" : "Локально",
    statusKey: type,
    tone: type === "Расхождения" ? "error" : "info",
    description: isEquipmentIssueDraft(draft)
      ? getEquipmentIssueReason(draft)
      : receiptOutcome === "placed"
        ? "Поступление размещено на локальный склад"
        : receiptOutcome === "placed_with_discrepancy"
          ? "Поступление размещено на склад с расхождениями"
        : receiptOutcome === "conflict"
          ? "Поступление сохранено с замечаниями"
          : "Данные сохранены локально",
    details: [
      { label: "Источник", value: "Черновик" },
      { label: "Тип", value: draft.type },
      { label: "Статус", value: draft.status },
      ...(draft.type === "RECEIPT_BATCH_CONFIRM" ? [
        { label: "Оператор", value: draft.context?.operatorName ?? draft.payload?.operatorName ?? "Оператор" },
        { label: "Партия", value: draft.context?.batchNumber ?? draft.entityId },
        { label: "Склад", value: draft.context?.destinationWarehouseName ?? "Не выбран" },
        { label: "Объем", value: `${draft.context?.positionsCount ?? draft.payload?.positions?.length ?? 0} поз. • ${draft.context?.totalQuantity ?? draft.payload?.actualQuantity ?? ""} шт.` },
      ] : []),
    ],
  };
}

function createOperationHistoryEvent(operation) {
  const status = getOperationStatus(operation);
  const type = getOperationTypeLabel(operation.type);
  const errorMessage = operation.error?.message ?? operation.error?.code ?? null;
  const timestamp = operation.updatedAt ?? operation.createdAt ?? null;
  const titleByType = {
    RECEIPT_BATCH_CONFIRM: operation.context?.receiptOutcome === "placed"
      ? "Поступление размещено"
      : operation.context?.receiptOutcome === "placed_with_discrepancy"
        ? "Поступление размещено с расхождениями"
      : operation.context?.receiptOutcome === "conflict"
        ? "Поступление с замечаниями"
        : null,
    WAREHOUSE_CREATE: "Создан склад",
    WAREHOUSE_CLOSE: "Закрыт склад",
  };

  return {
    id: `queue-history:${operation.id}`,
    timestamp,
    type,
    title: titleByType[operation.type] ?? (status.tone === "error" ? `Ошибка отправки: ${type}` : `Операция в очереди: ${type}`),
    context: operation.context?.destinationWarehouseName ?? operation.context?.roomName ?? operation.entityType ?? "Offline queue",
    item: operation.context?.roomCode
      ? `${operation.context.roomCode} • ${operation.context.roomName ?? ""}`.trim()
      : operation.context?.positionCode ?? operation.entityId ?? operation.context?.draftId,
    user: operation.context?.operatorName ?? "Оператор",
    time: formatLocalTime(timestamp),
    date: "Сегодня",
    ...status,
    description: errorMessage ?? "Операция хранится локально",
    details: [
      { label: "Операция", value: operation.type },
      { label: "Статус", value: operation.status },
      { label: "Попытки", value: String(operation.attempts ?? 0) },
      ...(operation.type === "RECEIPT_BATCH_CONFIRM" ? [
        { label: "Оператор", value: operation.context?.operatorName ?? "Оператор" },
        { label: "Партия", value: operation.context?.batchNumber ?? operation.entityId },
        { label: "Склад", value: operation.context?.destinationWarehouseName ?? "Не выбран" },
        { label: "Объем", value: `${operation.context?.positionsCount ?? 0} поз. • ${operation.context?.totalQuantity ?? ""} шт.` },
      ] : []),
      { label: "Ошибка", value: errorMessage },
    ],
  };
}

export function createLocalHistoryData(drafts = [], operations = []) {
  const events = [
    ...drafts.map(createDraftHistoryEvent),
    ...operations.map(createOperationHistoryEvent),
  ]
    .filter((event) => event.title)
    .sort((first, second) => (
      new Date(second.timestamp ?? 0).getTime() - new Date(first.timestamp ?? 0).getTime()
    ));
  const errorCount = events.filter((event) => event.tone === "error").length;
  const queuedCount = operations.filter((operation) => ["queued", "syncing"].includes(operation.status)).length;
  const syncedCount = operations.filter((operation) => operation.status === "synced").length;

  return {
    summary: {
      ...EMPTY_HISTORY_SUMMARY,
      lastActivity: events.length > 0 ? "Последняя активность: сегодня" : EMPTY_HISTORY_SUMMARY.lastActivity,
      stats: [
        { label: "действий", value: String(events.length), tone: "primary" },
        { label: "отправлено", value: String(syncedCount), tone: "success" },
        { label: "в очереди", value: String(queuedCount), tone: "warning" },
        { label: "требуют внимания", value: String(errorCount), tone: "error" },
      ],
    },
    filters: HISTORY_FILTERS,
    events,
  };
}
