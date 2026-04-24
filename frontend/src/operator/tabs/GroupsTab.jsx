import { Button, Input, Select } from "antd";

import { SummaryBadge, SummaryCard, UserAvatar } from "../components.jsx";

export function GroupsTab({
  groupsLoading,
  groupsActionLoading,
  groupsData,
  groupsStatus,
  selectedGroupId,
  selectedGroup,
  groupSummary,
  groupCandidates,
  groupForm,
  groupEditForm,
  onUpdateGroupForm,
  onUpdateGroupEditForm,
  onCreateGroup,
  onUpdateGroup,
  onDeleteGroup,
  onSelectGroup,
}) {
  return (
    <section className="react-grid groups-grid-react">
      <article className="react-panel groups-create-panel">
        <div className="panel-title-row">
          <div>
            <h2>Группы сотрудников</h2>
            <p className="panel-subtitle">
              Объединяйте полевых сотрудников, которые работают по общим помещениям. Общий прогресс считается по
              пересечению назначений всех участников группы.
            </p>
          </div>
        </div>

        <div className="groups-create-card">
          <div className="groups-create-head">
            <h3>Новая группа</h3>
            <SummaryBadge>{groupCandidates.length} кандидатов</SummaryBadge>
          </div>
          <div className="groups-form-grid">
            <Input
              placeholder="Например: Бригада этаж 3"
              value={groupForm.team_name}
              onChange={(event) => onUpdateGroupForm("team_name", event.target.value)}
            />
            <Select
              mode="multiple"
              placeholder="Выберите участников"
              value={groupForm.member_user_ids}
              onChange={(value) => onUpdateGroupForm("member_user_ids", value)}
              options={groupCandidates.map((user) => ({
                value: user.user_id,
                label: `${user.full_name} — ${user.phone || "без телефона"}`,
              }))}
            />
          </div>
          <div className="groups-create-actions">
            <Button type="primary" onClick={onCreateGroup} loading={groupsActionLoading} disabled={!groupForm.team_name.trim() || groupForm.member_user_ids.length < 2}>
              Создать группу
            </Button>
          </div>
        </div>

        {groupsStatus ? <p className="assignment-status-note">{groupsStatus}</p> : null}
        {groupsLoading && !groupsData.length ? <div className="empty-box">Загрузка групп...</div> : null}
        {!groupsLoading && !groupsData.length ? <div className="empty-box">Группы пока не созданы.</div> : null}
        {groupsData.length ? (
          <div className="groups-list">
            {groupsData.map((group) => (
              <button
                key={group.team_id}
                type="button"
                className={`group-directory-card ${group.team_id === selectedGroupId ? "selected" : ""}`}
                onClick={() => onSelectGroup(group.team_id)}
              >
                <div className="group-directory-head">
                  <div>
                    <strong>{group.team_name}</strong>
                    <p>{group.members_count} участников</p>
                  </div>
                  <SummaryBadge>{group.assigned_rooms_count || 0}</SummaryBadge>
                </div>
                <div className="group-directory-meta">
                  <span>Завершено: {group.completed_rooms_count || 0}</span>
                  <span>В работе: {group.in_progress_rooms_count || 0}</span>
                  <span>Не начато: {group.not_started_rooms_count || 0}</span>
                </div>
                <div className="control-badges">
                  {group.members.map((member) => (
                    <SummaryBadge key={member.user_id}>{member.full_name}</SummaryBadge>
                  ))}
                </div>
              </button>
            ))}
          </div>
        ) : null}
      </article>

      <article className="react-panel groups-detail-panel">
        <div className="panel-title-row">
          <div>
            <h2>Карточка группы</h2>
            <p className="panel-subtitle">Редактируйте состав группы и контролируйте общий прогресс по пересекающимся помещениям.</p>
          </div>
        </div>
        {!selectedGroup ? (
          <div className="empty-box">Выберите группу слева.</div>
        ) : (
          <div className="groups-detail-layout">
            <div className="groups-create-card">
              <div className="groups-create-head">
                <h3>Состав группы</h3>
                <SummaryBadge>{selectedGroup.members_count} участников</SummaryBadge>
              </div>
              <div className="groups-form-grid">
                <Input
                  placeholder="Название группы"
                  value={groupEditForm.team_name}
                  onChange={(event) => onUpdateGroupEditForm("team_name", event.target.value)}
                />
                <Select
                  mode="multiple"
                  placeholder="Участники группы"
                  value={groupEditForm.member_user_ids}
                  onChange={(value) => onUpdateGroupEditForm("member_user_ids", value)}
                  options={groupCandidates.map((user) => ({
                    value: user.user_id,
                    label: `${user.full_name} — ${user.phone || "без телефона"}`,
                  }))}
                />
              </div>
              <div className="groups-create-actions">
                <Button type="primary" onClick={onUpdateGroup} loading={groupsActionLoading}>
                  Сохранить состав
                </Button>
                <Button danger onClick={onDeleteGroup} loading={groupsActionLoading}>
                  Удалить группу
                </Button>
              </div>
            </div>

            <div className="react-summary-grid assignment-summary-grid">
              <SummaryCard label="Общие помещения" value={groupSummary.assigned} />
              <SummaryCard label="Завершено" value={groupSummary.completed} tone="success" />
              <SummaryCard label="В работе" value={groupSummary.inProgress} tone="warning" />
              <SummaryCard label="Не начато" value={groupSummary.notStarted} tone="danger" />
            </div>

            <section className="group-members-section">
              <div className="group-members-head">
                <h3>Участники группы</h3>
                <SummaryBadge>{selectedGroup.members.length}</SummaryBadge>
              </div>
              <div className="group-members-grid">
                {selectedGroup.members.map((member) => (
                  <article key={member.user_id} className="group-member-card">
                    <div className="group-member-main">
                      <UserAvatar user={member} />
                      <div>
                        <strong>{member.full_name}</strong>
                        <p>{member.login}</p>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            </section>
          </div>
        )}
      </article>
    </section>
  );
}

export default GroupsTab;
