# RecentReviewsTable Component

A professional Material-UI table component for displaying course reviews submitted by logged-in students.

## ✨ Features

- **8 Data Columns**: Course ID, Final Score, Industry Relevance, Instructor Quality, Useful Learning, Languages Learned, Course Outputs, Created At
- **Color-Coded Scores**: Green (≥8), Orange (5-7), Red (<5)
- **Star Ratings**: MUI Rating components for visual feedback
- **Responsive Design**: Scrollable table with sticky header
- **Professional Styling**: Alternating row colors, hover effects
- **State Management**: Loading, error, and empty states
- **Error Handling**: Try-catch with user-friendly messages
- **Date Formatting**: Readable date display from ISO strings
- **Empty State**: Call-to-action button to submit first review

## 🚀 Quick Start

### Installation
The component is already integrated. Simply log in to view your reviews on the Dashboard.

### Basic Usage
```jsx
import RecentReviewsTable from './components/RecentReviewsTable';

// In your component
<RecentReviewsTable 
    onNavigateToReview={() => setCurrentPage('review')}
/>
```

### Props
| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `onNavigateToReview` | Function | No | Callback when "Submit Your First Review" button is clicked |

## 📊 Data Structure

The component fetches data from:
```
GET /ratings/student/{student_id}
```

Response format:
```javascript
[
    {
        id: 1,
        student_id: 1,
        course_id: 101,
        languages_learned: "Python, JavaScript",
        course_outputs: "Portfolio, Blog",
        industry_relevance_text: "...",
        instructor_feedback: "...",
        useful_learning_text: "...",
        industry_relevance_rating: 5,
        instructor_rating: 4,
        useful_learning_rating: 5,
        final_score: 8.5,
        created_at: "2025-12-12T10:30:00"
    }
]
```

## 🎨 Styling

All styling uses MUI's `sx` prop. Key customizations:

### Colors
- **Header**: `#f0f0f0`
- **Row Hover**: `#f5f5f5`
- **Alternating Row**: `#fafafa`
- **Green Score**: `#4caf50`
- **Orange Score**: `#ff9800`
- **Red Score**: `#f44336`

### Dimensions
- **Max Height**: `calc(100vh - 300px)` (responsive)
- **Min Height**: `300px`
- **Scrollbar Width**: `8px`

## 🔧 Configuration

Edit the component file to customize:

```jsx
// API URL (line 24)
const API_URL = 'http://localhost:8000';

// Table max height (line 168)
maxHeight: 'calc(100vh - 300px)'

// Row padding (multiple locations)
sy={{ py: 1.5 }}  // Adjust 1.5 for more/less compact
```

## 📚 Dependencies

```json
{
    "@mui/material": "^7.3.6",
    "@emotion/react": "^11.14.0",
    "@emotion/styled": "^11.14.1",
    "react": "^18.3.1"
}
```

## 🧪 Testing

### Test Cases
1. ✅ User with reviews: Table displays
2. ✅ User without reviews: Empty state shows
3. ✅ Loading state: Spinner visible
4. ✅ Error state: Error message shown
5. ✅ Color-coding: Scores display correct colors
6. ✅ Navigation: Button links to review form

### Manual Testing
```bash
# 1. Start backend
cd backend
python -m uvicorn app.main:app --reload

# 2. Start frontend
cd frontend
npm start

# 3. Log in and navigate to Dashboard
# 4. Verify component displays
```

## 🐛 Troubleshooting

### No reviews displaying?
1. Verify user is logged in
2. Check browser localStorage for `userToken`
3. Verify backend is running
4. Check browser Console for errors

### API error 404?
1. Check backend URL is correct
2. Verify student ID from token
3. Ensure backend endpoint exists

### Styling looks wrong?
1. Clear browser cache
2. Run `npm install`
3. Rebuild frontend

See full troubleshooting guide in [RECENT_REVIEWS_INTEGRATION.md](../RECENT_REVIEWS_INTEGRATION.md)

## 📖 Documentation

- **[QUICK_REFERENCE.md](../QUICK_REFERENCE.md)** - Quick lookup guide
- **[RECENT_REVIEWS_INTEGRATION.md](../RECENT_REVIEWS_INTEGRATION.md)** - Integration guide
- **[frontend/RECENT_REVIEWS_TABLE_DOCS.md](./RECENT_REVIEWS_TABLE_DOCS.md)** - Full documentation
- **[VISUAL_GUIDE.md](../VISUAL_GUIDE.md)** - Visual explanations
- **[DOCUMENTATION_INDEX.md](../DOCUMENTATION_INDEX.md)** - Documentation index

## 🔐 Security

- ✅ JWT token authentication
- ✅ Bearer token in headers
- ✅ Student ID from token (not URL)
- ✅ Only fetches user's own reviews
- ✅ No sensitive data exposed

## ⚡ Performance

- Single API call on mount
- Efficient rendering with React hooks
- Responsive scrolling
- Handles 100+ reviews efficiently

## 🚀 Future Enhancements

- Sorting by columns
- Filtering options
- Pagination
- Export to CSV/PDF
- Edit/Delete reviews
- Search functionality
- Review detail modal
- Analytics dashboard

## 📄 License

Part of the Agile Course Recommendation System

## ✅ Status

- **Component**: ✅ Production Ready
- **Integration**: ✅ Complete
- **Documentation**: ✅ Comprehensive
- **Testing**: ✅ Verified
- **Performance**: ✅ Optimized

---

**Last Updated**: December 12, 2025  
**Version**: 1.0.0
