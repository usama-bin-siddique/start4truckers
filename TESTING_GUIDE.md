# Start4Truckers CRM - Testing Guide

## End-to-End Workflow Testing

This document outlines the comprehensive testing workflow for the Start4Truckers CRM system.

## Prerequisites

1. Database seeded with test users:
   - admin@start4truckers.com (Admin role)
   - sales@start4truckers.com (Sales role)
   - processing@start4truckers.com (Processing role)
   - Password for all: `password`

2. Frontend assets built: `npm run build` or `npm run dev`

3. Application running: `php artisan serve`

## Test Scenarios

### 1. Authentication & Authorization

#### Test 1.1: Login Flow
- [ ] Navigate to http://localhost:8000
- [ ] Should redirect to `/login`
- [ ] Login as admin@start4truckers.com
- [ ] Should redirect to `/dashboard`
- [ ] Dashboard should show KPIs and charts
- [ ] Verify user name appears in sidebar

#### Test 1.2: Role-Based Access
- [ ] Login as sales user
- [ ] Verify access to: Dashboard, Leads, Clients, Payments, Documents, Tasks, Notifications
- [ ] Verify NO access to: Operations, Reports, Settings
- [ ] Login as processing user
- [ ] Verify access to: Dashboard, Operations, Clients, Documents, Tasks, Notifications
- [ ] Verify NO access to: Leads, Payments, Reports, Settings

### 2. Lead Management Workflow

#### Test 2.1: Manual Lead Creation
- [ ] Login as admin or sales user
- [ ] Navigate to `/leads`
- [ ] Click "New Lead" button
- [ ] Fill form:
  - Name: John Doe
  - Email: john@example.com
  - Phone: (555) 123-4567
  - State: TX
  - Service: DOT Number
  - Assign to: Sales user
- [ ] Submit form
- [ ] Verify redirect to lead detail page
- [ ] Verify notification sent to assigned sales user
- [ ] Verify activity log shows "Lead created"

#### Test 2.2: Lead from Web3Forms Webhook
- [ ] Use Postman/curl to POST to `/api/webhook/web3forms`
- [ ] Body:
```json
{
  "name": "Jane Smith",
  "email": "jane@example.com",
  "phone": "(555) 987-6543",
  "state": "CA",
  "service": "MC Number",
  "message": "Looking for authority services"
}
```
- [ ] Verify response: 201 Created
- [ ] Check `/leads` - new lead should appear with source "website"
- [ ] Verify all admin/sales users received notification

#### Test 2.3: Lead Status Updates
- [ ] Open a lead
- [ ] Change status from "New" → "Contacted"
- [ ] Verify activity timeline shows status change
- [ ] Change to "Quote Sent"
- [ ] Add a note "Sent quote for $500"
- [ ] Verify note appears in timeline

#### Test 2.4: Lead Assignment
- [ ] Open an unassigned lead
- [ ] Click "Assign" button
- [ ] Select a sales user
- [ ] Verify notification sent to assigned user
- [ ] Login as assigned user
- [ ] Verify notification appears with "Lead Assigned" badge
- [ ] Click notification → should link to lead

#### Test 2.5: Convert Lead to Client
- [ ] Open a lead with status "Quote Sent"
- [ ] Click "Convert to Client" button
- [ ] Confirm conversion
- [ ] Verify:
  - Client created with unique client number (CL-YYYYMM-XXXX)
  - Lead status changed to "Won"
  - Notification sent to assigned user
  - Activity logged on both lead and client
  - Redirect to client detail page

### 3. Client Management Workflow

#### Test 3.1: View Client
- [ ] Navigate to `/clients`
- [ ] Click on a converted client
- [ ] Verify tabs: Details, Services, Payments, Documents, Activity
- [ ] Verify client information displayed correctly

#### Test 3.2: Service Management
- [ ] On client detail, go to "Services" tab
- [ ] Click "Add Service"
- [ ] Select service (e.g., "DOT Number")
- [ ] Set status to "In Progress"
- [ ] Assign to processing user
- [ ] Submit
- [ ] Login as processing user
- [ ] Navigate to `/operations`
- [ ] Verify service appears in operations list
- [ ] Update service checklist items
- [ ] Mark service as "Completed"
- [ ] Verify notification sent to client owner

### 4. Payments Workflow

#### Test 4.1: Create Payment
- [ ] Navigate to client detail
- [ ] Go to "Payments" tab
- [ ] Click "Add Payment"
- [ ] Fill:
  - Invoice Amount: $1,500.00
  - Amount Received: $500.00
  - Payment Date: Today
  - Method: Credit Card
- [ ] Submit
- [ ] Verify payment appears with balance due $1,000
- [ ] Verify activity log updated

#### Test 4.2: Upload Receipt
- [ ] On payment record, click "Upload Receipt"
- [ ] Select PDF file
- [ ] Upload
- [ ] Click "View Receipt" → should download file

#### Test 4.3: Outstanding Balances Report
- [ ] Navigate to `/reports`
- [ ] Go to "Outstanding Balances" tab
- [ ] Verify client appears with $1,000 balance
- [ ] Verify total outstanding is calculated correctly

### 5. Documents Workflow

#### Test 5.1: Upload Document
- [ ] Navigate to `/documents`
- [ ] Click "Upload"
- [ ] Fill:
  - Client ID: (use a valid client ID)
  - Category: Driver License
  - File: Select image/PDF
- [ ] Submit
- [ ] Verify document appears in list
- [ ] Verify notification if configured

#### Test 5.2: Download Document
- [ ] Click download icon on document
- [ ] Verify file downloads with correct filename

#### Test 5.3: Document Security
- [ ] Login as sales user (not document uploader)
- [ ] Try to delete document uploaded by admin
- [ ] Should be restricted (policy check)

### 6. Tasks Workflow

#### Test 6.1: Create Task
- [ ] Navigate to `/tasks`
- [ ] Click "New Task"
- [ ] Fill:
  - Title: Follow up with John Doe
  - Assigned To: Sales user
  - Priority: High
  - Due Date: Tomorrow
  - Client ID: (optional)
- [ ] Submit
- [ ] Verify task appears with high priority badge

#### Test 6.2: Task Notifications
- [ ] Create task with due date = today
- [ ] Verify assigned user sees task in "Tasks Due Today" on dashboard
- [ ] Optionally verify reminder notification (if scheduled)

#### Test 6.3: Complete Task
- [ ] Click circle icon on task row
- [ ] Verify task marked as completed (strikethrough, green checkmark)
- [ ] Go to dashboard
- [ ] Verify "Tasks Due Today" count decreased

### 7. Reports & Analytics

#### Test 7.1: Revenue Report
- [ ] Login as admin
- [ ] Navigate to `/reports`
- [ ] Set date range to current month
- [ ] Verify:
  - Total invoiced shows sum of all invoices
  - Total received shows sum of payments
  - Outstanding calculated correctly
  - Daily revenue chart displays data

#### Test 7.2: Lead Conversion Funnel
- [ ] Go to "Lead Conversion" tab
- [ ] Verify:
  - Total leads count is accurate
  - Won/Lost/Open breakdown correct
  - Conversion rate calculated correctly
  - Pie chart shows status distribution

#### Test 7.3: Employee Performance
- [ ] Go to "Employee Performance" tab
- [ ] Verify each user shows:
  - Leads assigned
  - Leads won
  - Conversion rate
  - Revenue generated
  - Tasks completed
  - Services completed

### 8. Settings Management

#### Test 8.1: User Management
- [ ] Login as admin
- [ ] Navigate to `/settings`
- [ ] Go to "Users" tab
- [ ] Click "Add User"
- [ ] Create new user:
  - Name: Test Manager
  - Email: manager@test.com
  - Role: Sales
  - Password: password123
- [ ] Submit
- [ ] Verify user appears in list
- [ ] Edit user → change role to Processing
- [ ] Verify change saved

#### Test 8.2: Service Management
- [ ] Go to "Services" tab
- [ ] Click "Add Service"
- [ ] Create:
  - Name: USDOT Registration
  - Slug: usdot-registration
  - Price: 299.00
- [ ] Submit
- [ ] Verify service appears in list
- [ ] Edit service → update price to 349.00
- [ ] Verify lead creation form shows new service

#### Test 8.3: Email Templates
- [ ] Go to "Email Templates" tab
- [ ] Click "Add Template"
- [ ] Create:
  - Name: Welcome Email
  - Slug: welcome
  - Subject: Welcome to Start4Truckers
  - Body: Hello {{name}}, welcome!
- [ ] Submit
- [ ] Verify template saved

### 9. Notifications System

#### Test 9.1: Notification Display
- [ ] Login as any user
- [ ] Perform action that triggers notification (e.g., assign lead)
- [ ] Check bell icon in top bar - should show red dot if unread
- [ ] Click bell or navigate to `/notifications`
- [ ] Verify notification appears with correct type and message

#### Test 9.2: Mark as Read
- [ ] Click on unread notification
- [ ] Verify it's marked as read (no blue highlight)
- [ ] Verify unread count decreased
- [ ] Click "Mark all read" button
- [ ] Verify all notifications marked as read

### 10. Activity Timeline

#### Test 10.1: Activity Logging
- [ ] Open any lead or client
- [ ] Perform various actions (status change, note, assignment)
- [ ] Go to "Activity" tab
- [ ] Verify all actions appear in chronological order
- [ ] Verify each entry shows:
  - Action type
  - Description
  - User who performed action
  - Timestamp

### 11. Dashboard Widgets

#### Test 11.1: KPI Cards
- [ ] Login and view dashboard
- [ ] Verify KPIs show real-time data:
  - Today's Leads
  - This Week's Leads
  - Active Clients
  - Tasks Due Today
  - Revenue (Today, Month, Year)
  - Pending Payments

#### Test 11.2: Charts
- [ ] Verify "Monthly Revenue" chart shows last 12 months
- [ ] Verify "Lead Conversion" pie chart shows 30-day data
- [ ] Verify "Recent Activity" shows last 10 activities
- [ ] Verify "Tasks Due Today" shows correct tasks

### 12. Search & Filtering

#### Test 12.1: Lead Filtering
- [ ] Navigate to `/leads`
- [ ] Use search box to search by name
- [ ] Filter by status = "New"
- [ ] Filter by assigned user
- [ ] Verify results update correctly
- [ ] Clear filters → verify all leads shown

#### Test 12.2: Document Filtering
- [ ] Navigate to `/documents`
- [ ] Search by filename
- [ ] Filter by category
- [ ] Filter by client ID
- [ ] Verify filtering works correctly

### 13. Responsive Design

#### Test 13.1: Mobile View
- [ ] Resize browser to mobile width (< 768px)
- [ ] Verify:
  - Sidebar collapses to hamburger menu
  - Tables are scrollable
  - Forms remain usable
  - Cards stack vertically

#### Test 13.2: Tablet View
- [ ] Resize to tablet width (768px - 1024px)
- [ ] Verify layout adjusts appropriately
- [ ] Sidebar behavior is correct

### 14. Error Handling

#### Test 14.1: Validation Errors
- [ ] Try to create lead without name → should show error
- [ ] Try to assign lead to invalid user → should show error
- [ ] Try to upload 25MB+ file → should show size error

#### Test 14.2: Permission Errors
- [ ] Login as sales user
- [ ] Try to access `/settings` directly → should redirect or show 403
- [ ] Try to access `/reports` → should redirect or show 403

## Performance Testing

### Test P1: Page Load Times
- [ ] Dashboard loads in < 2 seconds
- [ ] Leads index with 100+ records loads in < 3 seconds
- [ ] Reports with charts load in < 4 seconds

### Test P2: Data Pagination
- [ ] Create 100+ leads
- [ ] Verify pagination controls work
- [ ] Navigate through pages smoothly

## Security Testing

### Test S1: Authentication
- [ ] Try accessing `/dashboard` while logged out → redirect to login
- [ ] Try accessing API endpoint without auth → 401 Unauthorized

### Test S2: CSRF Protection
- [ ] All POST/PUT/DELETE requests include CSRF token
- [ ] Requests without token are rejected

### Test S3: File Upload Security
- [ ] Try uploading .exe file → should be rejected
- [ ] Try uploading > 20MB file → should be rejected

## Regression Testing

After any code changes, run through:
- [ ] Login/logout flow
- [ ] Create lead → Convert to client workflow
- [ ] Create task → Complete task workflow
- [ ] Add payment → View in reports
- [ ] Upload document → Download document

## Sign-off

### Tested By:
- Name: _______________
- Date: _______________
- Version: _______________

### Issues Found:
1. _______________
2. _______________
3. _______________

### Status:
- [ ] All tests passed
- [ ] Tests passed with minor issues
- [ ] Major issues found - requires fixes
