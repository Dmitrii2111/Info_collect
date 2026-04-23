import { SummaryBadge, SummaryCard } from "../components.jsx";

export function GroupsTab({
  groupsLoading,
  groupsData,
  groupsStatus,
  selectedGroupId,
  selectedGroup,
  groupSummary,
  onSelectGroup,
}) {
  return (
    <section className="react-grid">
      <article className={`react-panel ${groupsLoading && groupsData.length ? "panel-busy" : ""}`}>
        <div className="panel-title-row">
          <h2>Группы сотрудников</h2>
        </div>
        <p className="assignment-helper-text">Общие помещения считаются только по пересечению назначений всех участников группы.</p>
        {groupsStatus ? <p className="assignment-status-note">{groupsStatus}</p> : null}
        {groupsLoading && !groupsData.length ? <div className="empty-box">Загрузка групп...</div> : null}
        {!groupsLoading && !groupsData.length ? <div className="empty-box">Группы пока не созданы.</div> : null}
        {groupsData.length ? (
          <div className="assignment-users-list">
            {groupsData.map((group) => (
              <button key={group.team_id} type="button" className={`assignment-user-card ${group.team_id === selectedGroupId ? "selected" : ""}`} onClick={() => onSelectGroup(group.team_id)}>
                <div className="assignment-user-header">
                  <div>
                    <strong>{group.team_name}</strong>
                    <p>{group.members_count} участников</p>
                  </div>
                  <SummaryBadge>{group.assigned_rooms_count || 0}</SummaryBadge>
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

      <article className="react-panel">
        <div className="panel-title-row">
          <h2>Сводка группы</h2>
        </div>
        {!selectedGroup ? (
          <div className="empty-box">Выберите группу слева.</div>
        ) : (
          <>
            <div className="react-summary-grid assignment-summary-grid">
              <SummaryCard label="Общие помещения" value={groupSummary.assigned} />
              <SummaryCard label="Завершено" value={groupSummary.completed} tone="success" />
              <SummaryCard label="В работе" value={groupSummary.inProgress} tone="warning" />
              <SummaryCard label="Не начато" value={groupSummary.notStarted} tone="danger" />
            </div>
            <div className="control-badges">
              {selectedGroup.members.map((member) => (
                <SummaryBadge key={member.user_id}>{member.full_name}</SummaryBadge>
              ))}
            </div>
          </>
        )}
      </article>
    </section>
  );
}
