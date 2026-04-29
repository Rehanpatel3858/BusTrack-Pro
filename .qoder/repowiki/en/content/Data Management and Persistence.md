# Data Management and Persistence

<cite>
**Referenced Files in This Document**
- [script.js](file://script.js)
- [index.html](file://index.html)
- [style.css](file://style.css)
- [admin.html](file://admin.html)
- [driver.html](file://driver.html)
</cite>

## Update Summary
**Changes Made**
- Updated to document the new centralized state management system with AppState object
- Added documentation for cross-tab synchronization capabilities using localStorage events
- Enhanced data validation and error handling mechanisms
- Documented the dual persistence model with localStorage for fleet data and journey state
- Added comprehensive role-based access control and filtering
- Updated real-time notification system with journey state tracking

## Table of Contents
1. [Introduction](#introduction)
2. [Project Structure](#project-structure)
3. [Core Components](#core-components)
4. [Architecture Overview](#architecture-overview)
5. [Detailed Component Analysis](#detailed-component-analysis)
6. [Dependency Analysis](#dependency-analysis)
7. [Performance Considerations](#performance-considerations)
8. [Troubleshooting Guide](#troubleshooting-guide)
9. [Conclusion](#conclusion)
10. [Appendices](#appendices)

## Introduction
This document explains the advanced data management and persistence system built around a centralized AppState object that serves as the single source of truth for fleet data. The system features cross-tab synchronization, role-based access control, real-time notifications, and comprehensive data validation. It covers the fleet data structure, initialization, synchronization, state management, real-time updates, conflict prevention, validation, error handling, and fallbacks. It also outlines scalability considerations and migration paths to more robust storage solutions.

## Project Structure
The application consists of:
- A centralized state management system with AppState object as the core orchestrator
- Cross-tab synchronization using localStorage events for real-time updates
- Role-based access control with session-based separation
- Dual persistence model: localStorage for fleet data and journey state
- Real-time notification system with journey tracking

```mermaid
graph TB
UI["index.html<br/>Dashboard UI"] --> AppState["AppState<br/>Centralized State Manager"]
AppState --> LS["localStorage<br/>fleet_data & journey_state"]
AppState --> Map["TomTom Maps SDK<br/>Routing & Rendering"]
AppState --> Notifications["Real-time Notifications<br/>Journey State Tracking"]
Admin["admin.html<br/>Admin Demo"] --> AppState
Driver["driver.html<br/>Driver Demo"] --> AppState
CrossTab["Other Browser Tabs<br/>Cross-tab Sync"] --> LS
```

**Diagram sources**
- [script.js:45-136](file://script.js#L45-L136)
- [script.js:266-294](file://script.js#L266-L294)
- [index.html:1-238](file://index.html#L1-L238)
- [admin.html:1-34](file://admin.html#L1-L34)
- [driver.html:1-732](file://driver.html#L1-L732)

**Section sources**
- [script.js:45-136](file://script.js#L45-L136)
- [script.js:266-294](file://script.js#L266-L294)
- [index.html:1-238](file://index.html#L1-L238)

## Core Components
- **AppState Object**: Centralized state manager serving as the single source of truth for all fleet data and journey state
- **Cross-tab Synchronization**: Real-time updates across multiple browser tabs using localStorage events
- **Dual Persistence Model**: Separate localStorage keys for fleet_data and journey_state with automatic synchronization
- **Role-based Access Control**: Session-based filtering of buses based on user roles (admin, driver, parent)
- **Enhanced Data Validation**: Comprehensive validation for coordinates, route calculations, and state consistency
- **Real-time Notifications**: Journey state tracking with automated notifications for bus movements
- **Session-based Separation**: Role and active user/bus stored in sessionStorage/localStorage for context isolation

**Section sources**
- [script.js:45-136](file://script.js#L45-L136)
- [script.js:266-294](file://script.js#L266-L294)
- [script.js:1813-1950](file://script.js#L1813-L1950)
- [script.js:235-252](file://script.js#L235-L252)

## Architecture Overview
The system uses a centralized AppState object as the single source of truth, with localStorage serving as the persistent store. Cross-tab synchronization ensures real-time updates across multiple browser sessions. The system implements role-based access control and comprehensive data validation.

```mermaid
sequenceDiagram
participant User as "User"
participant UI as "Dashboard UI"
participant AppState as "AppState Object"
participant LS as "localStorage"
participant OtherTabs as "Other Browser Tabs"
User->>UI : "Enter locations / change bus"
UI->>AppState : "updateFleetData() / updateJourneyState()"
AppState->>LS : "Persist to localStorage"
LS-->>OtherTabs : "storage event"
OtherTabs->>AppState : "sync() method"
AppState->>UI : "refreshUI() with new state"
Note over AppState,LS : "Cross-tab sync prevents conflicts"
```

**Diagram sources**
- [script.js:97-136](file://script.js#L97-L136)
- [script.js:266-294](file://script.js#L266-L294)
- [script.js:1284-1303](file://script.js#L1284-L1303)

## Detailed Component Analysis

### Centralized State Management System
The AppState object serves as the single source of truth for all application state, managing:
- **currentUser**: Currently authenticated user
- **userRole**: Role-based permissions (admin, driver, parent)
- **assignedBusId**: Bus assignment for parent/driver users
- **activeBusId**: Currently selected bus in UI
- **fleetData**: Complete fleet information with validation
- **journeyState**: Real-time journey tracking and notifications

```mermaid
flowchart TD
AppStateInit["AppState.init()"] --> LoadUser["Load user/session data"]
LoadUser --> LoadFleet["Load fleet_data from localStorage"]
LoadUser --> LoadJourney["Load journey_state from localStorage"]
LoadFleet --> ValidateFleet["Validate fleet data structure"]
LoadJourney --> ValidateJourney["Validate journey state"]
ValidateFleet --> Ready["AppState Ready"]
ValidateJourney --> Ready
```

**Diagram sources**
- [script.js:54-69](file://script.js#L54-L69)
- [script.js:97-136](file://script.js#L97-L136)

**Section sources**
- [script.js:45-136](file://script.js#L45-L136)
- [script.js:54-69](file://script.js#L54-L69)

### Cross-tab Synchronization
The system implements real-time synchronization across multiple browser tabs using localStorage events:

- **Event Listener**: Listens for 'journey_state' and 'fleet_data' key changes
- **Automatic Sync**: Calls AppState.sync() to refresh state from localStorage
- **Notification Filtering**: Only shows notifications for user's assigned bus
- **UI Refresh**: Automatically updates UI components when state changes

```mermaid
sequenceDiagram
participant Tab1 as "Browser Tab 1"
participant Tab2 as "Browser Tab 2"
participant LS as "localStorage"
Tab1->>LS : "write fleet_data/journey_state"
LS-->>Tab2 : "storage event"
Tab2->>Tab2 : "AppState.sync()"
Tab2->>Tab2 : "refreshUI()"
Tab2->>Tab2 : "Filter notifications by role"
```

**Diagram sources**
- [script.js:266-294](file://script.js#L266-L294)
- [script.js:1284-1303](file://script.js#L1284-L1303)

**Section sources**
- [script.js:266-294](file://script.js#L266-L294)
- [script.js:1284-1303](file://script.js#L1284-L1303)

### Role-based Access Control
The system implements comprehensive role-based filtering:

- **Admin Users**: Can view all buses and all notifications
- **Driver Users**: Can only view their assigned bus
- **Parent Users**: Can only view their assigned child's bus
- **Permission Checking**: `canViewBus()` and `shouldShowNotification()` methods
- **Dynamic Filtering**: Automatic filtering in fleet list rendering

**Section sources**
- [script.js:77-95](file://script.js#L77-L95)
- [script.js:511-569](file://script.js#L511-L569)

### Enhanced Data Validation and Error Handling
The system implements comprehensive validation:

- **Coordinate Validation**: NaN checks, range validation, and type checking
- **Route Calculation Validation**: API response validation and error handling
- **State Consistency**: Atomic updates with localStorage persistence
- **Fallback Mechanisms**: Graceful degradation with default values
- **User Feedback**: Toast notifications for success/error states

**Section sources**
- [script.js:920-925](file://script.js#L920-L925)
- [script.js:1010-1029](file://script.js#L1010-L1029)
- [script.js:1192-1195](file://script.js#L1192-L1195)

### Real-time Notification System
The system tracks journey state with automated notifications:

- **Journey Events**: Bus started, approaching stops, reached stops, smart arrival alerts
- **State Persistence**: Journey state stored separately from fleet data
- **Notification Filtering**: Role-based notification visibility
- **Simulation Mode**: Step-by-step journey simulation for testing

**Section sources**
- [script.js:1813-1950](file://script.js#L1813-L1950)
- [script.js:1952-1981](file://script.js#L1952-L1981)

### Dual Persistence Model
The system uses separate localStorage keys for different data types:

- **fleet_data**: Complete fleet information with coordinates, route details, and ETAs
- **journey_state**: Real-time journey tracking with status, stops, and timing
- **Atomic Operations**: Separate update methods for each data type
- **Cross-tab Sync**: Independent synchronization for each data type

**Section sources**
- [script.js:97-136](file://script.js#L97-L136)
- [script.js:266-294](file://script.js#L266-L294)

## Dependency Analysis
- script.js depends on:
  - localStorage for dual persistence (fleet_data and journey_state)
  - sessionStorage/localStorage for session and role state
  - TomTom Maps SDK for geocoding and routing
  - index.html for DOM elements and UI structure
  - Real-time notification system for journey tracking
- style.css provides UI styling for the dashboard and modals
- Cross-tab synchronization relies on browser storage events

```mermaid
graph LR
AppState["AppState Object"] --> LS["localStorage<br/>fleet_data & journey_state"]
AppState --> MapSDK["TomTom Maps SDK"]
AppState --> HTML["index.html"]
AppState --> Notifications["Real-time Notifications"]
Admin["admin.html"] --> AppState
Driver["driver.html"] --> AppState
CrossTab["Cross-tab Sync"] --> StorageEvents["localStorage Events"]
StorageEvents --> AppState
```

**Diagram sources**
- [script.js:45-136](file://script.js#L45-L136)
- [script.js:266-294](file://script.js#L266-L294)
- [index.html:1-238](file://index.html#L1-L238)
- [style.css:1-2440](file://style.css#L1-L2440)
- [admin.html:1-34](file://admin.html#L1-L34)
- [driver.html:1-732](file://driver.html#L1-L732)

**Section sources**
- [script.js:45-136](file://script.js#L45-L136)
- [script.js:266-294](file://script.js#L266-L294)
- [index.html:1-238](file://index.html#L1-L238)
- [style.css:1-2440](file://style.css#L1-L2440)

## Performance Considerations
- **Centralized State**: Single source of truth reduces data inconsistency and improves performance
- **Cross-tab Optimization**: Event-driven updates minimize unnecessary UI refreshes
- **Dual Persistence**: Separate localStorage keys reduce write contention and improve atomicity
- **Validation Efficiency**: Early validation prevents expensive API calls and UI updates
- **Memory Management**: Proper cleanup of route layers and markers prevents memory leaks

## Troubleshooting Guide
Common issues and resolutions:
- **AppState Not Initialized**:
  - Cause: Missing AppState.init() call
  - Resolution: Ensure AppState.init() is called during login process
- **Cross-tab Updates Not Working**:
  - Cause: Storage event listener not firing
  - Resolution: Check browser support for storage events and localStorage availability
- **Role-based Filtering Issues**:
  - Cause: Incorrect user assignment or session data
  - Resolution: Verify user credentials and session storage values
- **Journey State Synchronization**:
  - Cause: Separate localStorage keys not updating consistently
  - Resolution: Use AppState.updateJourneyState() for atomic updates
- **Notification Visibility Problems**:
  - Cause: Role-based notification filtering blocking legitimate notifications
  - Resolution: Verify user role and assigned bus configuration

**Section sources**
- [script.js:334-343](file://script.js#L334-L343)
- [script.js:266-294](file://script.js#L266-L294)
- [script.js:1825-1829](file://script.js#L1825-L1829)

## Conclusion
The system now provides a robust, scalable foundation for fleet data management with centralized state control, cross-tab synchronization, comprehensive role-based access, and real-time journey tracking. The dual persistence model ensures data integrity while the centralized AppState object provides a clear, maintainable architecture for future enhancements.

## Appendices

### AppState Object API Reference
- **init()**: Initialize state from localStorage/sessionStorage
- **updateFleetData(busId, updates)**: Update fleet data atomically
- **updateJourneyState(busId, updates)**: Update journey state atomically
- **sync()**: Refresh state from localStorage
- **canViewBus(busId)**: Check role-based access
- **shouldShowNotification(busId)**: Filter notifications by role

**Section sources**
- [script.js:54-136](file://script.js#L54-L136)
- [script.js:97-136](file://script.js#L97-L136)

### Data Models
- **fleet_data**: Complete fleet information with coordinates, route details, and ETAs
- **journey_state**: Real-time journey tracking with status, stops, and timing
- **AppState Structure**: Centralized state management with role-based filtering

**Section sources**
- [script.js:51-61](file://script.js#L51-L61)
- [script.js:254-271](file://script.js#L254-L271)

### Scalability and Migration Paths
- **Current Architecture Benefits**:
  - Centralized state management with clear separation of concerns
  - Cross-tab synchronization for multi-session environments
  - Role-based access control for security
  - Real-time notification system for user engagement
- **Future Enhancement Opportunities**:
  - Server-side state synchronization for distributed environments
  - WebSocket integration for real-time updates beyond browser tabs
  - Database migration with localStorage as cache layer
  - Advanced conflict resolution for multi-user scenarios
  - Schema versioning and migration system