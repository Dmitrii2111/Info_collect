import {
  AssignmentRoomContext,
  AssignmentTree,
  AssignmentUserCard,
  SummaryCard,
} from "../components.jsx";

export function AssignmentsTab({
  auth,
  assignmentUsers,
  userSummary,
  selectedUserId,
  selectedAssignmentUser,
  onSelectUser,
  assignmentOptions,
  assignmentSelection,
  assignmentExpansion,
  selectedAssignmentRoomId,
  assignmentsLoading,
  savingAssignments,
  assignmentError,
  assignmentStatus,
  selectedRoomDetail,
  assignmentRoomLoading,
  onStartAssignmentSave,
  onToggleExpand,
  onToggleRoom,
  onToggleDepartment,
  onToggleFloor,
  onSelectRoom,
}) {
  const isFieldWorker = auth?.role === "field_worker";

  return (
    <section className={`react-grid assignments-grid-react ${isFieldWorker ? "assignments-single-column" : ""}`}>
      {!isFieldWorker ? (
        <article className="react-panel assignment-users-panel">
          <div className="panel-title-row">
            <div>
              <h2>Исполнители</h2>
              <p className="assignment-helper-text">Выберите сотрудника, чтобы управлять назначенными помещениями и следить за прогрессом.</p>
            </div>
          </div>
          <div className="react-summary-grid assignment-summary-grid">
            <SummaryCard label="Всего сотрудников" value={userSummary.activeCount} />
            <SummaryCard label="В работе" value={userSummary.inProgress} tone="success" />
            <SummaryCard label="Свободны" value={userSummary.available} tone="warning" />
            <SummaryCard label="Неактивны" value={userSummary.inactiveCount} tone="danger" />
          </div>
          <div className="directory-section-head assignment-users-head">
            <div>
              <h3>Активные сотрудники</h3>
              <p>Список исполнителей, доступных для выдачи помещений и работы по объекту.</p>
            </div>
            <span className="directory-count-chip">{assignmentUsers.length}</span>
          </div>
          <div className="assignment-users-list">
            {assignmentUsers.map((user) => (
              <AssignmentUserCard
                key={user.user_id}
                user={user}
                selected={user.user_id === selectedUserId}
                onClick={() => onSelectUser(user.user_id)}
              />
            ))}
          </div>
        </article>
      ) : null}

      <article className={`react-panel assignment-work-panel ${assignmentsLoading && assignmentOptions ? "panel-busy" : ""}`}>
        <div className="panel-title-row">
          <div>
            <h2>{isFieldWorker ? "Мои назначения" : "Назначения"}</h2>
            <p className="assignment-helper-text">
              {selectedAssignmentUser ? `Назначения сотрудника: ${selectedAssignmentUser.full_name}` : "Выберите сотрудника слева."}
            </p>
          </div>
          {!isFieldWorker ? (
            <button type="button" onClick={onStartAssignmentSave} disabled={!selectedUserId || savingAssignments}>
              {savingAssignments ? "Сохраняю..." : "Сохранить назначения"}
            </button>
          ) : null}
        </div>
        {assignmentOptions ? (
          <div className="react-summary-grid assignment-summary-grid">
            <SummaryCard label="Назначено помещений" value={assignmentOptions.progress_summary?.assigned_rooms_count || 0} />
            <SummaryCard label="Завершено" value={assignmentOptions.progress_summary?.completed_rooms_count || 0} tone="success" />
            <SummaryCard label="В работе" value={assignmentOptions.progress_summary?.in_progress_rooms_count || 0} tone="warning" />
            <SummaryCard label="Не начато" value={assignmentOptions.progress_summary?.not_started_rooms_count || 0} tone="danger" />
          </div>
        ) : null}
        {assignmentError ? <p className="error-note">{assignmentError}</p> : null}
        {assignmentStatus ? <p className="assignment-status-note">{assignmentStatus}</p> : null}

        <div className="assignment-workspace">
          <section className="assignment-tree-shell">
            <div className="assignment-subsection-head">
              <div>
                <h3>Дерево назначений</h3>
                <p>
                  {isFieldWorker
                    ? "Назначенные помещения с текущими статусами и прогрессом по проверке."
                    : "Этажи, отделения и помещения для назначения выбранному сотруднику."}
                </p>
              </div>
            </div>
            {assignmentsLoading && !assignmentOptions ? (
              <div className="empty-box">Загрузка назначений...</div>
            ) : (
              <AssignmentTree
                options={assignmentOptions}
                selection={assignmentSelection}
                expansion={assignmentExpansion}
                onToggleExpand={onToggleExpand}
                onToggleRoom={onToggleRoom}
                onToggleDepartment={onToggleDepartment}
                onToggleFloor={onToggleFloor}
                onSelectRoom={onSelectRoom}
                selectedRoomId={selectedAssignmentRoomId}
                readOnly={isFieldWorker}
              />
            )}
          </section>

          <section className="assignment-context-shell">
            <div className="assignment-subsection-head">
              <div>
                <h3>Контекст помещения</h3>
                <p>Состав помещения, последние отметки и текущее состояние экземпляров оборудования.</p>
              </div>
            </div>
            <AssignmentRoomContext roomDetail={selectedRoomDetail} loading={assignmentRoomLoading} />
          </section>
        </div>
      </article>
    </section>
  );
}
