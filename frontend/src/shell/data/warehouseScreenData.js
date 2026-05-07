export const warehouseKpiCards = [
  {
    label: "Складских позиций",
    value: "128",
    badge: "на складах",
    tone: "neutral",
  },
  {
    label: "Единиц на складах",
    value: "1 240",
    badge: "остаток",
    tone: "neutral",
  },
  {
    label: "Спорные позиции",
    value: "5",
    icon: "warning",
    tone: "disputed",
  },
  {
    label: "В перемещении",
    value: "18",
    icon: "shipping",
    tone: "neutral",
  },
  {
    label: "Ожидают проверки",
    value: "7",
    icon: "check",
    tone: "neutral",
  },
  {
    label: "Конфликты",
    value: "2",
    icon: "error",
    tone: "conflict",
  },
];

export const warehouseFilters = [
  {
    label: "Склад",
    options: [
      "Все склады",
      "Склад временного хранения",
      "Склад Б",
      "Зона приемки",
      "Карантинная зона",
    ],
  },
  {
    label: "Категория",
    options: ["Все категории"],
  },
  {
    label: "Статус",
    options: ["Любой статус"],
  },
  {
    label: "Поставщик",
    options: ["Все поставщики"],
  },
  {
    label: "Партия",
    options: ["Все партии"],
  },
  {
    label: "Плановое помещение",
    options: ["Все помещения"],
  },
];

export const warehouseQuickFilters = [
  { label: "Все", active: true, tone: "primary" },
  { label: "Доступно", tone: "neutral" },
  { label: "Спорные", tone: "disputed" },
  { label: "В перемещении", tone: "neutral" },
  { label: "Ожидают проверки", tone: "neutral" },
  { label: "Конфликты", tone: "conflict" },
  { label: "Не синхронизировано", tone: "neutral" },
];

export const warehouseTableRows = [
  {
    id: "EQ-201-05",
    name: "Монитор пациента",
    warehouse: "Склад временного хранения",
    batch: "B-2024-05",
    total: "200 шт.",
    available: "180",
    reserve: "15",
    disputed: "5",
    status: "Спорная позиция",
    statusTone: "disputed",
    highlight: true,
  },
  {
    id: "EQ-201-05",
    name: "Монитор пациента",
    warehouse: "Склад Б",
    batch: "B-2024-05",
    total: "80 шт.",
    available: "80",
    reserve: "0",
    disputed: "0",
    status: "Доступно",
    statusTone: "available",
    highlight: false,
  },
  {
    id: "EQ-201-05",
    name: "Монитор пациента",
    warehouse: "Карантинная зона",
    batch: "B-2024-05",
    total: "20 шт.",
    available: "0",
    reserve: "0",
    disputed: "20",
    status: "Требует решения",
    statusTone: "conflict",
    highlight: false,
  },
  {
    id: "EQ-201-04",
    name: "Тележка медицинская",
    warehouse: "Склад временного хранения",
    batch: "MED-77",
    total: "30 шт.",
    available: "20",
    reserve: "0",
    disputed: "0",
    status: "В перемещении",
    statusTone: "transit",
    highlight: false,
  },
];

export const warehouseAttentionItems = [
  { text: "5 спорных складских позиций", tone: "disputed" },
  { text: "2 конфликта синхронизации", tone: "conflict" },
  { text: "7 поступлений ожидают проверки", tone: "neutral" },
  { text: "1 позиция без планового места", tone: "neutral" },
];

export const warehouseRecentOps = [
  {
    time: "10:45",
    text: "Создано расхождение по",
    highlight: "EQ-201-05",
    author: "Инициатор: Колесников А.",
    tone: "disputed",
  },
  {
    time: "09:30",
    text: "Создано перемещение",
    highlight: "MED-77",
    author: "Система (автоматически)",
    tone: "primary",
  },
  {
    time: "09:12",
    text: "Подтверждено поступление",
    highlight: "A-104",
    author: "Инициатор: Морозов Д.",
    tone: "success",
  },
];

export const warehouseDetailPanel = {
  name: "Монитор пациента EQ-201-05 (2024)",
  category: "Оборудование жизнеобеспечения",
  warehouse: "Склад временного хранения",
  batch: "B-2024-05",
  totalHere: "200 шт.",
  available: 180,
  reserve: 15,
  disputed: 5,
  distribution: [
    { name: "Склад временного хранения", qty: "200 шт." },
    { name: "Склад Б", qty: "80 шт." },
    { name: "Карантинная зона", qty: "20 шт." },
  ],
  total: "300 шт.",
};

export const warehouseScreenData = {
  kpiCards: warehouseKpiCards,
  filters: warehouseFilters,
  quickFilters: warehouseQuickFilters,
  tableRows: warehouseTableRows,
  attentionItems: warehouseAttentionItems,
  recentOps: warehouseRecentOps,
  detailPanel: warehouseDetailPanel,
};
