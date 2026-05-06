export const objectsScreenData = {
    actions: ["Добавить объект", "Настроить зоны"],
    stats: [
      { label: "Объектов", value: "3", tone: "blue", detail: "активные", icon: "objects" },
      { label: "Этажей", value: "18", tone: "purple", detail: "в структуре", icon: "registry" },
      { label: "Помещений", value: "74", tone: "green", detail: "плановые", icon: "rooms" },
      { label: "Расхождения", value: "10", tone: "red", detail: "внимание", icon: "discrepancies", attention: true },
    ],
    filters: [
      { label: "Объект", options: ["Объект (Все)", "Корпус А", "Корпус Б"] },
      { label: "Этаж", options: ["Этаж (Все)", "1 этаж", "2 этаж"] },
      { label: "Статус", options: ["Статус (Любой)", "В работе", "Завершено"] },
    ],
    quickFilters: [
      { label: "Все" },
      { label: "В работе" },
      { label: "Не начато" },
      { label: "Завершено" },
      { label: "С расхождениями", tone: "red" },
    ],
    primaryTitle: "Объекты и помещения",
    primaryColumns: ["Структура", "Тип", "Помещений", "Оборудование", "Прогресс", "Расхождения", "Статус"],
    treeRows: [
      { name: "Корпус А", type: "Объект", rooms: "58", equipment: "340", progress: 72, discrepancies: 10, status: "В работе", level: 0, active: true },
      { name: "2 этаж", type: "Этаж", rooms: "24", equipment: "128", progress: 75, discrepancies: 4, status: "В работе", level: 1 },
      { name: "2.01.30 Приёмное отделение", type: "Помещение", rooms: "—", equipment: "8", progress: 38, discrepancies: 2, status: "Проверить", level: 2 },
      { name: "Корпус Б", type: "Объект", rooms: "24", equipment: "96", progress: 0, discrepancies: 0, status: "Не начато", level: 0 },
      { name: "Склад временного хранения", type: "Объект", rooms: "12", equipment: "46", progress: 54, discrepancies: 2, status: "В работе", level: 0 },
    ],
    primaryRows: [
      ["Корпус А", "164", "Иван Иванов", "Готов"],
      ["Корпус Б", "118", "Мария Петрова", "Готов"],
      ["Складской комплекс", "72", "Алексей Орлов", "Проверить зоны"],
      ["Административный блок", "54", "Ольга Смирнова", "Готов"],
    ],
    secondaryTitle: "Зоны обхода",
    secondaryItems: ["Северное крыло / этаж 2", "Складская зона приемки", "Серверные помещения"],
    detailPanel: {
      label: "Детали объекта",
      title: "Корпус А",
      metrics: [
        { label: "Прогресс", value: "72.4%", tone: "blue" },
        { label: "Расхождения", value: "10", tone: "red" },
      ],
      fields: [
        { label: "Тип", value: "Производственный" },
        { label: "Этажность", value: "8 этажей" },
        { label: "Оборудование", value: "340 единиц" },
        { label: "Синхронизация", value: "Сегодня, 09:42" },
      ],
    },
    attentionPanel: {
      title: "Требуют внимания",
      items: [
        { title: "10 расхождений в Корпус А", meta: "приоритетная сверка", tone: "red" },
        { title: "2 конфликта синхронизации", meta: "Склад временного хранения", tone: "orange" },
        { title: "6 помещений не начато", meta: "нужно назначить обход", tone: "gray" },
      ],
    },
    timeline: {
      title: "Последняя активность",
      items: [
        { time: "Сегодня, 09:42", actor: "Система", text: "Синхронизировал Корпус А", tone: "green" },
        { time: "Вчера, 17:10", actor: "Иван Иванов", text: "Обновил зоны обхода 2 этажа", tone: "blue" },
      ],
    },
  };
