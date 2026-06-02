# Robot Mobile Manipulator Query System - Architecture Documentation

## Overview

The Robot Mobile Manipulator Query System is a hybrid search platform that allows users to find suitable robots using either **natural language queries** or **structured filter-based searches**. The system features a user-friendly interface for searching and an admin panel for managing the robot database.

---

## System Architecture

### Technology Stack

**Frontend:**
- React 19 with TypeScript
- Tailwind CSS 4 for styling
- shadcn/ui component library
- Wouter for routing
- tRPC React Query for type-safe API calls

**Backend:**
- Node.js with Express 4
- tRPC 11 for end-to-end type safety
- Drizzle ORM for database operations
- MySQL/TiDB database
- Manus LLM integration for natural language processing

**Authentication:**
- Manus OAuth integration
- Session-based authentication with JWT
- Role-based access control (admin/user)

---

## Database Schema

### Robots Table

The `robots` table stores all robot specifications with the following structure:

#### Basic Information
- `id` (Primary Key): Auto-incrementing identifier
- `name`: Robot name (required)
- `manufacturer`: Manufacturer name
- `type`: Robot type enum (`mobile_manipulator`, `mobile_base`, `manipulator_arm`)

#### Physical Specifications
- `length`, `width`, `height`: Dimensions in millimeters
- `weight`: Weight in kilograms
- `usablePayload`: Maximum payload capacity in kilograms
- `reach`: Maximum reach in millimeters

#### Functional Specifications
- `functions`: Description of robot capabilities
- `driveSystem`: Type of drive system (e.g., differential, omnidirectional)
- `certifications`: Certifications (e.g., ISO, cleanroom class)

#### Integration
- `rosCompatible`: Boolean (0/1) for ROS compatibility
- `rosDistros`: Comma-separated list of compatible ROS distributions
- `sdkAvailable`: Boolean for SDK availability
- `apiAvailable`: Boolean for API availability

#### Performance
- `operationTime`: Operation time in minutes
- `batteryLife`: Battery life in minutes
- `maxSpeed`: Maximum speed in mm/s

#### Arm-Specific Criteria
(Only applicable for `manipulator_arm` and `mobile_manipulator` types)
- `forceSensor`: Boolean for force sensor presence
- `eoatCompatibility`: End-of-Arm Tooling compatibility
- `armPayload`: Arm payload capacity in kilograms
- `armReach`: Arm reach in millimeters
- `armDof`: Degrees of Freedom

#### Metadata
- `remarks`: Additional notes
- `createdAt`, `updatedAt`: Timestamps
- `createdBy`: Reference to user who created the entry

---

## Backend API (tRPC Procedures)

### Public Procedures (No Authentication Required)

#### `robots.list`
Returns all robots in the database, ordered by creation date (newest first).

**Usage:**
```typescript
const robots = trpc.robots.list.useQuery();
```

#### `robots.getById`
Retrieves a specific robot by ID.

**Input:**
```typescript
{ id: number }
```

#### `robots.search`
Filters robots based on structured criteria.

**Input:**
```typescript
{
  type?: string;
  minPayload?: number;
  maxPayload?: number;
  minReach?: number;
  maxReach?: number;
  rosCompatible?: boolean;
  driveSystem?: string;
  minArmDof?: number;
  forceSensor?: boolean;
}
```

#### `robots.naturalLanguageQuery`
Processes natural language queries using LLM and returns matching robots.

**Input:**
```typescript
{ query: string }
```

**Output:**
```typescript
{
  filters: object;      // Extracted structured filters
  results: Robot[];     // Matching robots
  explanation: string;  // Human-readable result summary
}
```

**How It Works:**
1. User submits a natural language query (e.g., "Find robots with force sensors")
2. Backend sends query to LLM with structured prompt
3. LLM extracts relevant filters as JSON
4. Backend executes database search with extracted filters
5. Results returned with explanation

### Protected Procedures (Authentication Required)

#### `robots.create`
Creates a new robot entry. Requires authentication.

**Input:** All robot fields (name required, others optional)

#### `robots.update`
Updates an existing robot entry. Requires authentication.

**Input:** Robot ID + fields to update

#### `robots.delete`
Deletes a robot entry. Requires authentication.

**Input:**
```typescript
{ id: number }
```

---

## Frontend Architecture

### Pages

#### Home Page (`/`)
- **Hybrid Search Interface**: Toggle between natural language and filter-based search
- **Natural Language Search**: 
  - Text input for queries
  - Example queries provided
  - LLM-powered query processing
- **Advanced Filters**:
  - Dropdown selects for type, ROS compatibility, force sensor
  - Number inputs for payload, reach, DOF ranges
  - Text inputs for drive system
- **Results Display**: Table showing all robots or filtered results
- **Authentication**: Login/logout buttons, admin link for authenticated users

#### Admin Dashboard (`/admin`)
- **Authentication Gate**: Redirects to login if not authenticated
- **Robot Management Table**: View all robots with edit/delete actions
- **Add/Edit Dialog**: 
  - Comprehensive form with all robot fields
  - Type-specific fields (arm criteria only shown for relevant types)
  - Form validation
- **CRUD Operations**: Create, read, update, delete robots

### Key Components

#### Search Interface
- **Tab System**: Switch between natural language and filter modes
- **Dynamic Filtering**: Real-time filter updates
- **Loading States**: Spinners during search operations
- **Toast Notifications**: Success/error feedback

#### Admin Interface
- **Modal Dialog**: Full-screen form for adding/editing
- **Conditional Fields**: Arm-specific fields only shown when relevant
- **Optimistic Updates**: Immediate UI feedback with cache invalidation

---

## Natural Language Query Processing

### LLM Integration

The system uses Manus's built-in LLM service to parse natural language queries into structured database filters.

**Process Flow:**

1. **User Input**: "Find mobile manipulators with at least 10kg payload and ROS support"

2. **LLM Prompt**: System sends query with schema definition
   ```
   Available filters:
   - type: "mobile_manipulator" | "mobile_base" | "manipulator_arm"
   - minPayload: number (in kg)
   - rosCompatible: boolean
   ...
   ```

3. **LLM Response**: Structured JSON
   ```json
   {
     "type": "mobile_manipulator",
     "minPayload": 10,
     "rosCompatible": true
   }
   ```

4. **Database Query**: Filters applied to search
5. **Results**: Matching robots returned with explanation

### Supported Query Patterns

- **Type-based**: "Show me mobile bases"
- **Capability-based**: "Find robots with force sensors"
- **Specification-based**: "Robots with at least 5kg payload"
- **Integration-based**: "ROS-compatible manipulator arms"
- **Combined**: "Mobile manipulators with ROS support and 6+ DOF"

---

## Data Management

### Adding Robots

**Via Admin Interface:**
1. Login to the system
2. Navigate to Admin dashboard
3. Click "Add Robot"
4. Fill in the form (name is required)
5. Submit

**Via Database Seeding:**
```bash
# Edit seed-robots.mjs with your robot data
npx tsx seed-robots.mjs
```

### Updating Robots

1. Navigate to Admin dashboard
2. Click edit icon next to robot
3. Modify fields in the dialog
4. Submit changes

### Deleting Robots

1. Navigate to Admin dashboard
2. Click delete icon next to robot
3. Confirm deletion

---

## Extensibility

### Adding New Criteria

The system is designed to be easily extensible. To add new criteria:

1. **Update Database Schema** (`drizzle/schema.ts`):
   ```typescript
   export const robots = mysqlTable("robots", {
     // ... existing fields
     newField: varchar("new_field", { length: 255 }),
   });
   ```

2. **Push Schema Changes**:
   ```bash
   pnpm db:push
   ```

3. **Update Backend Filters** (`server/db.ts`):
   ```typescript
   export interface RobotFilters {
     // ... existing filters
     newFilter?: string;
   }
   ```

4. **Update tRPC Procedures** (`server/routers.ts`):
   - Add to `search` input validation
   - Add to `create`/`update` input validation
   - Update LLM prompt to include new filter

5. **Update Frontend**:
   - Add filter input to Home page
   - Add form field to AdminDashboard

---

## Testing

### Running Tests

```bash
pnpm test
```

### Test Coverage

The test suite (`server/robots.test.ts`) covers:

- **List Operations**: Retrieving all robots
- **Search Operations**: Filtering by type, payload, ROS compatibility, force sensors
- **CRUD Operations**: Creating, updating, deleting robots
- **Natural Language Queries**: LLM-powered query processing
- **Authentication**: Protected vs public procedures

All tests validate:
- Correct data retrieval
- Proper filtering logic
- Authentication requirements
- Type safety

---

## Deployment

### Development

```bash
pnpm dev
```

### Production

1. Create a checkpoint:
   ```bash
   # Tests must pass before checkpoint
   pnpm test
   ```

2. Use the Management UI:
   - Click "Publish" button in the UI header
   - Configure domain settings if needed

---

## Security Considerations

- **Authentication**: Admin operations require valid session
- **Input Validation**: All inputs validated with Zod schemas
- **SQL Injection**: Prevented by Drizzle ORM parameterized queries
- **XSS Protection**: React automatically escapes rendered content
- **CSRF Protection**: Session cookies with secure flags

---

## Performance Considerations

- **Database Indexing**: Primary key index on `id`, unique index on robot names recommended
- **Query Optimization**: Filters use indexed columns where possible
- **LLM Caching**: Consider caching common query patterns
- **Pagination**: Recommended for large datasets (not yet implemented)

---

## Future Enhancements

### Planned Features
- CSV/Excel bulk upload functionality
- Advanced sorting and pagination
- Robot comparison feature
- Image upload for robots
- Export search results
- Saved searches
- User favorites

### Potential Improvements
- Full-text search on descriptions
- Fuzzy matching for natural language queries
- Query history and suggestions
- Advanced analytics dashboard
- API rate limiting
- Multi-language support

---

## Troubleshooting

### Common Issues

**Natural language search not working:**
- Check LLM API credentials
- Verify network connectivity
- Review query format in console

**Database connection errors:**
- Verify DATABASE_URL environment variable
- Check database server status
- Run `pnpm db:push` to sync schema

**Authentication issues:**
- Clear browser cookies
- Check OAuth configuration
- Verify session secret is set

---

## Contact & Support

For questions or issues, refer to the project documentation or contact the development team.
