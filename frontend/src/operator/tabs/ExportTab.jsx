import { Button, Input, Select } from "antd";
import { PRESENCE_FILTER_OPTIONS } from "../constants.js";
import {
  formatDate,
  getCommunicationsLabel,
  getPnrLabel,
  getPresenceLabel,
  getPresenceTone,
  getSerialLabel,
} from "../utils.js";

export function ExportTab({
  exportLoading,
  exportRows,
  exportFilters,
  exportFloors,
  exportDepartments,
  exportRoomOptions,
  filteredExportRows,
  onUpdateExportFilter,
  onRefresh,
}) {
  return (
    <section className="react-panel">
      <div className="panel-title-row">
        <h2>Экспортная таблица</h2>
        <Button type="primary" onClick={onRefresh}>
          Обновить таблицу
        </Button>
      </div>

      <div className="filter-grid export-filter-grid antd-filter-grid">
        <Select value={exportFilters.floorCode} onChange={(value) => onUpdateExportFilter("floorCode", value)} options={[{ value: "", label: "Все этажи" }, ...exportFloors.map((floorCode) => ({ value: floorCode, label: floorCode }))]} />
        <Select value={exportFilters.departmentName} onChange={(value) => onUpdateExportFilter("departmentName", value)} options={[{ value: "", label: "Все отделения" }, ...exportDepartments.map((departmentName) => ({ value: departmentName, label: departmentName }))]} />
        <Select value={exportFilters.roomId} onChange={(value) => onUpdateExportFilter("roomId", value)} options={[{ value: "", label: "Все помещения" }, ...exportRoomOptions]} />
        <Input placeholder="Оборудование" value={exportFilters.equipmentQuery} onChange={(event) => onUpdateExportFilter("equipmentQuery", event.target.value)} />
        <Input placeholder="Серийный номер" value={exportFilters.serialQuery} onChange={(event) => onUpdateExportFilter("serialQuery", event.target.value)} />
        <Select value={exportFilters.presenceStatus} onChange={(value) => onUpdateExportFilter("presenceStatus", value)} options={PRESENCE_FILTER_OPTIONS} />
      </div>

      {exportLoading && !exportRows.length ? <div className="empty-box">Загрузка строк экспорта...</div> : null}
      {!exportLoading && !filteredExportRows.length ? <div className="empty-box">Строк по выбранным фильтрам нет.</div> : null}
      {filteredExportRows.length ? (
        <div className={`export-table-wrap ${exportLoading ? "panel-busy" : ""}`}>
          <table className="export-table-react">
            <thead>
              <tr>
                <th>Этаж</th>
                <th>Отделение</th>
                <th>Помещение</th>
                <th>Позиция</th>
                <th>Оборудование</th>
                <th>Экземпляр</th>
                <th>Наличие</th>
                <th>Серийный номер</th>
                <th>ПНР</th>
                <th>Коммуникации</th>
                <th>Дата проверки</th>
                <th>Сотрудник</th>
              </tr>
            </thead>
            <tbody>
              {filteredExportRows.map((item) => (
                <tr key={item.planned_item_id} className={`export-row-${getPresenceTone(item.current_presence_status)}`}>
                  <td>{item.floor_code || "—"}</td>
                  <td>{item.department_name || "—"}</td>
                  <td>{item.room_code || "—"} — {item.room_name || "—"}</td>
                  <td>{item.position_code}</td>
                  <td>{item.equipment_name}</td>
                  <td>{item.display_label}</td>
                  <td>{getPresenceLabel(item.current_presence_status)}</td>
                  <td>{getSerialLabel(item.serial_number, item.serial_state)}</td>
                  <td>{getPnrLabel(item.pnr_status)}</td>
                  <td>{getCommunicationsLabel(item.communications_status)}</td>
                  <td>{formatDate(item.last_check_at)}</td>
                  <td>{item.last_checked_by_name || "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}
    </section>
  );
}
