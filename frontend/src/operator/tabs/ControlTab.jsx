import { Card, Progress, Select, Typography } from "antd";
import { ITEM_WORKLIST_OPTIONS, ROOM_WORKLIST_OPTIONS } from "../constants.js";
import {
  ItemCard,
  RoomCard,
  RoomCompletionHistogram,
  SummaryCard,
} from "../components.jsx";

const { Text } = Typography;

export function ControlTab({
  controlData,
  controlFilters,
  controlLoading,
  controlError,
  filteredRooms,
  filteredItems,
  floors,
  departments,
  roomOptions,
  onUpdateControlFilter,
}) {
  const roomSummary = controlData.roomSummary || {};
  const itemSummary = controlData.itemSummary || {};
  const roomTotal = Number(roomSummary.total || 0);
  const roomCompleted = Math.max(roomTotal - Number(roomSummary.worklist?.unchecked || 0), 0);
  const roomAttention = Number(roomSummary.worklist?.missing || 0) + Number(roomSummary.worklist?.conflict || 0);
  const itemTotal = Number(itemSummary.total || 0);
  const itemCompleted = Math.max(itemTotal - Number(itemSummary.worklist?.unchecked || 0), 0);
  const itemAttention = Number(itemSummary.worklist?.no_serial || 0) + Number(itemSummary.worklist?.pnr_attention || 0);
  const roomFilters = [
    { value: "", label: "Все статусы" },
    ...ROOM_WORKLIST_OPTIONS.filter((option) => option.value),
  ];

  return (
    <>
      <section className="react-grid control-summary-grid">
        <article className="react-panel control-summary-panel">
          <div className="panel-title-row">
            <div>
              <h2>Сводка по помещениям</h2>
              <p className="assignment-helper-text">Общий статус помещений по текущей активной версии плана.</p>
            </div>
          </div>
          <div className="react-summary-grid">
            <SummaryCard label="Всего" value={roomSummary.total ?? "—"} />
            <SummaryCard label="Не проверено" value={roomSummary.worklist?.unchecked ?? "—"} tone="warning" />
            <SummaryCard label="Отсутствует" value={roomSummary.worklist?.missing ?? "—"} tone="danger" />
            <SummaryCard label="Конфликт" value={roomSummary.worklist?.conflict ?? "—"} tone="danger" />
          </div>
          <div className="control-chart-grid">
            <Card size="small" bordered={false}>
              <Text type="secondary">Прогресс по помещениям</Text>
              <Progress type="dashboard" percent={roomTotal ? Math.round((roomCompleted / roomTotal) * 100) : 0} />
            </Card>
            <Card size="small" bordered={false}>
              <Text type="secondary">Проблемные помещения</Text>
              <Progress percent={roomTotal ? Math.round((roomAttention / roomTotal) * 100) : 0} status="exception" />
              <Text type="secondary">{roomAttention} из {roomTotal || 0}</Text>
            </Card>
          </div>
        </article>

        <article className="react-panel control-summary-panel">
          <div className="panel-title-row">
            <div>
              <h2>Сводка по экземплярам</h2>
              <p className="assignment-helper-text">Контроль проверенных, проблемных и требующих внимания экземпляров оборудования.</p>
            </div>
          </div>
          <div className="react-summary-grid">
            <SummaryCard label="Всего" value={itemSummary.total ?? "—"} />
            <SummaryCard label="Не проверено" value={itemSummary.worklist?.unchecked ?? "—"} tone="warning" />
            <SummaryCard label="Без серийника" value={itemSummary.worklist?.no_serial ?? "—"} tone="warning" />
            <SummaryCard label="ПНР требует внимания" value={itemSummary.worklist?.pnr_attention ?? "—"} tone="warning" />
          </div>
          <div className="control-chart-grid">
            <Card size="small" bordered={false}>
              <Text type="secondary">Прогресс по экземплярам</Text>
              <Progress type="dashboard" percent={itemTotal ? Math.round((itemCompleted / itemTotal) * 100) : 0} />
            </Card>
            <Card size="small" bordered={false}>
              <Text type="secondary">Экземпляры с проблемами</Text>
              <Progress percent={itemTotal ? Math.round((itemAttention / itemTotal) * 100) : 0} status="active" />
              <Text type="secondary">{itemAttention} из {itemTotal || 0}</Text>
            </Card>
          </div>
        </article>
      </section>

      <section className="react-grid control-details-grid">
        <article className="react-panel control-timeline-panel">
          <div className="panel-title-row">
            <div>
              <h2>Динамика закрытия помещений</h2>
              <p className="assignment-helper-text">Сколько помещений закрывалось по дням и какими сотрудниками.</p>
            </div>
          </div>
          <RoomCompletionHistogram activity={controlData.completionActivity} />
        </article>
      </section>

      <section className="react-grid control-workspace-grid">
        <article className={`react-panel control-work-panel ${controlLoading && controlData.rooms.length ? "panel-busy" : ""}`}>
          <div className="panel-title-row">
            <div>
              <h2>Рабочие помещения</h2>
              <p className="assignment-helper-text">Помещения с текущими статусами, проблемами и прогрессом проверки.</p>
            </div>
            <div className="control-title-actions">
              <span className="directory-count-chip">{filteredRooms.length}</span>
              <Select
                className="control-filter-select control-filter-select-top"
                value={controlFilters.roomWorklist}
                onChange={(value) => onUpdateControlFilter("roomWorklist", value)}
                options={roomFilters}
              />
            </div>
          </div>
          <div className="assignment-subsection-head control-filter-head">
            <div>
              <h3>Фильтры помещений</h3>
              <p>Сужение выборки по иерархии объекта и рабочему статусу.</p>
            </div>
          </div>
          <div className="filter-grid antd-filter-grid control-filter-grid">
            <Select
              value={controlFilters.floorCode}
              onChange={(value) => onUpdateControlFilter("floorCode", value)}
              options={[{ value: "", label: "Все этажи" }, ...floors.map((floorCode) => ({ value: floorCode, label: floorCode }))]}
            />
            <Select
              value={controlFilters.departmentName}
              onChange={(value) => onUpdateControlFilter("departmentName", value)}
              options={[{ value: "", label: "Все отделения" }, ...departments.map((departmentName) => ({ value: departmentName, label: departmentName }))]}
            />
            <Select
              value={controlFilters.roomId}
              onChange={(value) => onUpdateControlFilter("roomId", value)}
              options={[{ value: "", label: "Все помещения" }, ...roomOptions]}
            />
          </div>
          {controlError ? <p className="error-note">{controlError}</p> : null}
          {controlLoading && !controlData.rooms.length ? <div className="empty-box">Загрузка помещений...</div> : null}
          {!controlLoading && filteredRooms.length === 0 ? <div className="empty-box">Помещений по выбранному фильтру нет.</div> : null}
          {(filteredRooms.length > 0 || (controlLoading && controlData.rooms.length > 0)) ? (
            <div className="control-list">{filteredRooms.map((room) => <RoomCard key={room.room_id} room={room} />)}</div>
          ) : null}
        </article>

        <article className={`react-panel control-work-panel ${controlLoading && controlData.items.length ? "panel-busy" : ""}`}>
          <div className="panel-title-row">
            <div>
              <h2>Проблемные экземпляры</h2>
              <p className="assignment-helper-text">Экземпляры, требующие проверки, корректировки или внимания оператора.</p>
            </div>
            <div className="control-title-actions">
              <span className="directory-count-chip">{filteredItems.length}</span>
              <Select
                className="control-filter-select control-filter-select-top"
                value={controlFilters.itemWorklist}
                onChange={(value) => onUpdateControlFilter("itemWorklist", value)}
                options={ITEM_WORKLIST_OPTIONS}
              />
            </div>
          </div>
          <div className="assignment-subsection-head control-filter-head">
            <div>
              <h3>Фильтры экземпляров</h3>
              <p>Выбор проблемных экземпляров по этажу, отделению, помещению и типу статуса.</p>
            </div>
          </div>
          <div className="filter-grid antd-filter-grid control-filter-grid">
            <Select
              value={controlFilters.floorCode}
              onChange={(value) => onUpdateControlFilter("floorCode", value)}
              options={[{ value: "", label: "Все этажи" }, ...floors.map((floorCode) => ({ value: floorCode, label: floorCode }))]}
            />
            <Select
              value={controlFilters.departmentName}
              onChange={(value) => onUpdateControlFilter("departmentName", value)}
              options={[{ value: "", label: "Все отделения" }, ...departments.map((departmentName) => ({ value: departmentName, label: departmentName }))]}
            />
            <Select
              value={controlFilters.roomId}
              onChange={(value) => onUpdateControlFilter("roomId", value)}
              options={[{ value: "", label: "Все помещения" }, ...roomOptions]}
            />
          </div>
          {controlLoading && !controlData.items.length ? <div className="empty-box">Загрузка экземпляров...</div> : null}
          {!controlLoading && filteredItems.length === 0 ? <div className="empty-box">Экземпляров по выбранному фильтру нет.</div> : null}
          {(filteredItems.length > 0 || (controlLoading && controlData.items.length > 0)) ? (
            <div className="control-list">{filteredItems.map((item) => <ItemCard key={item.planned_item_id} item={item} />)}</div>
          ) : null}
        </article>
      </section>
    </>
  );
}
