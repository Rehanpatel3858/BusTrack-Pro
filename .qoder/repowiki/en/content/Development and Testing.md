# Development and Testing

<cite>
**Referenced Files in This Document**
- [index.html](file://index.html)
- [script.js](file://script.js)
- [style.css](file://style.css)
- [admin.html](file://admin.html)
- [driver.html](file://driver.html)
- [test_map.html](file://test_map.html)
</cite>

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
This document provides comprehensive guidance for development workflows and testing procedures for the BusTrack MB Pro application. It covers the standalone map testing utility (test_map.html), development environment setup, browser compatibility testing, debugging techniques for TomTom API integration, testing strategies for different user roles, location search functionality, route calculation accuracy, error handling patterns, console logging, and user feedback via toast notifications. It also outlines development tools and techniques for customizing the UI design system and extending functionality, along with troubleshooting guides for common issues such as API key problems, coordinate accuracy, and performance optimization.

## Project Structure
The project is a client-side web application composed of HTML pages, a shared JavaScript runtime, and a centralized stylesheet. The main application entry point is index.html, which integrates TomTom Maps SDK for map rendering and routing. Supporting pages include admin.html for administrative access and driver.html for driver-specific functionality. A dedicated test_map.html provides a minimal Leaflet-based map test for network and map loading verification.

```mermaid
graph TB
A["index.html<br/>Main dashboard and map"] --> B["script.js<br/>Application logic and TomTom integration"]
A --> C["style.css<br/>UI and design system"]
D["admin.html<br/>Admin login and panel"] --> C
E["driver.html<br/>Driver portal"] --> C
F["test_map.html<br/>Leaflet map test"] --> G["Leaflet JS"]
B --> H["TomTom Maps SDK<br/>Maps and Services"]
```

**Diagram sources**
- [index.html:1-141](file://index.html#L1-L141)
- [script.js:1-938](file://script.js#L1-L938)
- [style.css:1-901](file://style.css#L1-L901)
- [admin.html:1-34](file://admin.html#L1-L34)
- [driver.html:1-732](file://driver.html#L1-L732)
- [test_map.html:1-51](file://test_map.html#L1-L51)

**Section sources**
- [index.html:1-141](file://index.html#L1-L141)
- [script.js:1-938](file://script.js#L1-L938)
- [style.css:1-901](file://style.css#L1-L901)
- [admin.html:1-34](file://admin.html#L1-L34)
- [driver.html:1-732](file://driver.html#L1-L732)
- [test_map.html:1-51](file://test_map.html#L1-L51)

## Core Components
- Authentication and Role Management
  - Client-side authentication against hardcoded credentials with role-based access.
  - Session and local storage management for active role, user, and bus selection.
- Map and Routing Engine
  - TomTom Maps SDK integration for map rendering and routing.
  - Local storage-backed fleet data with start/end coordinates and ETA.
- UI and UX
  - Glassmorphism design system with toast notifications and modal overlays.
  - Role-specific dashboards (parent, driver, admin) with dynamic UI updates.
- Testing Utilities
  - Standalone Leaflet-based map test for network and tile loading verification.

**Section sources**
- [script.js:37-117](file://script.js#L37-L117)
- [script.js:119-152](file://script.js#L119-L152)
- [script.js:207-570](file://script.js#L207-L570)
- [style.css:137-795](file://style.css#L137-L795)
- [test_map.html:1-51](file://test_map.html#L1-L51)

## Architecture Overview
The application follows a modular client-side architecture:
- index.html orchestrates the login, role selection, and dashboard views.
- script.js encapsulates all application logic, including authentication, map initialization, search and routing, data synchronization, and UI updates.
- style.css defines the design system and responsive layout.
- admin.html and driver.html provide role-specific portals with simplified UIs.
- test_map.html isolates map rendering for quick diagnostics.

```mermaid
graph TB
subgraph "Client"
IDX["index.html"]
SCR["script.js"]
STY["style.css"]
ADM["admin.html"]
DRV["driver.html"]
TST["test_map.html"]
end
subgraph "External APIs"
TT["TomTom Maps SDK"]
OSMT["OpenStreetMap Tiles"]
end
IDX --> SCR
IDX --> STY
ADM --> STY
DRV --> STY
SCR --> TT
TST --> OSMT
```

**Diagram sources**
- [index.html:1-141](file://index.html#L1-L141)
- [script.js:1-938](file://script.js#L1-L938)
- [style.css:1-901](file://style.css#L1-L901)
- [admin.html:1-34](file://admin.html#L1-L34)
- [driver.html:1-732](file://driver.html#L1-L732)
- [test_map.html:1-51](file://test_map.html#L1-L51)

## Detailed Component Analysis

### Authentication and Role Management
- Hardcoded users and roles are validated client-side.
- Temporary role selection is persisted until login; session storage holds active role and user.
- Role-specific fleet lists are rendered dynamically based on user role and assignment.

```mermaid
sequenceDiagram
participant U as "User"
participant IDX as "index.html"
participant SCR as "script.js"
participant LS as "LocalStorage"
participant SS as "SessionStorage"
U->>IDX : Select role and submit credentials
IDX->>SCR : processLogin()
SCR->>SCR : Validate credentials against USERS
alt Valid
SCR->>LS : Save temp_role/saved_user_role
SCR->>SS : Save active_role, active_user, active_bus
SCR->>SCR : launchDashboard()
SCR->>IDX : Show dashboard
else Invalid
SCR->>IDX : Show toast "Access Denied"
end
```

**Diagram sources**
- [index.html:31-59](file://index.html#L31-L59)
- [script.js:76-112](file://script.js#L76-L112)
- [script.js:119-152](file://script.js#L119-L152)

**Section sources**
- [script.js:37-117](file://script.js#L37-L117)
- [script.js:119-152](file://script.js#L119-L152)
- [index.html:31-59](file://index.html#L31-L59)

### TomTom Search API and Routing
- Known locations are mapped to exact coordinates for improved accuracy.
- For unknown locations, the fuzzy search API is used with region and language constraints.
- Route calculation uses TomTom Services with bus travel mode and traffic-aware routing.
- Route layers are layered with glow and highlight effects for visual clarity.

```mermaid
sequenceDiagram
participant U as "User"
participant IDX as "index.html"
participant SCR as "script.js"
participant TT as "TomTom Services"
U->>IDX : Enter location(s)
IDX->>SCR : searchAndMove(type)
SCR->>SCR : Normalize query and check KNOWN_LOCATIONS
alt Known
SCR->>SCR : Use exact coordinates
else Unknown
SCR->>TT : fuzzySearch(query, center, radius, limit)
TT-->>SCR : Results
SCR->>SCR : Select best match
end
SCR->>SCR : updateMarkersAndRoute()
alt Both points present
SCR->>TT : calculateRoute(locations, travelMode, traffic)
TT-->>SCR : Route GeoJSON
SCR->>SCR : Draw route layers and update ETA
end
```

**Diagram sources**
- [script.js:228-364](file://script.js#L228-L364)
- [script.js:367-570](file://script.js#L367-L570)

**Section sources**
- [script.js:207-570](file://script.js#L207-L570)
- [index.html:110-116](file://index.html#L110-L116)

### Data Synchronization and UI Updates
- A state flag prevents frequent re-syncs during user interactions.
- Data is stored in localStorage under fleet_data with per-bus entries.
- UI updates include ETA display, progress bar, and driver ETA box.

```mermaid
flowchart TD
Start(["syncData()"]) --> CheckFlags["Check isResetting and isUserInteracting"]
CheckFlags --> |Resetting| Skip["Skip sync and show status"]
CheckFlags --> |Interaction| Cooldown["Check cooldown timer"]
Cooldown --> |Active| Skip
Cooldown --> |Expired| LoadData["Load fleet_data from localStorage"]
LoadData --> RoleCheck{"Role != driver?"}
RoleCheck --> |Yes| UpdateMonitor["Update monitor UI (ETA, progress)"]
RoleCheck --> |No| UpdateDriver["Update driver UI (ETA box)"]
UpdateMonitor --> End(["Done"])
UpdateDriver --> End
Skip --> End
```

**Diagram sources**
- [script.js:581-623](file://script.js#L581-L623)

**Section sources**
- [script.js:581-623](file://script.js#L581-L623)

### Toast Notifications and Modal Overlays
- Toast notifications are implemented via a fixed-position div with a fade-out timer.
- A custom modal overlay provides confirmation for sensitive actions like bus reset.

```mermaid
sequenceDiagram
participant SCR as "script.js"
participant DOM as "DOM"
participant TOAST as "Toast Element"
SCR->>DOM : showToast(message)
DOM->>TOAST : Set text and display
TOAST-->>DOM : Visible for 3s
DOM->>TOAST : Hide after timeout
```

**Diagram sources**
- [script.js:915-920](file://script.js#L915-L920)
- [index.html:15-16](file://index.html#L15-L16)
- [style.css:782-795](file://style.css#L782-L795)

**Section sources**
- [script.js:915-920](file://script.js#L915-L920)
- [index.html:15-16](file://index.html#L15-L16)
- [style.css:782-795](file://style.css#L782-L795)

### Standalone Map Testing Utility (test_map.html)
- Initializes a Leaflet map centered on Mira Road with OpenStreetMap tiles.
- Includes a marker and popup for demonstration.
- Provides immediate visual feedback for network and tile loading.

```mermaid
flowchart TD
Init(["Page Load"]) --> CreateMap["Create Leaflet Map at [19.2813, 72.8557]"]
CreateMap --> AddTiles["Add OpenStreetMap Tile Layer"]
AddTiles --> AddMarker["Add Marker and Popup"]
AddMarker --> Log["Console log success"]
Log --> End(["Ready"])
```

**Diagram sources**
- [test_map.html:30-49](file://test_map.html#L30-L49)

**Section sources**
- [test_map.html:1-51](file://test_map.html#L1-L51)

### Driver Portal and Admin Access
- driver.html provides a simplified driver login and dashboard with quick actions.
- admin.html offers a basic admin login screen and panel placeholder.

**Section sources**
- [driver.html:1-732](file://driver.html#L1-L732)
- [admin.html:1-34](file://admin.html#L1-L34)

## Dependency Analysis
- External Dependencies
  - TomTom Maps SDK for map rendering and routing.
  - Font CDN for Inter font family.
  - Leaflet for the standalone map test utility.
- Internal Dependencies
  - script.js depends on DOM elements defined in index.html and style.css for UI updates.
  - driver.html references test_map.html to open the map test in a new tab.

```mermaid
graph LR
SCR["script.js"] --> TT["TomTom Maps SDK"]
IDX["index.html"] --> SCR
IDX --> STY["style.css"]
DRV["driver.html"] --> TST["test_map.html"]
TST --> LFT["Leaflet JS"]
```

**Diagram sources**
- [script.js:1-938](file://script.js#L1-L938)
- [index.html:1-141](file://index.html#L1-L141)
- [style.css:1-901](file://style.css#L1-L901)
- [driver.html:721-723](file://driver.html#L721-L723)
- [test_map.html:28-49](file://test_map.html#L28-L49)

**Section sources**
- [script.js:1-938](file://script.js#L1-L938)
- [index.html:1-141](file://index.html#L1-L141)
- [driver.html:721-723](file://driver.html#L721-L723)
- [test_map.html:28-49](file://test_map.html#L28-L49)

## Performance Considerations
- Interaction Cooldown
  - A 3-second cooldown prevents excessive re-rendering during user interactions.
- Route Calculation Optimization
  - Route layers are removed and re-added efficiently; GeoJSON is used for precise rendering.
- UI Responsiveness
  - Progress bars and ETA updates are throttled via periodic sync intervals.
- Storage Efficiency
  - Local storage is used for fleet data; consider batching writes to reduce overhead.

[No sources needed since this section provides general guidance]

## Troubleshooting Guide

### API Key Problems
- Symptom: Routes fail to calculate or search returns errors.
- Cause: Hardcoded TomTom key may be invalid or rate-limited.
- Resolution:
  - Replace the hardcoded key with a valid TomTom API key.
  - Verify service availability and quotas.
  - Check browser console for detailed error messages.

**Section sources**
- [script.js:1](file://script.js#L1)
- [script.js:557-569](file://script.js#L557-L569)

### Coordinate Accuracy
- Symptom: Routes appear incorrect or markers misplaced.
- Cause: Incorrect or missing coordinates for known locations.
- Resolution:
  - Confirm KNOWN_LOCATIONS entries for the target area.
  - Validate fuzzy search results and select the best match.
  - Ensure coordinates are in the correct order (longitude, latitude).

**Section sources**
- [script.js:209-226](file://script.js#L209-L226)
- [script.js:279-364](file://script.js#L279-L364)

### Browser Compatibility Testing
- Use test_map.html to verify map rendering across browsers.
- Test TomTom SDK integration in supported browsers.
- Validate CSS animations and transitions on target devices.

**Section sources**
- [test_map.html:1-51](file://test_map.html#L1-L51)

### Console Logging and Debugging
- Enable browser developer tools to inspect console logs for route calculation errors and search failures.
- Use interactive breakpoints in script.js to step through authentication and routing flows.

**Section sources**
- [script.js:359-363](file://script.js#L359-L363)
- [script.js:557-569](file://script.js#L557-L569)

### User Feedback Mechanisms
- Toast notifications provide contextual feedback for user actions.
- Modal overlays confirm destructive actions like bus reset.

**Section sources**
- [script.js:915-920](file://script.js#L915-L920)
- [script.js:742-778](file://script.js#L742-L778)

### Adding New Features While Maintaining Stability and Security
- Feature Flags
  - Introduce feature flags in localStorage to enable/disable experimental features.
- Input Validation
  - Sanitize and validate all user inputs before invoking external APIs.
- Error Boundaries
  - Wrap asynchronous API calls with try-catch blocks and display user-friendly messages.
- Security
  - Avoid storing secrets in client-side code.
  - Use HTTPS for all external resources.

[No sources needed since this section provides general guidance]

## Conclusion
This guide consolidates development workflows, testing procedures, and operational best practices for the BusTrack MB Pro application. By leveraging the standalone map test utility, understanding TomTom API integration, and following the outlined troubleshooting steps, developers can efficiently debug, extend, and maintain the application. Adhering to the performance and security recommendations ensures a robust and scalable solution.

[No sources needed since this section summarizes without analyzing specific files]

## Appendices

### Development Environment Setup
- Install a modern browser with developer tools enabled.
- Serve files locally using a static server to avoid CORS issues.
- Use the standalone map test utility to validate network connectivity and tile loading.

**Section sources**
- [test_map.html:1-51](file://test_map.html#L1-L51)

### Testing Strategies for Different User Roles
- Parent Portal
  - Verify assigned bus visibility and read-only monitoring features.
- Driver Terminal
  - Test trip configuration, ETA display, and publish functionality.
- Admin Center
  - Validate fleet status and administrative controls.

**Section sources**
- [script.js:119-152](file://script.js#L119-L152)
- [index.html:108-133](file://index.html#L108-L133)
- [admin.html:1-34](file://admin.html#L1-L34)

### UI Customization and Extending Functionality
- Modify style.css to adjust themes, animations, and layout.
- Extend script.js to add new features while preserving existing state management and error handling patterns.

**Section sources**
- [style.css:1-901](file://style.css#L1-L901)
- [script.js:1-938](file://script.js#L1-L938)