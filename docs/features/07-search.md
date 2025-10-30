# Global Search Feature

## Overview

The Global Search feature allows users to quickly find targets, findings, payloads, and notes from anywhere in the dashboard. It features a beautiful command palette-style modal with keyboard shortcuts and real-time search.

---

## Features

### ✅ Implemented

1. **Global Keyboard Shortcut**
   - `Cmd+K` (Mac) or `Ctrl+K` (Windows/Linux)
   - Works from any dashboard page
   - Opens search modal instantly

2. **Real-time Search**
   - Searches as you type (300ms debounce)
   - Minimum 2 characters to trigger search
   - Loading indicator during search

3. **Multi-Entity Search**
   - **Targets**: Searches name, URL, and platform
   - **Findings**: Searches title and description (markdown)
   - **Payloads**: Searches title, content, and category
   - **Notes**: Searches title only (content is encrypted)

4. **Grouped Results**
   - Results organized by entity type
   - Up to 5 results per category
   - Color-coded icons for each type

5. **Keyboard Navigation**
   - `↑` / `↓` - Navigate through results
   - `Enter` - Open selected result
   - `ESC` - Close modal
   - Visual highlight on selected result

6. **Click Navigation**
   - Click any result to navigate
   - Results link to detail pages

7. **Dark Mode Support**
   - Fully styled for both light and dark themes
   - Backdrop blur effect

8. **Empty States**
   - Before search: Helpful prompt
   - No results: Friendly "no results" message
   - Shows query in error message

9. **Mobile Support**
   - Search accessible from mobile menu
   - Responsive modal design

---

## Technical Implementation

### API Endpoint

**Route**: `GET /api/search?q={query}`

**Authentication**: Required (user must be logged in)

**Response Format**:
```json
{
  "results": {
    "targets": [...],
    "findings": [...],
    "payloads": [...],
    "notes": [...]
  },
  "totalCount": 12,
  "query": "xss"
}
```

**Search Logic**:
- Uses Supabase `ilike` operator (case-insensitive LIKE)
- Searches multiple columns per table
- User-scoped (only returns user's own data)
- Ordered by `created_at DESC`
- Limited to 5 results per entity type

### Components

**1. SearchModal** (`components/ui/SearchModal.tsx`)
- Client component
- Manages search state and keyboard navigation
- Renders grouped results
- Handles navigation to results

**2. DashboardHeader** (`components/features/dashboard/DashboardHeader.tsx`)
- Renders search button in header
- Registers global keyboard shortcut
- Opens/closes search modal

### Database Queries

```sql
-- Example: Searching targets
SELECT id, name, url, platform, status, created_at
FROM targets
WHERE user_id = $1
  AND (name ILIKE '%query%' OR url ILIKE '%query%' OR platform ILIKE '%query%')
ORDER BY created_at DESC
LIMIT 5;
```

---

## User Experience

### Opening Search

**Desktop**:
1. Press `Cmd+K` (Mac) or `Ctrl+K` (Windows/Linux)
2. Or click the search bar in the header

**Mobile**:
1. Tap the mobile menu (hamburger icon)
2. Tap "Search"

### Searching

1. Type at least 2 characters
2. Results appear in real-time (300ms debounce)
3. Results are grouped by type:
   - 🎯 **Targets** - Purple icon
   - ⚠️ **Findings** - Color by severity (red/orange/yellow/blue)
   - 💉 **Payloads** - Green icon
   - 🔒 **Notes** - Blue icon

### Navigating Results

**Keyboard**:
- `↑` / `↓` - Move selection up/down
- `Enter` - Open selected result
- `ESC` - Close search

**Mouse**:
- Click any result to open it
- Click backdrop to close

### Result Display

Each result shows:
- **Icon**: Type-specific icon with color
- **Title**: Main title/name
- **Subtitle**: Additional context (URL, severity, category, etc.)
- **Badge**: Status or metadata (for targets)

---

## Search Coverage

| Entity    | Searchable Fields                          | Result Limit |
|-----------|-------------------------------------------|--------------|
| Targets   | name, url, platform                       | 5            |
| Findings  | title, description_md                     | 5            |
| Payloads  | title, content, category                  | 5            |
| Notes     | title (content is encrypted client-side)  | 5            |

---

## Performance

### Optimizations

1. **Debouncing**: 300ms delay before search triggers
2. **Minimum Query Length**: 2 characters (prevents broad searches)
3. **Result Limits**: Max 5 per entity type (20 total)
4. **Indexed Columns**: Database indexes on searchable fields (recommended)
5. **Client-side State**: Results cached during modal session

### Database Indexes

Recommended indexes for optimal performance:

```sql
-- Targets
CREATE INDEX idx_targets_name ON targets (name);
CREATE INDEX idx_targets_url ON targets (url);
CREATE INDEX idx_targets_user_id ON targets (user_id);

-- Findings
CREATE INDEX idx_findings_title ON findings (title);
CREATE INDEX idx_findings_user_id ON findings (user_id);

-- Payloads
CREATE INDEX idx_payloads_title ON payloads (title);
CREATE INDEX idx_payloads_category ON payloads (category);
CREATE INDEX idx_payloads_user_id ON payloads (user_id);

-- Notes
CREATE INDEX idx_notes_title ON notes (title);
CREATE INDEX idx_notes_user_id ON notes (user_id);
```

---

## Security

### Authorization

- All searches are user-scoped (`WHERE user_id = auth.uid()`)
- Users can only search their own data
- No cross-user data leakage

### Input Validation

- Query length: 2-255 characters
- Special characters are SQL-escaped by Supabase
- No SQL injection risk (parameterized queries)

### Encrypted Data

- Notes content is encrypted client-side
- Search only works on note titles (plaintext)
- Content is never sent to server in plaintext

---

## Future Enhancements

### Planned (Phase 2+)

1. **Advanced Filters**
   - Filter by date range
   - Filter by severity (findings)
   - Filter by status (targets)
   - Filter by category (payloads)

2. **Full-Text Search**
   - PostgreSQL full-text search (tsvector)
   - Better ranking algorithm
   - Fuzzy matching

3. **Search History**
   - Recent searches saved
   - Quick access to frequent searches

4. **Search Suggestions**
   - Autocomplete suggestions
   - Popular searches

5. **Advanced Operators**
   - `severity:high` - Filter by field
   - `"exact phrase"` - Exact match
   - `target:example.com` - Scoped search

6. **Search Shortcuts**
   - `/t` - Jump to targets
   - `/f` - Jump to findings
   - `/p` - Jump to payloads
   - `/n` - Jump to notes

7. **Result Previews**
   - Show snippet of matching content
   - Highlight search terms

8. **Export Results**
   - Export search results to CSV/JSON

---

## Accessibility

### Keyboard Support

- ✅ Full keyboard navigation
- ✅ Focus management (input auto-focused)
- ✅ Screen reader labels (aria-labels)
- ✅ Keyboard shortcuts displayed

### Visual Accessibility

- ✅ High contrast colors
- ✅ Clear focus indicators
- ✅ Readable font sizes
- ✅ Dark mode support

---

## Testing

### Manual Testing

1. **Test keyboard shortcuts**:
   - Press `Cmd+K` / `Ctrl+K` from different pages
   - Verify modal opens

2. **Test search functionality**:
   - Search for existing targets, findings, payloads, notes
   - Verify results appear
   - Try partial matches (e.g., "xss" matches "XSS Reflected")

3. **Test navigation**:
   - Use arrow keys to navigate results
   - Press Enter to open selected result
   - Click results to open
   - Press ESC to close

4. **Test edge cases**:
   - Search with 1 character (should not trigger)
   - Search with no results (should show "no results")
   - Search with special characters (e.g., `@`, `%`, `_`)

5. **Test mobile**:
   - Open mobile menu
   - Tap search button
   - Verify modal opens

### Automated Testing (Future)

```typescript
// Example test
describe('Search Feature', () => {
  it('should open modal on Cmd+K', () => {
    fireEvent.keyDown(window, { key: 'k', metaKey: true });
    expect(screen.getByPlaceholderText(/search/i)).toBeInTheDocument();
  });

  it('should return results for valid query', async () => {
    render(<SearchModal isOpen={true} onClose={jest.fn()} />);
    const input = screen.getByPlaceholderText(/search/i);
    fireEvent.change(input, { target: { value: 'test' } });
    
    await waitFor(() => {
      expect(screen.getByText(/targets/i)).toBeInTheDocument();
    });
  });
});
```

---

## Usage Examples

### Example 1: Find a Target

1. Press `Cmd+K`
2. Type "example.com"
3. Results show all targets matching "example.com"
4. Use arrow keys or click to open target

### Example 2: Find a Finding by Severity

1. Press `Cmd+K`
2. Type "high" or "critical"
3. Results show findings with those keywords in title/description
4. Color-coded icons help identify severity quickly

### Example 3: Find a Payload

1. Press `Cmd+K`
2. Type "xss" or "sql injection"
3. Results show matching payloads
4. Navigate to payload library

### Example 4: Find an Encrypted Note

1. Press `Cmd+K`
2. Type note title (content is encrypted, so search only works on title)
3. Click result to open and decrypt note

---

## Troubleshooting

### Issue: Search not working

**Possible Causes**:
1. User not logged in (search requires authentication)
2. Database connection issue
3. RLS policies blocking query

**Solution**:
- Check authentication status
- Verify Supabase connection
- Check browser console for errors

### Issue: No results found

**Possible Causes**:
1. No data matches query
2. Query too short (< 2 characters)
3. Search only works on specific fields (e.g., note titles, not content)

**Solution**:
- Try different search terms
- Type at least 2 characters
- Check if data exists in database

### Issue: Keyboard shortcut not working

**Possible Causes**:
1. Browser extension intercepting shortcut
2. OS-level shortcut conflict
3. Focus trapped in input field

**Solution**:
- Disable conflicting browser extensions
- Change OS-level shortcuts
- Click outside input first, then try shortcut

---

## Success Metrics

### KPIs

- **Usage Rate**: % of users using search per session
- **Search Frequency**: Average searches per user per day
- **Success Rate**: % of searches resulting in navigation
- **Speed**: Average search response time
- **Coverage**: % of entities found via search vs. browsing

### Goals

- 60%+ of users use search at least once per session
- <300ms average search response time
- 70%+ search success rate (user clicks result)

---

## Conclusion

The Global Search feature significantly improves navigation and discoverability in BugTrack. It provides a fast, intuitive way to find targets, findings, payloads, and notes from anywhere in the dashboard.

**Status**: ✅ Implemented (MVP Complete)

**Next Steps**:
1. Monitor usage analytics
2. Gather user feedback
3. Implement advanced features (filters, full-text search, etc.)


