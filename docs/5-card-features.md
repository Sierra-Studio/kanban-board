# 5. Card Features

## Overview
Rich card system with comprehensive task management capabilities, supporting the full lifecycle of work items in the Kanban board.

## Core Features (MVP)

### Basic Card Properties
- Title (required, max 500 chars)
- Description (optional, markdown support)
- Position within column (for ordering)
- Creation/update timestamps
- Creator reference

### Card Operations
- Create new cards
- Edit title and description
- Move between columns (drag-and-drop)
- Reorder within column
- Delete cards
- Quick edit inline

### Card Display
- Compact view in column
- Expanded modal view
- Title and description preview
- Card count per column
- Visual drag feedback

## Database Schema

### cards table
- id (UUID, primary key)
- columnId (foreign key)
- title (string, required)
- description (text, markdown)
- position (integer, required)
- createdBy (user foreign key)
- createdAt, updatedAt (timestamps)

### Position Strategy
- Same as columns (gaps: 1000, 2000, 3000...)
- Allows insertion without reordering all
- Rebalance when gaps too small

## API Endpoints

### Card CRUD
- `GET /api/columns/:columnId/cards` - List cards in column
- `POST /api/columns/:columnId/cards` - Create card
- `GET /api/cards/:id` - Get card details
- `PATCH /api/cards/:id` - Update card
- `DELETE /api/cards/:id` - Delete card

### Card Actions
- `POST /api/cards/:id/move` - Move to different column
- `POST /api/cards/reorder` - Bulk reorder within column

## User Interface

### Card Component (Column View)
- Title (truncated if long)
- Description preview (first 2 lines)
- Hover effects
- Drag handle
- Quick actions on hover

### Card Modal
- Full title (editable)
- Description editor (markdown)
- Activity history
- Action buttons (save, delete)
- Keyboard shortcuts (ESC to close)

### Drag and Drop
- Visual placeholder during drag
- Highlight valid drop zones
- Smooth animations
- Auto-scroll near edges
- Multi-select drag (future)

### Quick Add
- "Add a card" button at column bottom
- Inline form for quick creation
- Enter to save, ESC to cancel
- Auto-focus on title

## Business Logic

### Card Creation
1. Validate user permission
2. Calculate position (end of column)
3. Create card with minimal info
4. Return card with ID
5. Update column card count

### Card Movement
1. Validate source and target columns
2. Remove from source position
3. Calculate new position in target
4. Update card's columnId and position
5. Rebalance positions if needed

### Card Deletion
1. Verify user permission
2. Soft delete or hard delete
3. Update positions of remaining cards
4. Update column count

## Performance Considerations

### Query Optimization
- Index on columnId and position
- Batch load cards per column
- Limit description length in list view
- Pagination for large columns

### UI Performance
- Virtual scrolling for many cards
- Optimistic updates
- Debounce auto-save
- Lazy load card details

## Validation Rules

### Title
- Required, non-empty
- Maximum 500 characters
- Trim whitespace

### Description
- Optional
- Markdown supported
- Maximum 10,000 characters
- Sanitize HTML

### Position
- Positive integer
- Unique within column
- Auto-calculated

## Security Considerations

### Permissions
- Verify board membership
- Check user can edit cards
- Prevent cross-board moves

### Content Security
- Sanitize markdown/HTML
- Prevent XSS in descriptions
- Validate file uploads (future)

## Future Features

### Advanced Card Properties
- Assignee(s)
- Due dates
- Priority levels (Critical, High, Medium, Low)
- Labels/tags with colors
- Cover images
- Time estimates
- Progress tracking

### Rich Media
- File attachments
- Image uploads
- Link previews
- Embedded videos

### Collaboration
- Comments section
- Mentions (@user)
- Activity log
- Watch/follow cards
- Real-time updates

### Organization
- Card numbers (auto-increment)
- Subtasks/checklists
- Dependencies between cards
- Card templates
- Bulk operations

### Automation
- Recurring cards
- Auto-move based on rules
- Due date reminders
- Status workflows
- Integration webhooks

### Analytics
- Time tracking
- Cycle time metrics
- Card aging
- Burndown charts
- Activity heatmaps

## Edge Cases

### Large Descriptions
- Implement pagination or truncation
- Optimize rendering performance
- Consider separate storage

### Concurrent Edits
- Implement optimistic locking
- Show conflict warnings
- Merge or overwrite options

### Orphaned Cards
- Handle deleted columns
- Provide recovery options
- Audit trail

## Implementation Checklist
- [ ] Create cards database table
- [ ] Implement card CRUD API
- [ ] Build card component
- [ ] Add drag-and-drop functionality
- [ ] Create card modal
- [ ] Implement quick add feature
- [ ] Add markdown support
- [ ] Handle card positioning
- [ ] Add inline editing
- [ ] Test performance with many cards