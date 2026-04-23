import { ROLE_OPTIONS } from "../constants.js";
import {
  AvatarDropzone,
  PasswordField,
  SelectField,
  SummaryCard,
  TextField,
  UserDirectoryCard,
} from "../components.jsx";
import { validateUserForm } from "../utils.js";

export function UsersTab({
  createForm,
  createErrors,
  createAvatarPreview,
  createPasswordVisible,
  userActionLoading,
  usersStatus,
  directorySummary,
  activeDirectoryUsers,
  inactiveDirectoryUsers,
  showInactiveUsers,
  onToggleInactiveUsers,
  onUpdateCreateForm,
  onToggleCreatePassword,
  onSetCreateAvatarFile,
  onCreateUser,
  onEditUser,
  onDeactivateUser,
  onRestoreUser,
}) {
  const createValidationErrors = validateUserForm(createForm, { requirePassword: true });
  const createDisabled = userActionLoading || Object.keys(createValidationErrors).length > 0;

  return (
    <section className="react-grid users-grid-react">
      <section className="react-panel users-form-panel">
        <div className="panel-title-row">
          <div>
            <h2>Новый сотрудник</h2>
            <p className="assignment-helper-text">
              Создание учетной записи сотрудника с ролью, контактами и фотографией профиля.
            </p>
          </div>
          <button type="button" onClick={onCreateUser} disabled={createDisabled}>
            {userActionLoading ? "Создаю..." : "Создать сотрудника"}
          </button>
        </div>
        <div className="users-create-layout">
          <div className="users-create-main">
            <div className="form-grid-react">
              <TextField label="Логин" value={createForm.login} onChange={(event) => onUpdateCreateForm("login", event.target.value)} error={createErrors.login} />
              <PasswordField
                label="Пароль"
                value={createForm.password}
                onChange={(event) => onUpdateCreateForm("password", event.target.value)}
                error={createErrors.password}
                visible={createPasswordVisible}
                onToggleVisibility={onToggleCreatePassword}
              />
              <TextField label="Фамилия" value={createForm.last_name} onChange={(event) => onUpdateCreateForm("last_name", event.target.value)} error={createErrors.last_name} />
              <TextField label="Имя" value={createForm.first_name} onChange={(event) => onUpdateCreateForm("first_name", event.target.value)} error={createErrors.first_name} />
              <TextField label="Отчество" value={createForm.middle_name} onChange={(event) => onUpdateCreateForm("middle_name", event.target.value)} error={createErrors.middle_name} />
              <TextField label="Телефон" value={createForm.phone} onChange={(event) => onUpdateCreateForm("phone", event.target.value)} error={createErrors.phone} placeholder="+7XXXXXXXXXX" />
              <TextField label="Email" value={createForm.email} onChange={(event) => onUpdateCreateForm("email", event.target.value)} error={createErrors.email} className="field-span-2" />
              <SelectField label="Роль" value={createForm.role} onChange={(event) => onUpdateCreateForm("role", event.target.value)} error={createErrors.role} className="field-span-2" options={ROLE_OPTIONS} />
            </div>
          </div>
          <aside className="users-create-side">
            <AvatarDropzone
              label="Фото сотрудника"
              previewUrl={createAvatarPreview}
              onFileSelected={onSetCreateAvatarFile}
              helperText="Фото необязательно. Поддерживаются JPG, PNG и WEBP."
            />
            <div className="users-create-note">
              <strong>Что будет создано</strong>
              <p>
                Учетная запись с доступом по роли, контактными данными и аватаром для операторской и мобильной панели.
              </p>
            </div>
          </aside>
        </div>
        {usersStatus ? <p className="assignment-status-note">{usersStatus}</p> : null}
      </section>

      <section className="react-panel users-directory-panel">
        <div className="panel-title-row">
          <div>
            <h2>Каталог сотрудников</h2>
            <p className="assignment-helper-text">
              Активные и архивные учетные записи с быстрым переходом к редактированию и восстановлению.
            </p>
          </div>
          <span className="status-chip subtle">Актуально</span>
        </div>
        <div className="react-summary-grid assignment-summary-grid">
          <SummaryCard label="Всего сотрудников" value={directorySummary.total} />
          <SummaryCard label="В работе" value={directorySummary.inProgress} tone="success" />
          <SummaryCard label="Свободны" value={directorySummary.available} tone="warning" />
          <SummaryCard label="Неактивны" value={directorySummary.inactive} tone="danger" />
        </div>

        <div className="directory-section-head">
          <div>
            <h3>Активные сотрудники</h3>
            <p>Рабочий каталог учетных записей, доступных для назначений и входа в систему.</p>
          </div>
          <span className="directory-count-chip">{activeDirectoryUsers.length}</span>
        </div>

        <div className="directory-list">
          {activeDirectoryUsers.length ? (
            activeDirectoryUsers.map((user) => (
              <UserDirectoryCard key={user.user_id} user={user} onEdit={onEditUser} onDeactivate={onDeactivateUser} onRestore={onRestoreUser} />
            ))
          ) : (
            <div className="empty-box">Активных сотрудников пока нет.</div>
          )}

          {inactiveDirectoryUsers.length ? (
            <section className="inactive-group-wrap">
              <button type="button" className="inactive-toggle-button" onClick={onToggleInactiveUsers}>
                {showInactiveUsers ? "▾" : "▸"} Неактивные сотрудники ({inactiveDirectoryUsers.length})
              </button>
              {showInactiveUsers
                ? inactiveDirectoryUsers.map((user) => (
                    <UserDirectoryCard key={user.user_id} user={user} onEdit={onEditUser} onDeactivate={onDeactivateUser} onRestore={onRestoreUser} />
                  ))
                : null}
            </section>
          ) : null}
        </div>
      </section>
    </section>
  );
}
