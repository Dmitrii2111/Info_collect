import { Button, Input, Select } from "antd";

import { PRESENCE_FILTER_OPTIONS } from "../constants.js";
import {
  buildExportCsv,
  formatDate,
  getCommunicationsLabel,
  getExportSummary,
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
  onResetFilters,
  onExportCsv,
  onRefresh,
}) {
  const summary = getExportSummary(filteredExportRows);

  return (
    <section className="react-panel export-panel">
      <div className="panel-title-row export-title-row">
        <div>
          <h2>Экспортная таблица</h2>
          <p className="panel-subtitle">
            Итоговая выборка по экземплярам оборудования с фильтрацией и выгрузкой в CSV.
          </p>
        </div>
        <div className="panel-actions">
          <Button onClick={onResetFilters}>Сбросить фильтры</Button>
          <Button onClick={onRefresh}>Обновить таблицу</Button>
          <Button
            type="primary"
            onClick={() => onExportCsv(buildExportCsv(filteredExportRows))}
            disabled={!filteredExportRows.length}
          >
            Выгрузить CSV
          </Button>
        </div>
      </div>

      <div className="summary-strip export-summary-strip">
        <article className="summary-chip">
          <span>Строк в выборке</span>
          <strong>{summary.total}</strong>
        </article>
        <article className="summary-chip success">
          <span>С отметками</span>
          <strong>{summary.checked}</strong>
        </article>
        <article className="summary-chip danger">
          <span>Проблемные</span>
          <strong>{summary.problem}</strong>
        </article>
        <article className="summary-chip soft">
          <span>С серийным номером</span>
          <strong>{summary.withSerial}</strong>
        </article>
      </div>

      <div className="filter-grid export-filter-grid antd-filter-grid">
        <div className="filter-cell">
          <Select
            value={exportFilters.floorCode}
            onChange={(value) => onUpdateExportFilter("floorCode", value)}
            options={[
              { value: "", label: "Все этажи" },
              ...exportFloors.map((floorCode) => ({ value: floorCode, label: floorCode })),
            ]}
          />
        </div>

        <div className="filter-cell">
          <Select
            value={exportFilters.departmentName}
            onChange={(value) => onUpdateExportFilter("departmentName", value)}
            options={[
              { value: "", label: "Все отделения" },
              ...exportDepartments.map((departmentName) => ({
                value: departmentName,
                label: departmentName,
              })),
            ]}
          />
        </div>

        <div className="filter-cell">
          <Select
            value={exportFilters.roomId}
            onChange={(value) => onUpdateExportFilter("roomId", value)}
            options={[{ value: "", label: "Все помещения" }, ...exportRoomOptions]}
          />
        </div>

        <div className="filter-cell">
          <Input
            placeholder="Оборудование, позиция, экземпляр"
            value={exportFilters.equipmentQuery}
            onChange={(event) => onUpdateExportFilter("equipmentQuery", event.target.value)}
          />
        </div>

        <div className="filter-cell">
          <Input
            placeholder="Серийный номер"
            value={exportFilters.serialQuery}
            onChange={(event) => onUpdateExportFilter("serialQuery", event.target.value)}
          />
        </div>

        <div className="filter-cell">
          <Select
            value={exportFilters.presenceStatus}
            onChange={(value) => onUpdateExportFilter("presenceStatus", value)}
            options={PRESENCE_FILTER_OPTIONS}
          />
        </div>
      </div>

      <div className="export-meta-row">
        <span>Всего строк в плане: {exportRows.length}</span>
        <span>В текущей выборке: {filteredExportRows.length}</span>
      </div>

      {exportLoading && !exportRows.length ? (
        <div className="empty-box">Загрузка строк экспорта...</div>
      ) : null}
      {!exportLoading && !filteredExportRows.length ? (
        <div className="empty-box">Строк по выбранным фильтрам нет.</div>
      ) : null}

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
                <tr
                  key={item.planned_item_id}
                  className={`export-row-${getPresenceTone(item.current_presence_status)}`}
                >
                  <td>{item.floor_code || "—"}</td>
                  <td>{item.department_name || "—"}</td>
                  <td>
                    {item.room_code || "—"} — {item.room_name || "—"}
                  </td>
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

export default ExportTab;
