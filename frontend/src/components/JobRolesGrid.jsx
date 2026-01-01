import React from 'react';

const defaultGridStyle = {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '12px',
    marginBottom: '32px',
};

const JobRolesGrid = ({ jobRoles, selectedGoals = [], handleToggleGoal, styles = {}, singleSelect = false }) => (
    <div style={styles.jobRolesGrid || defaultGridStyle}>
        {jobRoles.map((role) => {
            const isSelected = selectedGoals.includes(role.id);
            return (
                <div
                    key={role.id}
                    style={{
                        ...(styles.jobRoleItem || {}),
                        backgroundColor: isSelected ? '#f3e8ff' : '#f5f5f5',
                        borderColor: isSelected ? '#00D9A3' : '#e0e0e0',
                        borderRadius: 8,
                        borderWidth: 1,
                        borderStyle: 'solid',
                        display: 'flex',
                        alignItems: 'center',
                        padding: 16,
                        gap: 12,
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                    }}
                    onClick={() => handleToggleGoal(role.id)}
                    tabIndex={-1}
                >
                    <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={e => {
                            e.preventDefault();
                            e.stopPropagation();
                            if (singleSelect) {
                                handleToggleGoal(role.id, true);
                            } else {
                                handleToggleGoal(role.id);
                            }
                        }}
                        style={styles.checkbox || { width: 20, height: 20, cursor: 'pointer', flexShrink: 0 }}
                    />
                    <div style={styles.jobRoleInfo || { flex: 1 }}>
                        <div style={styles.jobRoleTitle || { fontSize: 16, fontWeight: 600, color: '#333', marginBottom: 4 }}>{role.title}</div>
                        <div style={styles.jobRoleCategory || { fontSize: 14, color: '#666' }}>{role.category}</div>
                    </div>
                </div>
            );
        })}
    </div>
);

export default JobRolesGrid;
