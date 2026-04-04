const mockActivity = [
  { id: 1, initials: 'AJ', message: 'Course needs review before publishing', time: '2 days ago' },
  { id: 2, initials: 'BK', message: 'New enrollment submitted for review', time: '3 days ago' },
  { id: 3, initials: 'CL', message: 'Enrollment form updated to V2', time: '4 days ago' },
  { id: 4, initials: 'DM', message: 'Course published successfully', time: '1 week ago' },
]

export function OrgActivityFeed() {
  return (
    <aside className="org-activity-feed" aria-label="Recent activity">
      <div className="section-heading">
        <p className="section-heading__eyebrow">Activity</p>
        <h2>Recent updates</h2>
      </div>
      <ul className="org-activity-feed__list" role="list">
        {mockActivity.map((item) => (
          <li key={item.id} className="org-activity-feed__item">
            <span className="org-activity-feed__avatar" aria-hidden="true">
              {item.initials}
            </span>
            <div className="org-activity-feed__body">
              <p className="org-activity-feed__message">{item.message}</p>
              <span className="org-activity-feed__time">{item.time}</span>
            </div>
          </li>
        ))}
      </ul>
    </aside>
  )
}
