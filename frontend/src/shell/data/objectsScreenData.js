const ROOM_GROUPS = [
  {
    building: "Корпус А",
    floors: {
      "1 этаж": {
        "Приемное отделение": ["1.01.01 Регистратура", "1.01.02 Кабинет первичного осмотра", "1.01.03 Процедурная"],
        "Диагностика": ["1.02.01 УЗИ", "1.02.02 Рентген"],
      },
      "2 этаж": {
        "Терапия": ["2.01.29 Кабинет врача", "2.01.30 Палата 1", "2.01.31 Палата 2"],
        "Пост медсестры": ["2.02.01 Пост", "2.02.02 Сестринская"],
      },
      "3 этаж": {
        "Лаборатория": ["3.01.01 Аналитическая", "3.01.02 Центрифужная"],
        "Администрация": ["3.02.01 Кабинет заведующего"],
      },
    },
  },
  {
    building: "Корпус Б",
    floors: {
      "1 этаж": {
        "Склад": ["1.10.01 Склад временного хранения", "1.10.02 Расходные материалы"],
        "Стерилизационная": ["1.11.01 Чистая зона", "1.11.02 Грязная зона"],
      },
      "2 этаж": {
        "Хирургия": ["2.20.01 Операционная 1", "2.20.02 Операционная 2", "2.20.03 Предоперационная"],
        "Реанимация": ["2.21.01 Палата интенсивной терапии", "2.21.02 Пост реанимации"],
      },
      "3 этаж": {
        "Техническая зона": ["3.30.01 Серверная", "3.30.02 Электрощитовая"],
        "Архив": ["3.31.01 Архив оборудования", "3.31.02 Комната учета"],
      },
    },
  },
];

const EQUIPMENT_POOL = [
  ["Монитор пациента", "Медоборудование", "MedSupply"],
  ["Шкаф медицинский", "Мебель", "HealthLine"],
  ["Светильник", "Электрика", "ЭлектроСнаб"],
  ["Контроллер доступа", "СКУД", "SecureTech"],
  ["Датчик давления", "Датчик", "ТехноПром"],
];

function makeEquipment(roomId, roomIndex) {
  const count = 3 + (roomIndex % 3);
  return Array.from({ length: count }, (_, index) => {
    const [name, type, supplier] = EQUIPMENT_POOL[(roomIndex + index) % EQUIPMENT_POOL.length];
    return {
      id: `${roomId}-EQ-${index + 1}`,
      name,
      type,
      qty: String(index === 0 ? 2 : 1),
      supplier,
      status: index === 0 && roomIndex % 5 === 0 ? "Требует внимания" : "Проверено",
    };
  });
}

function buildObjectStructure() {
  const nodes = [];
  let roomIndex = 0;

  ROOM_GROUPS.forEach((buildingGroup, buildingIndex) => {
    const buildingId = `building-${buildingIndex + 1}`;
    nodes.push({
      id: buildingId,
      parentId: null,
      level: 0,
      type: "building",
      title: buildingGroup.building,
      object: buildingGroup.building,
      floor: "",
      department: "",
      status: buildingIndex === 0 ? "В работе" : "Не начато",
      progress: buildingIndex === 0 ? 72 : 18,
      discrepancies: buildingIndex === 0 ? 10 : 2,
    });

    Object.entries(buildingGroup.floors).forEach(([floorName, departments], floorIndex) => {
      const floorId = `${buildingId}-floor-${floorIndex + 1}`;
      nodes.push({
        id: floorId,
        parentId: buildingId,
        level: 1,
        type: "floor",
        title: floorName,
        object: buildingGroup.building,
        floor: floorName,
        department: "",
        status: floorIndex === 0 ? "В работе" : "Не начато",
        progress: 35 + floorIndex * 12,
        discrepancies: floorIndex === 1 ? 4 : 1,
      });

      Object.entries(departments).forEach(([departmentName, rooms], departmentIndex) => {
        const departmentId = `${floorId}-dept-${departmentIndex + 1}`;
        nodes.push({
          id: departmentId,
          parentId: floorId,
          level: 2,
          type: "department",
          title: departmentName,
          object: buildingGroup.building,
          floor: floorName,
          department: departmentName,
          status: departmentIndex === 0 ? "В работе" : "Не начато",
          progress: 28 + departmentIndex * 18,
          discrepancies: departmentIndex === 0 ? 2 : 0,
        });

        rooms.forEach((roomName) => {
          roomIndex += 1;
          const [roomNumber, ...nameParts] = roomName.split(" ");
          const roomId = `${departmentId}-room-${roomIndex}`;
          const equipment = makeEquipment(roomId, roomIndex);
          nodes.push({
            id: roomId,
            parentId: departmentId,
            level: 3,
            type: "room",
            title: roomName,
            roomNumber,
            roomName: nameParts.join(" "),
            object: buildingGroup.building,
            floor: floorName,
            department: departmentName,
            status: roomIndex % 4 === 0 ? "Требует внимания" : roomIndex % 3 === 0 ? "Не начато" : "В работе",
            progress: roomIndex % 3 === 0 ? 0 : 38 + (roomIndex % 5) * 10,
            discrepancies: roomIndex % 4 === 0 ? 1 : 0,
            equipment,
          });

          equipment.forEach((item, equipmentIndex) => {
            nodes.push({
              id: item.id,
              parentId: roomId,
              level: 4,
              type: "equipment",
              title: item.name,
              object: buildingGroup.building,
              floor: floorName,
              department: departmentName,
              status: item.status,
              progress: item.status === "Проверено" ? 100 : 20,
              discrepancies: item.status === "Проверено" ? 0 : 1,
              equipmentType: item.type,
              supplier: item.supplier,
              qty: item.qty,
              equipmentIndex: equipmentIndex + 1,
            });
          });
        });
      });
    });
  });

  return nodes;
}

export const objectStructureNodes = buildObjectStructure();

export const objectsScreenData = {
  actions: ["Добавить объект", "Настроить зоны"],
  stats: [
    { label: "Объектов", value: "3", tone: "blue", detail: "активные", icon: "objects" },
    { label: "Этажей", value: "18", tone: "purple", detail: "в структуре", icon: "registry" },
    { label: "Помещений", value: "74", tone: "green", detail: "плановые", icon: "rooms" },
    { label: "Расхождения", value: "10", tone: "red", detail: "внимание", icon: "discrepancies", attention: true },
  ],
};
