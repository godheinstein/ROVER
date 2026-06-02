# Project TODO

## Database Schema
- [x] Design and implement robot database schema with all criteria fields
- [x] Support type-specific fields (mobile manipulator, mobile base, manipulator arm)
- [x] Add support for dynamic/extensible criteria

## Backend API
- [x] Create tRPC procedures for robot CRUD operations
- [x] Implement natural language query processing with LLM
- [x] Build filter-based query system
- [x] Create admin authentication and authorization

## Frontend - User Interface
- [x] Design and implement main search page with hybrid search
- [x] Build natural language search input with LLM processing
- [x] Create dropdown filter system for all criteria
- [x] Display search results in responsive table/card layout
- [x] Show type-specific criteria based on robot type
- [x] Handle loading and error states

## Frontend - Admin Interface
- [x] Create admin dashboard with authentication
- [x] Build robot add/edit forms with type-specific fields
- [ ] Implement CSV/Excel bulk upload functionality
- [x] Add robot deletion capability
- [x] Create admin navigation and layout

## Testing & Documentation
- [x] Write vitest tests for backend procedures
- [x] Test natural language query processing
- [x] Add sample robot data for demonstration
- [x] Document system architecture and usage

## Deployment
- [x] Create checkpoint for deployment
- [x] Guide user to publish via UI

## New Features (User Requested)
- [x] Add website URL field to database schema
- [x] Implement CSV/Excel bulk upload in admin dashboard
- [x] Add clickable website links to robot names with good UI/UX
- [x] Build robot comparison feature with side-by-side view
- [x] Test all new features
- [ ] Create checkpoint for new features

## Deployment Preparation
- [x] Replace Manus OAuth with NextAuth for independent authentication
- [x] Configure custom LLM API (OpenAI/Anthropic) to replace Manus LLM
- [ ] Update all dependencies and remove Manus-specific packages
- [ ] Create .env.example file with all required environment variables
- [x] Create deployment configuration files (Railway, Vercel, Render)
- [x] Write comprehensive deployment guides for each platform
- [ ] Create database migration scripts for independent deployment
- [ ] Test authentication flow with NextAuth
- [ ] Test LLM integration with custom API
- [x] Push complete source code to GitHub repository
- [x] Create README with setup and deployment instructions
