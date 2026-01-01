import React from 'react';

const gridStyleDefault = {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '12px',
    marginBottom: '32px',
};

const CoursesGrid = ({ filteredCourses, selectedCourses, handleToggleCourse, getCourseCode, styles = {} }) => (
    <div style={styles.courseList || gridStyleDefault}>
        {filteredCourses.length === 0 ? (
            <p style={styles.noResults || { textAlign: 'center', padding: '40px', color: '#999', fontSize: '16px' }}>No courses found</p>
        ) : (
            filteredCourses.map((course) => {
                const isSelected = selectedCourses.includes(course.id);
                const courseCode = getCourseCode(course.description);
                const credits = course.credits || course.workload || 0;

                return (
                    <div
                        key={course.id}
                        style={{
                            ...(styles.courseItem || {}),
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
                        onClick={() => handleToggleCourse(course.id)}
                        tabIndex={-1}
                    >
                        <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={e => { e.preventDefault(); e.stopPropagation(); handleToggleCourse(course.id); }}
                            style={styles.checkbox || { width: 20, height: 20, cursor: 'pointer', flexShrink: 0 }}
                        />
                        <div style={styles.courseInfo || { flex: 1 }}>
                            <div style={styles.courseName || { fontSize: 16, fontWeight: 600, color: '#333', marginBottom: 4 }}>{course.name}</div>
                            {courseCode && (
                                <div style={styles.courseCode || { fontSize: 14, color: '#666' }}>{courseCode}</div>
                            )}
                        </div>
                        <div style={styles.credits || { fontSize: 14, color: '#666', fontWeight: 500, marginLeft: 16 }}>{credits} cr</div>
                    </div>
                );
            })
        )}
    </div>
);

export default CoursesGrid;
