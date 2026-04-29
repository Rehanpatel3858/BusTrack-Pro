# Map Integration and Routing

<cite>
**Referenced Files in This Document**
- [script.js](file://script.js)
- [index.html](file://index.html)
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

## Introduction
This document explains the TomTom Maps SDK integration and routing functionality for the BusTrack MB Pro system. It covers interactive mapping with custom marker styling, route calculation and visualization, coordinate system usage, known location database, fuzzy search and location matching, fallback to TomTom APIs, traffic-aware routing, multi-layered route visualization with glow effects, custom styling, auto-zoom capabilities, ETA calculation logic, real-time route updates, supported location queries, and troubleshooting common mapping issues.

## Project Structure
The project consists of a single-page application with a dashboard that integrates TomTom Maps and Services, plus auxiliary pages for administration and driver portal. The main runtime logic resides in a single JavaScript file that orchestrates authentication, map initialization, search, routing, and UI updates.

```mermaid
graph TB
A["index.html<br/>Main dashboard with map"] --> B["script.js<br/>Authentication, search, routing, UI"]
A --> C["style.css<br/>UI styling and animations"]
D["admin.html<br/>Admin login panel"] --> E["admin.html script<br/>Static login logic"]
F["driver.html<br/>Driver portal"] --> G["driver.html script<br/>Driver actions"]
H["test_map.html<br/>Leaflet test page"] --> I["Leaflet map test"]
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
- Authentication and role-based access control with client-side credentials
- TomTom Maps SDK initialization and map lifecycle
- TomTom Search API fuzzy search with known location database
- TomTom Routing API for bus routes with traffic-aware optimization
- Multi-layered route visualization with glow, inner highlight, and smooth auto-zoom
- ETA calculation and progress visualization
- Local storage-backed fleet data persistence
- Toast notifications and modal confirmations

**Section sources**
- [script.js:37-152](file://script.js#L37-L152)
- [script.js:207-578](file://script.js#L207-L578)
- [script.js:580-719](file://script.js#L580-L719)
- [script.js:887-938](file://script.js#L887-L938)

## Architecture Overview
The system follows a modular client-side architecture:
- HTML pages define UI shells and containers
- CSS provides styling and animations
- JavaScript handles all logic: authentication, map lifecycle, search, routing, UI updates, and persistence

```mermaid
sequenceDiagram
participant U as "User"
participant UI as "Dashboard UI"
participant JS as "script.js"
participant TT as "TomTom Services"
participant MAP as "TomTom Map"
U->>UI : Enter location(s) and click search
UI->>JS : searchAndMove(type)
JS->>JS : Check KNOWN_LOCATIONS
alt Known location
JS->>MAP : Update markers and route
JS->>TT : calculateRoute (traffic-aware)
TT-->>JS : Route GeoJSON + ETA
JS->>MAP : Add multi-layer route visualization
JS->>UI : Update ETA and progress
else Unknown location
JS->>TT : fuzzySearch(query, center, radius)
TT-->>JS : Results list
JS->>JS : Select best match
JS->>MAP : Update markers and route
JS->>TT : calculateRoute (traffic-aware)
TT-->>JS : Route GeoJSON + ETA
JS->>MAP : Add multi-layer route visualization
JS->>UI : Update ETA and progress
end
```

**Diagram sources**
- [script.js:228-364](file://script.js#L228-L364)
- [script.js:447-570](file://script.js#L447-L570)

## Detailed Component Analysis

### Authentication and Role Management
- Hardcoded client-side users with roles and bus assignments
- Session and local storage management for roles and active user
- Role-based rendering of fleet lists and UI elements
- Launch dashboard after successful login

```mermaid
flowchart TD
Start(["Login Attempt"]) --> Validate["Validate username/password"]
Validate --> RoleCheck{"Role matches?"}
RoleCheck --> |No| Deny["Show toast: Access Denied"]
RoleCheck --> |Yes| Save["Save session and role"]
Save --> AssignBus["Assign active bus (if applicable)"]
AssignBus --> Launch["Launch dashboard and init map"]
Launch --> End(["Authenticated"])
```

**Diagram sources**
- [script.js:76-112](file://script.js#L76-L112)
- [script.js:119-151](file://script.js#L119-L151)

**Section sources**
- [script.js:37-152](file://script.js#L37-L152)

### Map Initialization and Lifecycle
- Initializes TomTom map with center and zoom
- Resizes map on load and sets up periodic sync
- Provides publish trip and logout utilities

```mermaid
sequenceDiagram
participant UI as "Dashboard"
participant JS as "script.js"
participant MAP as "TomTom Map"
UI->>JS : initMap()
JS->>MAP : tt.map(container, center, zoom)
MAP-->>JS : load event
JS->>MAP : resize()
JS->>JS : setInterval(syncData, 5000)
```

**Diagram sources**
- [script.js:887](file://script.js#L887)

**Section sources**
- [script.js:887](file://script.js#L887)

### Known Location Database and Coordinate System
- Exact coordinates for Shree L.R. Tiwari College of Engineering and Mira Road Railway Station
- Normalized fuzzy keys for robust matching
- Coordinates stored as latitude/longitude pairs

Supported exact locations:
- Shree L.R. Tiwari College of Engineering (latitude: 19.282, longitude: 72.855)
- Mira Road Railway Station (latitude: 19.281, longitude: 72.855)

Coordinate system usage:
- TomTom SDK expects [longitude, latitude] order for positions
- Internal state stores {lat, lng, name}

**Section sources**
- [script.js:209-226](file://script.js#L209-L226)

### Fuzzy Search and Location Matching
- Uses TomTom fuzzySearch with center and radius around Mira-Bhayandar area
- Limits results and filters by country and language
- Implements a scoring algorithm to select the best match from multiple results
- Falls back to known locations when exact matches are found

```mermaid
flowchart TD
Q["User Query"] --> Normalize["Normalize query"]
Normalize --> Known{"Known location?"}
Known --> |Yes| UseKnown["Use exact coordinates"]
Known --> |No| Fuzzy["tt.services.fuzzySearch()"]
Fuzzy --> Results{"Results > 0?"}
Results --> |No| Error["Toast: Location not found"]
Results --> |Yes| Score["Score best match by keywords"]
Score --> UseResult["Use selected position"]
UseKnown --> Store["Store coordinates in fleet data"]
UseResult --> Store
Store --> Update["updateMarkersAndRoute()"]
```

**Diagram sources**
- [script.js:228-364](file://script.js#L228-L364)

**Section sources**
- [script.js:228-364](file://script.js#L228-L364)

### Route Calculation and Traffic-Aware Optimization
- Uses TomTom Routing API with bus travel mode and fastest route type
- Enables traffic-aware routing
- Calculates ETA from route summary
- Stores ETA per bus in local storage

```mermaid
sequenceDiagram
participant UI as "UI"
participant JS as "script.js"
participant TT as "TomTom Routing API"
UI->>JS : drawPreciseRoute()
JS->>TT : calculateRoute(locations, travelMode=bus, routeType=fastest, traffic=true)
TT-->>JS : Route GeoJSON + summary.travelTimeInSeconds
JS->>JS : Compute ETA minutes
JS->>JS : Update fleet_data ETA
JS->>JS : Add multi-layer route visualization
```

**Diagram sources**
- [script.js:447-570](file://script.js#L447-L570)

**Section sources**
- [script.js:447-570](file://script.js#L447-L570)

### Multi-Layered Route Visualization and Custom Styling
- Adds a glow layer beneath the main route
- Adds an inner highlight layer for depth
- Uses smooth easing and auto-zoom to fit both markers and route geometry
- Applies custom marker styling with blue for start and red for destination

```mermaid
graph LR
A["Route Source (GeoJSON)"] --> B["Glow Layer<br/>line-blur, line-opacity"]
A --> C["Main Route Layer<br/>line-color, line-width"]
A --> D["Inner Highlight Layer<br/>line-color, line-width"]
C --> E["Map"]
B --> E
D --> E
```

**Diagram sources**
- [script.js:488-549](file://script.js#L488-L549)

**Section sources**
- [script.js:367-444](file://script.js#L367-L444)
- [script.js:488-549](file://script.js#L488-L549)

### ETA Calculation Logic and Real-Time Updates
- Computes ETA in minutes from route summary
- Updates UI progress bar and bus icon position
- Periodic sync updates UI even when not actively changing
- Per-bus ETA stored independently

```mermaid
flowchart TD
Start(["Route Calculated"]) --> Extract["Extract travelTimeInSeconds"]
Extract --> Convert["Convert to minutes (ceil)"]
Convert --> Store["Store ETA in fleet_data"]
Store --> UI["Update ETA display and progress"]
UI --> End(["Real-time ETA visible"])
```

**Diagram sources**
- [script.js:473-482](file://script.js#L473-L482)
- [script.js:581-623](file://script.js#L581-L623)

**Section sources**
- [script.js:473-482](file://script.js#L473-L482)
- [script.js:581-623](file://script.js#L581-L623)

### UI Integration and Interaction Controls
- Fleet list chips with active state styling
- Driver and monitor portals with role-specific views
- Toast notifications for feedback
- Reset confirmation modal for clearing bus data
- Auto-sync status indicator with pulsing animation

**Section sources**
- [script.js:154-205](file://script.js#L154-L205)
- [script.js:581-623](file://script.js#L581-L623)
- [script.js:739-770](file://script.js#L739-L770)
- [style.css:426-474](file://style.css#L426-L474)

## Dependency Analysis
- TomTom Maps SDK and Services are loaded from CDN in the main HTML
- script.js depends on TomTom global objects (tt.map, tt.services, tt.Marker, tt.LngLatBounds)
- UI elements are manipulated via DOM selectors
- Local storage persists fleet data and user sessions

```mermaid
graph TB
HTML["index.html"] --> SDK["TomTom Maps SDK"]
HTML --> SVC["TomTom Services"]
JS["script.js"] --> SDK
JS --> SVC
JS --> LS["localStorage"]
JS --> DOM["DOM Elements"]
```

**Diagram sources**
- [index.html:8-12](file://index.html#L8-L12)
- [script.js:1](file://script.js#L1)
- [script.js:581](file://script.js#L581)

**Section sources**
- [index.html:8-12](file://index.html#L8-L12)
- [script.js:1](file://script.js#L1)

## Performance Considerations
- Cooldown mechanism prevents excessive re-rendering during user interactions
- Route layers are removed and re-added to avoid accumulation
- Auto-zoom uses bounds fitting with padding for optimal visibility
- Periodic sync runs at a reasonable interval to balance responsiveness and performance

[No sources needed since this section provides general guidance]

## Troubleshooting Guide
Common mapping issues and resolutions:
- Map not loading: Verify CDN availability and network connectivity; test with the Leaflet test page
- No route found: Ensure both start and destination are valid; check for network errors
- Incorrect locations: Use exact known locations for Shree L.R. Tiwari College of Engineering and Mira Road Railway Station
- ETA not updating: Confirm route calculation succeeded and local storage is accessible
- UI stuck in sync: Check interaction cooldown flags and modal confirmations

Supporting evidence:
- Network error handling in route calculation
- Toast notifications for user feedback
- Reset confirmation modal to clear stale data

**Section sources**
- [script.js:557-569](file://script.js#L557-L569)
- [script.js:915-920](file://script.js#L915-L920)
- [script.js:742-770](file://script.js#L742-L770)

## Conclusion
The BusTrack MB Pro system integrates TomTom Maps and Services to deliver a robust, interactive fleet monitoring solution. It combines a known location database with fuzzy search, traffic-aware routing, and rich visualization to provide accurate ETA and route insights. The modular design, client-side authentication, and persistent data model enable seamless operation across driver and monitor portals.