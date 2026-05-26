// Generated from docs/dev-data/TestDataV1_Incoming.xlsx sheet data-out for mobile dev receipt fixture.
// The sheet has no backend IDs; ПОЗ is only the project position code.

const incomingRows = [
  ["incoming-line-001", "7.45", "Диспенсер для бумажных полотенец", "Поштучного отбора листов, выполнен из ударопрочного пластика ABS. Предназначен для объектов со средней и высокой проходимостью. Настенный еханический. Предназначен для быстрого вытирания рук, с помощью бумажных полотенец.", "DS-03", "Maxtrade Group Co, ltd.  (КИТАЙ)", 10, "шт.", "стена", "немед"],
  ["incoming-line-002", "7.58", "Ведро для мусора", "Корзина-урна для мусора белая с вращающейся крышкой", "DS-01", "Maxtrade Group Co, ltd.  (КИТАЙ)", 10, "шт.", "", "немед"],
  ["incoming-line-003", "3.100", "Вызывная палатная сигнализация", "", "", "", 10, "компл.", "", "немед"],
  ["incoming-line-004", "7.64", "Двухсекционный диспенсер для масок и перчаток закрытый", "Материал- нержавеющая сталь. Толщина металла 1,0 мм. Назаначение для перчаток и масок", "DZ-006", "Maxtrade Group Co, ltd.  (КИТАЙ)", 10, "шт.", "стена", "немед"],
  ["incoming-line-005", "7.45М", "Диспенсер для бумажных полотенец", "Поштучного отбора листов, выполнен из металла. Предназначен для объектов со средней и высокой проходимостью. Настенный механический. Предназначен для быстрого вытирания рук, с помощью бумажных полотенец", "DS-033", "Maxtrade Group Co, ltd.  (КИТАЙ)", 10, "шт.", "стена", "немед"],
];

export const mobileReceiptFixturePositions = incomingRows.map(([
  id,
  positionCode,
  name,
  description,
  brand,
  supplier,
  quantity,
  unit,
  mount,
  equipmentType,
]) => ({
  id,
  lineId: id,
  sourceRowId: null,
  importRowNumber: null,
  positionCode,
  designPositionCode: positionCode,
  name,
  title: name,
  description,
  brand,
  model: brand,
  supplier,
  quantity,
  unit,
  mount,
  equipmentType,
  note: "",
  plannedItemId: null,
  backendPlannedItemId: null,
}));

const totalQuantity = mobileReceiptFixturePositions.reduce((sum, item) => sum + Number(item.quantity || 0), 0);
const supplierCount = new Set(mobileReceiptFixturePositions.map((item) => item.supplier).filter(Boolean)).size;

export const mobileReceiptFixtureBatches = [
  {
    id: "incoming-dev-batch-001",
    batchNumber: "INCOMING-DEV-001",
    number: "INCOMING-DEV-001",
    displayNumber: "INCOMING-DEV-001",
    itemTitle: "Партия оснащения",
    itemCode: "INCOMING-DEV-001",
    status: "Ожидает проверки",
    source: "Назначено диспетчером",
    sourceKey: "dispatcher-dev-fixture",
    quantity: totalQuantity,
    unit: "ед.",
    warehouse: "Склад не выбран",
    warehouseName: "Склад не выбран",
    supplier: supplierCount > 1 ? `${supplierCount} поставщиков` : (mobileReceiptFixturePositions[0]?.supplier ?? "Поставщик не указан"),
    document: "TestDataV1_Incoming.xlsx",
    category: "Оснащение",
    createdBy: "Диспетчер",
    createdAt: "Назначено диспетчером",
    responsible: "Оператор",
    positionsCount: mobileReceiptFixturePositions.length,
    totalQuantity,
    conflictCount: 0,
    tone: "primary",
    positions: mobileReceiptFixturePositions,
    dispatcherFields: [
      { label: "Источник", value: "Назначение диспетчера" },
      { label: "Партия", value: "INCOMING-DEV-001" },
      { label: "Позиций", value: String(mobileReceiptFixturePositions.length) },
      { label: "Количество по документам", value: `${totalQuantity} ед.` },
      { label: "Поставщики", value: supplierCount > 1 ? `${supplierCount} поставщиков` : (mobileReceiptFixturePositions[0]?.supplier ?? "Не указан") },
      { label: "Документ", value: "TestDataV1_Incoming.xlsx" },
    ],
    checks: [
      { id: "quantity", label: "Количество совпадает", checked: false },
      { id: "marking", label: "Маркировка читается", checked: false },
      { id: "package", label: "Упаковка без повреждений", checked: false },
      { id: "documents", label: "Документы соответствуют", checked: false },
    ],
    rejectReasons: [
      "Количество не совпадает",
      "Повреждена упаковка",
      "Нет маркировки",
      "Не тот товар",
      "Нет документов",
      "Другое",
    ],
  },
];
