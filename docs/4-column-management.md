# 4. Column Management

## Overview
Dynamic column system allowing users to organize workflow stages within their Kanban boards.

## Core Features

### Column Operations
- Edit column names
- Reorder columns via drag-and-drop
- Collapse/expand columns

### Default Columns
New boards start with three fixed columns:
1. To Do
2. In Progress
3. Done

Users can modify names and settings but cannot add/remove columns in MVP.

### Column Properties
- Name (required, max 100 chars)
- Position (integer for ordering)
- Card count
- Collapsed state

## Database Schema

### columns table
- id (UUID, primary key)
- boardId (foreign key)
- name (string, required)
- position (integer, required)
- isCollapsed (boolean, default false)
- createdAt, updatedAt (timestamps)

### Ordering Strategy
- Position field with gaps (1000, 2000, 3000...)
- Allows reordering without updating all columns
- Rebalance positions when gaps get too small

## API Endpoints

### Column Operations
- `GET /api/boards/:boardId/columns` - List columns
- `PATCH /api/columns/:id` - Update column settings
- `POST /api/columns/reorder` - Bulk reorder columns
- `POST /api/columns/:id/collapse` - Toggle collapse state
- `POST /api/columns/:id/move-cards` - Move all cards to another column

## User Interface

### Column Header
- Editable name (click or double-click)
- Card count badge
- Dropdown menu for actions
- Drag handle for reordering
- Collapse/expand toggle

### Column Actions Menu
- Rename column
- Move all cards
- Clear column

### Drag and Drop
- Visual feedback during drag
- Drop zones between columns
- Smooth animations
- Auto-scroll when near edges
- Touch support for mobile

## Business Logic

### Column Initialization
1. Create three default columns on board creation
2. Set positions (1000, 2000, 3000)
3. Cannot be deleted in MVP

### Column Editing
1. Validate user has permission
2. Update column name
3. Return updated column

### Column Reordering
1. Validate new positions
2. Update affected columns
3. Use transaction for atomicity
4. Return new column order

## Performance Considerations

### Query Optimization
- Index on boardId and position
- Eager load card counts
- Batch position updates
- Use transactions for reordering

### UI Performance
- Optimistic updates for drag-drop
- Debounce name editing
- Lazy load collapsed column content

## Validation Rules

### Column Name
- Required, non-empty
- Maximum 100 characters
- No special characters restrictions

### Position
- Positive integer
- Unique within board
- Maintained on reorder

## Edge Cases

### Card Migration
- Handle large number of cards when moving between columns
- Preserve card order
- Update activity logs

### Concurrent Edits
- Handle race conditions
- Optimistic locking
- Conflict resolution

## Security Considerations

### Permissions
- Verify board membership
- Check role permissions
- Prevent cross-board operations

### Input Validation
- Sanitize column names
- Validate position values
- Prevent SQL injection

## Future Features

### Dynamic Columns
- Create custom columns
- Delete columns (with safeguards)
- Unlimited columns per board
- Column templates

### WIP (Work In Progress) Limits
- Set WIP limit per column (1-99 cards)
- Visual warning when approaching limit
- Block adding cards when at limit
- Option to override with confirmation
- WIP limit indicator in column header

### Advanced Features
- Column color customization
- Column automation rules
- Custom column types (e.g., "Blocked", "Review")
- Column-specific permissions
- Time tracking per column
- Column analytics and metrics
- Auto-move cards based on conditions
- Column webhooks/integrations

## Implementation Checklist
- [ ] Create columns database table with 3 defaults
- [ ] Implement column update API
- [ ] Add position management logic
- [ ] Build column UI components
- [ ] Implement drag-and-drop reordering
- [ ] Create column menu actions
- [ ] Handle card bulk operations
- [ ] Add collapse/expand functionality
- [ ] Test edge cases