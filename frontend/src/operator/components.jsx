import { Alert, Avatar, Button, Card, Form, Input, Modal as AntModal, Select, Space, Statistic, Tag, Typography, Upload } from "antd";
import { UserOutlined } from "@ant-design/icons";

import {
  collectDepartmentRoomIds,
  collectFloorRoomIds,
  countSelection,
  formatDate,
  formatRuPhone,
  getAssignmentStatusLabel,
  getAssignmentStatusTone,
  getCommunicationsLabel,
  getInitials,
  getPnrLabel,
  getPresenceLabel,
  getPresenceTone,
  getProgressPercent,
  getRoleLabel,
  getRoomActivitySummary,
  getRoomProgressClass,
  getSerialLabel,
  getUserStatusLabel,
  getUserStatusTone,
} from "./utils.js";

const { Dragger } = Upload;
const { Title, Text, Paragraph } = Typography;

export function SummaryCard({ label, value, tone = "default" }) {
  const statusMap = {
    default: "#1677ff",
    success: "#52c41a",
    warning: "#faad14",
    danger: "#ff4d4f",
  };
  return <Card size="small" className={`summary-card-react tone-${tone}`} bordered><Statistic title={label} value={value} valueStyle={{ color: statusMap[tone] || statusMap.default, fontSize: 34 }} /></Card>;
}

export function SummaryBadge({ children, tone = "soft" }) {
  const colorMap = { soft: "default", success: "success", warning: "warning", danger: "error" };
  return <Tag color={colorMap[tone] || "default"}>{children}</Tag>;
}

export function Modal({ open, title, subtitle, children, actions }) {
  return (
    <AntModal
      open={open}
      width={720}
      title={
        <Space direction="vertical" size={0}>
          <Text type="secondary">{subtitle}</Text>
          <Title level={4} style={{ margin: 0 }}>
            {title}
          </Title>
        </Space>
      }
      footer={actions}
      closable={false}
      onCancel={() => {}}
      styles={{ body: { maxHeight: "70vh", overflow: "auto" } }}
    >
      <div className="modal-body">{children}</div>
    </AntModal>
  );
}

export function UserAvatar({ user, previewUrl = "", size = "default" }) {
  const src = previewUrl || user?.avatar_url || "";
  const avatarSize = size === "large" ? 88 : 42;
  if (src) return <Avatar src={src} size={avatarSize} shape="circle" />;
  return <Avatar size={avatarSize} icon={<UserOutlined />} shape="circle">{getInitials(user?.full_name)}</Avatar>;
}

export function AvatarDropzone({ label, previewUrl, onFileSelected, helperText = "", compact = false }) {
  return (
    <div className="avatar-dropzone-wrap">
      <Text strong className="avatar-dropzone-label">{label}</Text>
      <Dragger
        multiple={false}
        maxCount={1}
        accept=".jpg,.jpeg,.png,.webp"
        showUploadList={false}
        beforeUpload={(file) => {
          onFileSelected(file);
          return false;
        }}
        className={`avatar-dropzone${compact ? " compact" : ""}`}
      >
        {previewUrl ? <img className="avatar-dropzone-preview" src={previewUrl} alt="Предпросмотр фото" /> : <Paragraph style={{ marginBottom: 0 }}>Перетащите фото или нажмите для выбора</Paragraph>}
      </Dragger>
      {helperText ? <Text type="secondary">{helperText}</Text> : null}
    </div>
  );
}

export function TextField({ label, value, onChange, error, type = "text", placeholder = "", className = "" }) {
  return (
    <Form.Item className={className} label={label} validateStatus={error ? "error" : ""} help={error || ""}>
      <Input type={type} value={value} onChange={onChange} placeholder={placeholder} status={error ? "error" : ""} />
    </Form.Item>
  );
}

export function PasswordField({ label, value, onChange, error, visible, onToggleVisibility, placeholder = "" }) {
  return (
    <Form.Item label={label} validateStatus={error ? "error" : ""} help={error || ""}>
      <Input.Password
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        status={error ? "error" : ""}
        visibilityToggle={{ visible, onVisibleChange: onToggleVisibility }}
      />
    </Form.Item>
  );
}

export function SelectField({ label, value, onChange, error, options, className = "" }) {
  return (
    <Form.Item className={className} label={label} validateStatus={error ? "error" : ""} help={error || ""}>
      <Select value={value} onChange={(nextValue) => onChange({ target: { value: nextValue } })} status={error ? "error" : ""} options={options} />
    </Form.Item>
  );
}

export function LoginScreen({ form, setForm, onSubmit, loading, error, passwordVisible, onTogglePassword }) {
  return (
    <main className="login-screen">
      <Card className="login-card" bordered={false}>
        <Space direction="vertical" size={8} style={{ width: "100%" }}>
          <Text type="secondary">InfoCollect</Text>
          <Title level={2} style={{ marginBottom: 0 }}>
            Вход в систему
          </Title>
          <Paragraph type="secondary">Введите логин и пароль. После авторизации откроется интерфейс в соответствии с ролью пользователя.</Paragraph>
        </Space>
        <Form layout="vertical" className="login-form">
          <div className="login-form-row">
            <Form.Item label="Логин" className="login-form-item">
              <Input
                size="large"
                value={form.login}
                onChange={(event) => setForm((current) => ({ ...current, login: event.target.value }))}
              />
            </Form.Item>
            <Form.Item label="Пароль" className="login-form-item">
              <Input.Password
                size="large"
                value={form.password}
                onChange={(event) => setForm((current) => ({ ...current, password: event.target.value }))}
                visibilityToggle={{ visible: passwordVisible, onVisibleChange: onTogglePassword }}
              />
            </Form.Item>
          </div>
        </Form>
        {error ? <Alert type="error" showIcon message={error} style={{ marginBottom: 16 }} /> : null}
        <Button type="primary" size="large" block onClick={onSubmit} loading={loading} disabled={!form.login || !form.password}>
          Войти
        </Button>
      </Card>
    </main>
  );
}

export function RoomCard({ room }) {
  return (
    <Card className={`control-card room-card-react tone-${getRoomProgressClass(room)}`}>
      <Space direction="vertical" size={10} style={{ width: "100%" }}>
        <div className="control-card-header">
          <div>
            <strong>{room.room_code}</strong>
            <div>{room.room_name}</div>
          </div>
          <SummaryBadge>{room.planned_items_count} поз.</SummaryBadge>
        </div>
        <Text type="secondary">{room.floor_code || "Без этажа"} / {room.department_name || "Без отделения"}</Text>
        <div className="control-badges">
          {room.status_flags?.has_unchecked_items ? <SummaryBadge tone="warning">Не проверено</SummaryBadge> : null}
          {room.status_flags?.has_missing_items ? <SummaryBadge tone="danger">Отсутствует</SummaryBadge> : null}
          {room.status_flags?.has_conflict_items ? <SummaryBadge tone="danger">Конфликт</SummaryBadge> : null}
          {room.status_flags?.has_no_serial_items ? <SummaryBadge>Без серийника</SummaryBadge> : null}
          {room.status_flags?.has_pnr_attention_items ? <SummaryBadge tone="warning">ПНР</SummaryBadge> : null}
        </div>
        <div className="control-card-stats">
          <div>
            <span>Экземпляров</span>
            <strong>{room.total_items_count ?? room.planned_items_count ?? 0}</strong>
          </div>
          <div>
            <span>Проверено</span>
            <strong>{room.checked_items_count ?? 0}</strong>
          </div>
        </div>
      </Space>
    </Card>
  );
}

export function ItemCard({ item }) {
  return (
    <Card className="control-card item-card-react">
      <Space direction="vertical" size={10} style={{ width: "100%" }}>
        <div className="control-card-header">
          <div>
            <strong>{item.position_code} / {item.display_label}</strong>
            <div>{item.equipment_name}</div>
          </div>
          <SummaryBadge tone={getPresenceTone(item.current_presence_status)}>{getPresenceLabel(item.current_presence_status)}</SummaryBadge>
        </div>
        <Text type="secondary">{item.room_code || "Без кода"} / {item.room_name || "Без названия"}</Text>
        <div className="control-badges">
          <SummaryBadge>{getSerialLabel(item.serial_number, item.serial_state)}</SummaryBadge>
          <SummaryBadge>{getPnrLabel(item.pnr_status)}</SummaryBadge>
          <SummaryBadge>{getCommunicationsLabel(item.communications_status)}</SummaryBadge>
        </div>
        <div className="control-card-stats">
          <div>
            <span>Категория</span>
            <strong>{item.category_name || "Не указана"}</strong>
          </div>
          <div>
            <span>Помещение</span>
            <strong>{item.room_code || "—"}</strong>
          </div>
        </div>
        {item.last_checked_by_name ? <Text type="secondary">Последняя проверка: {item.last_checked_by_name} / {formatDate(item.last_check_at)}</Text> : null}
      </Space>
    </Card>
  );
}

export function AssignmentUserCard({ user, selected, onClick }) {
  const showWorkStatus = user.role === "operator";
  return (
    <Card hoverable className={`assignment-user-card ${selected ? "selected" : ""}`} onClick={onClick} bordered={selected}>
      <Space direction="vertical" size={8} style={{ width: "100%" }}>
        <div className="assignment-user-header">
          <div className="assignment-user-main">
            <UserAvatar user={user} size="large" />
            <div className="assignment-user-text">
              <strong>{user.full_name}</strong>
              <div>{getRoleLabel(user.role)}</div>
            </div>
          </div>
          <SummaryBadge tone={showWorkStatus ? getUserStatusTone(user.work_status) : "soft"}>
            {showWorkStatus ? getUserStatusLabel(user.work_status) : getRoleLabel(user.role)}
          </SummaryBadge>
        </div>
        <div className="assignment-user-contact-grid">
          <div className="assignment-user-contact-item">
            <span>Телефон</span>
            <strong>{user.phone ? formatRuPhone(user.phone) : "Не указан"}</strong>
          </div>
          <div className="assignment-user-contact-item">
            <span>Email</span>
            <strong>{user.email || "Не указан"}</strong>
          </div>
        </div>
        {showWorkStatus ? (
          <div className="assignment-user-meta">
            <div>
              <span>Назначено</span>
              <strong>{user.assigned_rooms_count || 0}</strong>
            </div>
            <div>
              <span>Завершено</span>
              <strong>{user.completed_rooms_count || 0}</strong>
            </div>
          </div>
        ) : null}
      </Space>
    </Card>
  );
}

export function RoomCompletionHistogram({ activity }) {
  const days = activity?.days || [];
  if (!days.length) {
    return <div className="empty-box">Закрытых помещений пока нет.</div>;
  }

  const maxValue = Math.max(...days.map((day) => day.total_completed_rooms), 1);
  return (
    <div className="completion-chart-list">
      {days.map((day) => (
        <div key={day.date} className="completion-chart-row">
          <div className="completion-chart-head">
            <strong>{formatDate(`${day.date}T00:00:00`)}</strong>
            <span>{day.total_completed_rooms} помещений</span>
          </div>
          <div className="completion-chart-bar">
            {day.employees.map((employee) => (
              <div
                key={`${day.date}-${employee.user_id || employee.full_name}`}
                className="completion-chart-segment"
                style={{ width: `${(employee.completed_rooms_count / maxValue) * 100}%` }}
                title={`${employee.full_name}: ${employee.completed_rooms_count}`}
              >
                <span>{employee.completed_rooms_count}</span>
              </div>
            ))}
          </div>
          <div className="completion-chart-legend">
            {day.employees.map((employee) => (
              <SummaryBadge key={`${day.date}-legend-${employee.user_id || employee.full_name}`}>
                {employee.full_name}: {employee.completed_rooms_count}
              </SummaryBadge>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

export function UserDirectoryCard({ user, onEdit, onDeactivate, onRestore }) {
  const showWorkStatus = user.role === "operator" && user.is_active;

  return (
    <Card className={`directory-card ${!user.is_active ? "inactive" : ""}`}>
      <Space direction="vertical" size={16} style={{ width: "100%" }}>
        <div className="directory-card-head">
          <div className="directory-card-identity">
            <UserAvatar user={user} size="large" />
            <div className="directory-card-text">
              <strong>{user.full_name}</strong>
              <div className="directory-role-row">
                <SummaryBadge>{getRoleLabel(user.role)}</SummaryBadge>
                {showWorkStatus ? (
                  <SummaryBadge tone={getUserStatusTone(user.work_status)}>
                    {getUserStatusLabel(user.work_status)}
                  </SummaryBadge>
                ) : null}
              </div>
            </div>
          </div>
          {showWorkStatus ? (
            <div className="directory-progress-meta">
              <div>
                <span>Назначено</span>
                <strong>{user.assigned_rooms_count || 0}</strong>
              </div>
              <div>
                <span>Завершено</span>
                <strong>{user.completed_rooms_count || 0}</strong>
              </div>
            </div>
          ) : null}
        </div>

        <div className="directory-contact-grid">
          <div className="directory-contact-item">
            <span>Телефон</span>
            <strong>{user.phone ? formatRuPhone(user.phone) : "Не указан"}</strong>
          </div>
          <div className="directory-contact-item">
            <span>Email</span>
            <strong>{user.email || "Не указан"}</strong>
          </div>
        </div>
        <div className="directory-actions">
          <Button onClick={() => onEdit(user)}>Редактировать</Button>
          {user.is_active ? (
            <Button danger type="primary" className="danger-action-button" onClick={() => onDeactivate(user)}>
              Отключить
            </Button>
          ) : (
            <Button type="primary" onClick={() => onRestore(user)}>
              Восстановить
            </Button>
          )}
        </div>
      </Space>
    </Card>
  );
}

export function AssignmentTree({
  options,
  selection,
  expansion,
  onToggleExpand,
  onToggleRoom,
  onToggleDepartment,
  onToggleFloor,
  onSelectRoom,
  selectedRoomId,
  readOnly = false,
}) {
  if (!options) return <div className="empty-box">Выберите сотрудника слева.</div>;
  if (!options.floors.length) return <div className="empty-box">Для активной версии плана помещений не найдено.</div>;

  return (
    <div className="assignment-tree-react">
      {options.floors.map((floor) => {
        const floorRoomIds = collectFloorRoomIds(floor);
        const floorSelectedCount = countSelection(floorRoomIds, selection);
        const floorAssignedCount = floor.assigned_rooms_count || 0;
        const floorChecked = floorRoomIds.length > 0 && floorSelectedCount === floorRoomIds.length;
        const floorPartial = floorSelectedCount > 0 && floorSelectedCount < floorRoomIds.length;
        const floorKey = `floor:${floor.floor_id || floor.floor_code}`;
        const floorExpanded = expansion[floorKey] ?? false;

        return (
          <article key={floorKey} className="assignment-level-card">
            <div className="assignment-level-header">
              <div className="assignment-checkbox-wrap">
                <input
                  type="checkbox"
                  checked={floorChecked}
                  disabled={readOnly}
                  ref={(node) => {
                    if (node) node.indeterminate = floorPartial;
                  }}
                  onChange={() => onToggleFloor(floor)}
                />
                <button type="button" className="assignment-expand-button" onClick={() => onToggleExpand(floorKey)}>
                  {floorExpanded ? "▾" : "▸"}
                </button>
                <div>
                  <strong>{floor.floor_code || "Без этажа"}</strong>
                  <p>{getAssignmentStatusLabel(floor.progress_status)}</p>
                </div>
              </div>
              <div className="assignment-level-side">
                <SummaryBadge tone={getAssignmentStatusTone(floor.progress_status)}>{getAssignmentStatusLabel(floor.progress_status)}</SummaryBadge>
                <strong>
                  {floor.completed_rooms_count || 0} / {floorAssignedCount}
                </strong>
              </div>
            </div>
            <div className="assignment-progress-bar">
              <span style={{ width: `${getProgressPercent(floor.completed_rooms_count || 0, floorAssignedCount)}%` }} />
            </div>
            {floorExpanded ? (
              <div className="assignment-children">
                {floor.departments.map((department) => {
                  const departmentKey = `department:${department.department_id || `${floorKey}:${department.department_name}`}`;
                  const departmentRoomIds = collectDepartmentRoomIds(department);
                  const departmentSelectedCount = countSelection(departmentRoomIds, selection);
                  const departmentChecked = departmentRoomIds.length > 0 && departmentSelectedCount === departmentRoomIds.length;
                  const departmentPartial = departmentSelectedCount > 0 && departmentSelectedCount < departmentRoomIds.length;
                  const departmentExpanded = expansion[departmentKey] ?? false;
                  const departmentAssignedCount = department.assigned_rooms_count || 0;

                  return (
                    <article key={departmentKey} className="assignment-level-card nested">
                      <div className="assignment-level-header">
                        <div className="assignment-checkbox-wrap">
                          <input
                            type="checkbox"
                            checked={departmentChecked}
                            disabled={readOnly}
                            ref={(node) => {
                              if (node) node.indeterminate = departmentPartial;
                            }}
                            onChange={() => onToggleDepartment(department)}
                          />
                          <button type="button" className="assignment-expand-button" onClick={() => onToggleExpand(departmentKey)}>
                            {departmentExpanded ? "▾" : "▸"}
                          </button>
                          <div>
                            <strong>{department.department_name || "Без отделения"}</strong>
                            <p>{getAssignmentStatusLabel(department.progress_status)}</p>
                          </div>
                        </div>
                        <div className="assignment-level-side">
                          <SummaryBadge tone={getAssignmentStatusTone(department.progress_status)}>{getAssignmentStatusLabel(department.progress_status)}</SummaryBadge>
                          <strong>
                            {department.completed_rooms_count || 0} / {departmentAssignedCount}
                          </strong>
                        </div>
                      </div>
                      <div className="assignment-progress-bar">
                        <span style={{ width: `${getProgressPercent(department.completed_rooms_count || 0, departmentAssignedCount)}%` }} />
                      </div>
                      {departmentExpanded ? (
                        <div className="assignment-children rooms">
                          {department.rooms.map((room) => (
                            <label
                              key={room.room_id}
                              className={`assignment-room-row ${selectedRoomId === room.room_id ? "selected" : ""}`}
                              onClick={() => onSelectRoom?.(room.room_id)}
                            >
                              <span className="assignment-room-main">
                                <input type="checkbox" checked={selection.has(room.room_id)} disabled={readOnly} onChange={() => onToggleRoom(room.room_id)} />
                                <span>
                                  <strong>
                                    {room.room_code} — {room.room_name}
                                  </strong>
                                  <small>
                                    {room.checked_items_count} / {room.total_items_count}
                                  </small>
                                </span>
                              </span>
                              <span className="assignment-room-side">
                                {room.repeat_check_required ? <SummaryBadge tone="warning">Повторная проверка</SummaryBadge> : null}
                                <SummaryBadge tone={getAssignmentStatusTone(room.progress_status)}>{getAssignmentStatusLabel(room.progress_status)}</SummaryBadge>
                              </span>
                            </label>
                          ))}
                        </div>
                      ) : null}
                    </article>
                  );
                })}
              </div>
            ) : null}
          </article>
        );
      })}
    </div>
  );
}

export function AssignmentRoomContext({ roomDetail, loading }) {
  if (loading) {
    return <div className="empty-box">Загрузка деталей помещения...</div>;
  }
  if (!roomDetail) {
    return <div className="empty-box">Выберите помещение, чтобы увидеть состав и последние отметки.</div>;
  }

  return (
    <article className="room-context-panel">
      <div className="panel-title-row">
        <div>
          <h2>{roomDetail.room_code} — {roomDetail.room_name}</h2>
          <p className="assignment-helper-text">{roomDetail.floor_code || "Без этажа"} / {roomDetail.department_name || "Без отделения"}</p>
        </div>
        <SummaryBadge>{roomDetail.positions.length}</SummaryBadge>
      </div>
      <p className="assignment-status-note">{getRoomActivitySummary(roomDetail)}</p>
      <div className="room-context-list">
        {roomDetail.positions.map((position) => (
          <section key={position.planned_position_id} className="room-context-position">
            <div className="room-context-position-header">
              <div>
                <strong>{position.position_code} / {position.equipment_name}</strong>
                {position.model_mark ? <p>{position.model_mark}</p> : null}
              </div>
              <SummaryBadge>{position.items.length}</SummaryBadge>
            </div>
            <div className="room-context-items">
              {position.items.map((item) => (
                <article key={item.planned_item_id} className="room-context-item">
                  <div className="room-context-item-header">
                    <strong>{item.display_label}</strong>
                    <SummaryBadge tone={getPresenceTone(item.current_presence_status)}>{getPresenceLabel(item.current_presence_status)}</SummaryBadge>
                  </div>
                  <div className="control-badges">
                    <SummaryBadge>{getSerialLabel(item.serial_number, item.serial_state)}</SummaryBadge>
                    <SummaryBadge>{getPnrLabel(item.pnr_status)}</SummaryBadge>
                    <SummaryBadge>{getCommunicationsLabel(item.communications_status)}</SummaryBadge>
                  </div>
                  <p className="room-context-meta">
                    {item.last_checked_by_name ? `${item.last_checked_by_name} / ${formatDate(item.last_check_at)}` : "Отметок пока нет"}
                  </p>
                </article>
              ))}
            </div>
          </section>
        ))}
      </div>
    </article>
  );
}
