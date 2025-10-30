# 3. Board Management

## Overview
Multi-board system allowing users to create, manage, and share Kanban boards with team members.

## Core Features

### Board Operations
- Create unlimited boards per user
- Edit board title and description
- Archive/delete boards
- Duplicate boards with all columns/cards
- Board templates for quick setup

### Board Properties
- Title (required, max 255 chars)
- Description (optional, markdown support)
- Created/updated timestamps
- Owner relationship
- Archive status

### Sharing & Permissions
- Share boards with other users
- Role-based access control
- Permission levels:
  - **Owner**: Full control, can delete board
  - **Admin**: Can edit board, manage members
  - **Member**: Can create/edit cards
  - **Viewer**: Read-only access

## Database Schema

### boards table
- id (UUID, primary key)
- title (string, required)
- description (text, optional)
- userId (owner, foreign key)
- isArchived (boolean)
- createdAt, updatedAt (timestamps)

### board_members table
- id (UUID, primary key)
- boardId (foreign key)
- userId (foreign key)
- role (owner/admin/member/viewer)
- joinedAt (timestamp)

### board_templates table (future)
- id (UUID, primary key)
- name (string)
- description (text)
- structure (JSON - columns and sample cards)
- category (string)
- isPublic (boolean)

## API Endpoints

### Board CRUD
- `GET /api/boards` - List all user's boards
- `POST /api/boards` - Create new board
- `GET /api/boards/:id` - Get board with columns/cards
- `PATCH /api/boards/:id` - Update board details
- `DELETE /api/boards/:id` - Delete board (owner only)
- `POST /api/boards/:id/archive` - Archive/unarchive
- `POST /api/boards/:id/duplicate` - Duplicate board

### Member Management
- `GET /api/boards/:id/members` - List board members
- `POST /api/boards/:id/members` - Invite user to board
- `PATCH /api/boards/:id/members/:userId` - Update member role
- `DELETE /api/boards/:id/members/:userId` - Remove member

### Board Templates (future)
- `GET /api/templates` - List available templates
- `POST /api/boards/from-template` - Create from template

## User Interface

### Board List View
- Grid/list layout toggle
- Search and filter boards
- Sort by name, date, activity
- Quick actions (archive, duplicate)
- Board preview cards
- Member avatars
- Activity indicators

### Board Creation
- Modal or dedicated page
- Template selection
- Initial column setup
- Privacy settings

### Board Settings
- Edit title/description
- Manage members
- View activity log
- Export/import data
- Delete board confirmation

## Permissions Matrix

| Action | Owner | Admin | Member | Viewer |
|--------|-------|-------|---------|--------|
| View board | ✓ | ✓ | ✓ | ✓ |
| Create columns | ✓ | ✓ | ✓ | ✗ |
| Edit columns | ✓ | ✓ | ✓ | ✗ |
| Create cards | ✓ | ✓ | ✓ | ✗ |
| Edit cards | ✓ | ✓ | ✓ | ✗ |
| Delete cards | ✓ | ✓ | ✓ | ✗ |
| Edit board settings | ✓ | ✓ | ✗ | ✗ |
| Manage members | ✓ | ✓ | ✗ | ✗ |
| Delete board | ✓ | ✗ | ✗ | ✗ |

## Business Logic

### Board Creation
1. Validate user authentication
2. Create board record
3. Add creator as owner in board_members
4. Create default columns (To Do, In Progress, Done)
5. Return board with columns

### Board Sharing
1. Validate inviter has admin/owner role
2. Check if user exists
3. Check if already member
4. Create board_member record
5. Send notification (future)

### Board Deletion
1. Verify user is owner
2. Soft delete (archive) or hard delete
3. Cascade delete columns and cards
4. Remove all member associations
5. Clean up attachments (future)

## Performance Considerations

### Query Optimization
- Index on userId for board list
- Index on boardId for member lookup
- Eager load columns/cards count
- Pagination for board list
- Cache board metadata

### Scalability
- Limit boards per user (e.g., 100)
- Archive old/inactive boards
- Implement soft deletes
- Background job for large deletions

## Security Considerations

### Access Control
- Verify board membership on every request
- Check role permissions for actions
- Prevent privilege escalation
- Audit log for sensitive actions

### Data Protection
- Validate board ownership
- Sanitize user inputs
- Prevent board ID enumeration
- Rate limit board creation

## Implementation Checklist
- [ ] Create board database tables
- [ ] Implement board CRUD API
- [ ] Add member management
- [ ] Create board list UI
- [ ] Build board creation flow
- [ ] Add board settings page
- [ ] Implement permissions system
- [ ] Add board sharing feature
- [ ] Test permission matrix
- [ ] Add activity logging