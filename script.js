const TOMTOM_KEY = 'RlUjrRnVgicCym6rNTEWTDxJa7URNexi';
let map, busMarker, destMarker, routeLayer;
let activeBusID = "bus01";
let startCoords = null;
let endCoords = null;

// State management flags to prevent unwanted re-renders
let isUserInteracting = false;
let isResetting = false;
let lastUserActionTime = 0;
const INTERACTION_COOLDOWN = 3000; // 3 seconds cooldown after user action

// Show/hide sync status indicator
function showSyncStatus() {
    const syncStatus = document.getElementById('sync-status');
    if (syncStatus) {
        syncStatus.style.display = 'flex';
    }
}

function hideSyncStatus() {
    const syncStatus = document.getElementById('sync-status');
    if (syncStatus) {
        syncStatus.style.display = 'none';
    }
}

// Update sync status based on interaction state
function updateSyncStatus() {
    if (isUserInteracting || isResetting) {
        showSyncStatus();
    } else {
        hideSyncStatus();
    }
}

// --- HARDCODED USER CREDENTIALriveS (Client-side only) ---
const USERS = {
    'admin': { password: 'schooladmin789', role: 'admin', busId: null },
    // Student accounts - each assigned to a specific bus
    'student01': { password: 'pass01', role: 'parent', busId: 'bus01' },
    'student02': { password: 'pass02', role: 'parent', busId: 'bus02' },
    'student03': { password: 'pass03', role: 'parent', busId: 'bus03' },
    'student04': { password: 'pass04', role: 'parent', busId: 'bus04' },
    'student05': { password: 'pass05', role: 'parent', busId: 'bus05' },
    // Legacy parent account (sees all buses)
    'stu1703': { password: '1703', role: 'parent', busId: null },
    // Driver accounts
    'bus01': { password: 'drive123', role: 'driver', busId: 'bus01' },
    'bus02': { password: 'drive123', role: 'driver', busId: 'bus02' },
    'bus03': { password: 'drive123', role: 'driver', busId: 'bus03' },
    'bus04': { password: 'drive123', role: 'driver', busId: 'bus04' },
    'bus05': { password: 'drive123', role: 'driver', busId: 'bus05' },
    'bus06': { password: 'drive123', role: 'driver', busId: 'bus06' }
};

// Initialize fleet data in localStorage if not exists
function initializeFleetData() {
    if (!localStorage.getItem("fleet_data")) {
        const initialFleet = {};
        for (let i = 1; i <= 6; i++) {
            const busId = `bus0${i}`;
            initialFleet[busId] = { active: false };
        }
        localStorage.setItem("fleet_data", JSON.stringify(initialFleet));
    }
}

// --- 1. AUTH LOGIC (Pure Client-Side) ---
function setTempRole(role) {
    localStorage.setItem("temp_role", role);
    document.getElementById('role-selection-v3').style.display = 'none';
    document.getElementById('auth-form-v3').style.display = 'block';
}

function processLogin() {
    const role = localStorage.getItem("temp_role");
    const username = document.getElementById('username').value.trim().toLowerCase();
    const password = document.getElementById('password').value.trim();
    
    if (!username || !password) {
        showToast("Please enter both username and password");
        return;
    }
    
    // Client-side authentication against hardcoded users
    const user = USERS[username];
    
    if (user && user.password === password && user.role === role) {
        // Store session info
        if (role !== 'driver') localStorage.setItem("saved_user_role", role);
        sessionStorage.setItem("active_role", role);
        sessionStorage.setItem("active_user", username);
        localStorage.setItem("active_user", username);
        
        // Set active bus ID
        if (user.busId) {
            activeBusID = user.busId;
        } else {
            activeBusID = "bus01";
        }
        sessionStorage.setItem("active_bus", activeBusID);
        
        // Mark as logged in
        sessionStorage.setItem("is_logged_in", "true");
        
        showToast("Login successful!");
        launchDashboard();
    } else {
        showToast("Access Denied: Invalid Credentials");
    }
}

// Check if user is logged in
function isLoggedIn() {
    return sessionStorage.getItem("is_logged_in") === "true";
}

function launchDashboard() {
    document.getElementById('login-screen').style.display = 'none';
    document.getElementById('app-container').style.display = 'block';
    const role = sessionStorage.getItem("active_role") || localStorage.getItem("saved_user_role");
    const username = sessionStorage.getItem("active_user") || localStorage.getItem("active_user");
    activeBusID = sessionStorage.getItem("active_bus") || "bus01";
    
    document.getElementById('role-label').innerText = role.toUpperCase();
    document.getElementById('driver-portal').style.display = (role === 'driver') ? 'block' : 'none';
    document.getElementById('monitor-portal').style.display = (role !== 'driver') ? 'block' : 'none';
    
    // Get user's assigned bus if any
    const user = USERS[username];
    const userBusId = user ? user.busId : null;
    
    // Driver-specific view: show only their assigned bus
    if (role === 'driver') {
        renderDriverFleetList(activeBusID);
    } 
    // Parent with assigned bus: show only their child's bus
    else if (role === 'parent' && userBusId) {
        renderParentFleetList(userBusId);
        // Set active bus to parent's assigned bus
        activeBusID = userBusId;
        sessionStorage.setItem("active_bus", userBusId);
    }
    // Admin or parent without specific bus assignment: show all buses
    else {
        renderFullFleetList();
    }
    
    updateChipUI(activeBusID);
    initMap();
}

// Render fleet list for drivers - only show their assigned bus
function renderDriverFleetList(driverBusId) {
    const fleetContainer = document.querySelector('.fleet-list');
    if (!fleetContainer) return;
    
    const busDisplayName = formatBusID(driverBusId);
    
    fleetContainer.innerHTML = `
        <div class="fleet-item driver-assigned">
            <div class="driver-bus-badge">🚌 Your Assigned Vehicle</div>
            <div class="chip active" onclick="changeBus('${driverBusId}')">${busDisplayName}</div>
            <button class="btn-reset-bus" onclick="event.stopPropagation(); showResetConfirm('${driverBusId}')" title="Reset ${busDisplayName}">↺</button>
        </div>
    `;
}

// Render fleet list for parents - only show their child's assigned bus (NO reset button)
function renderParentFleetList(parentBusId) {
    const fleetContainer = document.querySelector('.fleet-list');
    if (!fleetContainer) return;
    
    const busDisplayName = formatBusID(parentBusId);
    
    fleetContainer.innerHTML = `
        <div class="fleet-item parent-assigned">
            <div class="parent-bus-badge">🎒 Your Child's Bus</div>
            <div class="chip active" onclick="changeBus('${parentBusId}')">${busDisplayName}</div>
        </div>
    `;
}

// Render full fleet list for admin/parent
function renderFullFleetList() {
    const fleetContainer = document.querySelector('.fleet-list');
    if (!fleetContainer) return;
    
    const buses = ['bus01', 'bus02', 'bus03', 'bus04', 'bus05', 'bus06'];
    let html = '';
    
    buses.forEach((busId, index) => {
        const isActive = busId === activeBusID;
        const activeClass = isActive ? 'active' : '';
        html += `
            <div class="fleet-item">
                <div class="chip ${activeClass}" onclick="changeBus('${busId}')">${formatBusID(busId)}</div>
                <button class="btn-reset-bus" onclick="event.stopPropagation(); showResetConfirm('${busId}')" title="Reset ${formatBusID(busId)}">↺</button>
            </div>
        `;
    });
    
    fleetContainer.innerHTML = html;
}

// --- 2. TOMTOM SEARCH API & ROUTING ---

// Known locations with EXACT coordinates as specified
const KNOWN_LOCATIONS = {
    // Shree L.R. Tiwari College of Engineering - EXACT COORDINATES
    'shree l.r. tiwari college of engineering': { lat: 19.282, lng: 72.855, name: 'Shree L.R. Tiwari College of Engineering' },
    'shree l.r. tiwari college': { lat: 19.282, lng: 72.855, name: 'Shree L.R. Tiwari College of Engineering' },
    'l.r. tiwari college': { lat: 19.282, lng: 72.855, name: 'Shree L.R. Tiwari College of Engineering' },
    'lr tiwari college': { lat: 19.282, lng: 72.855, name: 'Shree L.R. Tiwari College of Engineering' },
    'tiwari college': { lat: 19.282, lng: 72.855, name: 'Shree L.R. Tiwari College of Engineering' },
    'l r tiwari': { lat: 19.282, lng: 72.855, name: 'Shree L.R. Tiwari College of Engineering' },
    'i.r. tiwari college of engg': { lat: 19.282, lng: 72.855, name: 'Shree L.R. Tiwari College of Engineering' },
    'i.r. tiwari college': { lat: 19.282, lng: 72.855, name: 'Shree L.R. Tiwari College of Engineering' },
    'ir tiwari': { lat: 19.282, lng: 72.855, name: 'Shree L.R. Tiwari College of Engineering' },
    // Mira Road Railway Station - EXACT COORDINATES
    'mira road station': { lat: 19.281, lng: 72.855, name: 'Mira Road Railway Station' },
    'mira road railway station': { lat: 19.281, lng: 72.855, name: 'Mira Road Railway Station' },
    'mira road': { lat: 19.281, lng: 72.855, name: 'Mira Road Railway Station' },
    'mira road rly station': { lat: 19.281, lng: 72.855, name: 'Mira Road Railway Station' }
};

function searchAndMove(type) {
    // Set interaction flag when user is searching/changing location
    isUserInteracting = true;
    lastUserActionTime = Date.now();
    
    const q = document.getElementById(type === 'current' ? 'search-src' : 'search-dest').value.trim();
    if (!q) {
        isUserInteracting = false;
        return;
    }
    
    // Check if it's a known location first
    const normalizedQuery = q.toLowerCase().trim();
    const knownLocation = KNOWN_LOCATIONS[normalizedQuery];
    
    if (knownLocation) {
        // Use known coordinates for better accuracy
        if (type === 'current') {
            startCoords = { lat: knownLocation.lat, lng: knownLocation.lng, name: knownLocation.name };
        } else {
            endCoords = { lat: knownLocation.lat, lng: knownLocation.lng, name: knownLocation.name };
        }
        
        // Update fleet data
        let fleet = JSON.parse(localStorage.getItem("fleet_data")) || {};
        if(!fleet[activeBusID]) fleet[activeBusID] = { active: false };

        if (type === 'current') {
            fleet[activeBusID].lat = knownLocation.lat;
            fleet[activeBusID].lng = knownLocation.lng;
            fleet[activeBusID].from = knownLocation.name;
        } else {
            fleet[activeBusID].dLat = knownLocation.lat;
            fleet[activeBusID].dLng = knownLocation.lng;
            fleet[activeBusID].to = knownLocation.name;
        }
        localStorage.setItem("fleet_data", JSON.stringify(fleet));

        // Update markers and route
        updateMarkersAndRoute();
        syncData();
        showToast(`Location set: ${knownLocation.name}`);
        
        // Release interaction flag after action completes
        setTimeout(() => {
            isUserInteracting = false;
            lastUserActionTime = 0;
        }, INTERACTION_COOLDOWN);
        return;
    }

    // Use TomTom Search API for other locations
    tt.services.fuzzySearch({
        key: TOMTOM_KEY,
        query: q,
        center: [72.8557, 19.2813],
        radius: 15000, // 15km radius for Mira Bhayandar area
        idxSet: 'POI,Str,Geo',
        limit: 5, // Get multiple results for better accuracy
        countrySet: 'IN',
        language: 'en-GB'
    }).then((res) => {
        if (res.results && res.results.length > 0) {
            // Find the best match
            let bestMatch = res.results[0];
            
            // If multiple results, try to find the most relevant one
            if (res.results.length > 1) {
                for (const result of res.results) {
                    const poiName = result.poi ? result.poi.name : '';
                    const address = result.address ? result.address.freeformAddress : '';
                    const combined = (poiName + ' ' + address).toLowerCase();
                    
                    // Check if this result matches keywords from query
                    const queryWords = normalizedQuery.split(' ');
                    let matchScore = 0;
                    for (const word of queryWords) {
                        if (word.length > 2 && combined.includes(word)) {
                            matchScore++;
                        }
                    }
                    
                    if (matchScore >= queryWords.length * 0.5) {
                        bestMatch = result;
                        break;
                    }
                }
            }
            
            const pos = bestMatch.position;
            const placeName = bestMatch.poi ? bestMatch.poi.name : 
                             (bestMatch.address ? bestMatch.address.freeformAddress : q);
            
            // Store coordinates
            if (type === 'current') {
                startCoords = { lat: pos.lat, lng: pos.lng, name: placeName };
            } else {
                endCoords = { lat: pos.lat, lng: pos.lng, name: placeName };
            }

            // Update fleet data
            let fleet = JSON.parse(localStorage.getItem("fleet_data")) || {};
            if(!fleet[activeBusID]) fleet[activeBusID] = { active: false };

            if (type === 'current') {
                fleet[activeBusID].lat = pos.lat;
                fleet[activeBusID].lng = pos.lng;
                fleet[activeBusID].from = placeName;
            } else {
                fleet[activeBusID].dLat = pos.lat;
                fleet[activeBusID].dLng = pos.lng;
                fleet[activeBusID].to = placeName;
            }
            localStorage.setItem("fleet_data", JSON.stringify(fleet));

            // Update markers and route
            updateMarkersAndRoute();
            syncData();
            showToast(`Location found: ${placeName}`);
            
            // Release interaction flag after action completes
            setTimeout(() => {
                isUserInteracting = false;
                lastUserActionTime = 0;
            }, INTERACTION_COOLDOWN);
        } else {
            showToast("Location not found. Please try a different search.");
            isUserInteracting = false;
            lastUserActionTime = 0;
        }
    }).catch(err => {
        console.error('Search error:', err);
        showToast("Error searching location. Please try again.");
        isUserInteracting = false;
        lastUserActionTime = 0;
    });
}

// Update markers with blue (start) and red (end) colors, draw route, auto-zoom
function updateMarkersAndRoute() {
    // Clear existing markers
    if (busMarker) { busMarker.remove(); busMarker = null; }
    if (destMarker) { destMarker.remove(); destMarker = null; }
    if (routeLayer) { map.removeLayer(routeLayer); routeLayer = null; }
    if (map.getSource('route-source')) { map.removeSource('route-source'); }

    const bounds = new tt.LngLatBounds();
    let hasMarkers = false;

    // Add BLUE marker at start location with enhanced visibility
    if (startCoords) {
        const el = document.createElement('div');
        el.className = 'custom-marker';
        el.innerHTML = `
            <div style="
                width: 32px;
                height: 32px;
                background: linear-gradient(135deg, #2563eb 0%, #3b82f6 100%);
                border-radius: 50%;
                border: 4px solid white;
                box-shadow: 0 4px 12px rgba(37, 99, 235, 0.5), 0 0 0 4px rgba(37, 99, 235, 0.2);
                display: flex;
                align-items: center;
                justify-content: center;
            ">
                <span style="color: white; font-size: 14px;">A</span>
            </div>
        `;
        
        busMarker = new tt.Marker({ element: el })
            .setLngLat([startCoords.lng, startCoords.lat])
            .setPopup(new tt.Popup().setHTML('<b style="color:#2563eb;">Start:</b> ' + startCoords.name))
            .addTo(map);
        
        bounds.extend([startCoords.lng, startCoords.lat]);
        hasMarkers = true;
    }

    // Add RED marker at end location with enhanced visibility
    if (endCoords) {
        const el = document.createElement('div');
        el.className = 'custom-marker';
        el.innerHTML = `
            <div style="
                width: 32px;
                height: 32px;
                background: linear-gradient(135deg, #dc2626 0%, #ef4444 100%);
                border-radius: 50%;
                border: 4px solid white;
                box-shadow: 0 4px 12px rgba(220, 38, 38, 0.5), 0 0 0 4px rgba(220, 38, 38, 0.2);
                display: flex;
                align-items: center;
                justify-content: center;
            ">
                <span style="color: white; font-size: 14px;">B</span>
            </div>
        `;
        
        destMarker = new tt.Marker({ element: el })
            .setLngLat([endCoords.lng, endCoords.lat])
            .setPopup(new tt.Popup().setHTML('<b style="color:#dc2626;">Destination:</b> ' + endCoords.name))
            .addTo(map);
        
        bounds.extend([endCoords.lng, endCoords.lat]);
        hasMarkers = true;
    }

    // Auto-zoom to fit both markers
    if (hasMarkers) {
        map.fitBounds(bounds, { padding: 100, maxZoom: 16, duration: 1000 });
    }

    // Draw precise driving route if both points exist
    if (startCoords && endCoords) {
        drawPreciseRoute();
    }
}

// Draw precise driving route polyline
function drawPreciseRoute() {
    if (!startCoords || !endCoords) return;

    console.log('Calculating route from:', startCoords, 'to:', endCoords);

    tt.services.calculateRoute({
        key: TOMTOM_KEY,
        locations: `${startCoords.lng},${startCoords.lat}:${endCoords.lng},${endCoords.lat}`,
        travelMode: 'bus',
        routeType: 'fastest',
        traffic: true
    }).then((res) => {
        console.log('Route response:', res);
        
        if (res.routes && res.routes.length > 0) {
            const route = res.routes[0];
            
            // Check if route has legs and points
            if (!route.legs || route.legs.length === 0) {
                console.error('Route has no legs');
                showToast("Could not calculate route: No valid path found.");
                return;
            }
            
            const geoJson = route.toGeoJson();
            
            // Calculate ETA
            const travelTimeMinutes = Math.ceil(route.summary.travelTimeInSeconds / 60);
            
            // Update fleet data with ETA for THIS specific bus
            let fleet = JSON.parse(localStorage.getItem("fleet_data")) || {};
            if(!fleet[activeBusID]) fleet[activeBusID] = { active: false };
            fleet[activeBusID].eta = travelTimeMinutes;
            fleet[activeBusID].from = startCoords.name;
            fleet[activeBusID].to = endCoords.name;
            localStorage.setItem("fleet_data", JSON.stringify(fleet));

            // Remove existing route layers first
            removeRouteLayers();

            // Add route source and layer with HIGH VISIBILITY
            map.addSource('route-source', { type: 'geojson', data: geoJson });
            
            // Add glow effect layer (bottom)
            map.addLayer({
                'id': 'route-glow',
                'type': 'line',
                'source': 'route-source',
                'paint': {
                    'line-color': '#3b82f6',
                    'line-width': 12,
                    'line-opacity': 0.3,
                    'line-blur': 8
                }
            });
            
            // Add main route layer
            routeLayer = map.addLayer({
                'id': 'route-path',
                'type': 'line',
                'source': 'route-source',
                'paint': {
                    'line-color': '#2563eb',
                    'line-width': 6,
                    'line-opacity': 1,
                    'line-cap': 'round',
                    'line-join': 'round'
                }
            });
            
            // Add inner highlight layer
            map.addLayer({
                'id': 'route-inner',
                'type': 'line',
                'source': 'route-source',
                'paint': {
                    'line-color': '#60a5fa',
                    'line-width': 2,
                    'line-opacity': 0.8
                }
            });

            // Auto-zoom to fit the entire route perfectly
            const routeBounds = new tt.LngLatBounds();
            
            // Add all route points to bounds
            if (geoJson.coordinates && geoJson.coordinates.length > 0) {
                geoJson.coordinates.forEach(coord => {
                    routeBounds.extend(coord);
                });
            }
            
            // Ensure both markers are included
            routeBounds.extend([startCoords.lng, startCoords.lat]);
            routeBounds.extend([endCoords.lng, endCoords.lat]);
            
            // Fit map to bounds with padding
            map.fitBounds(routeBounds, { 
                padding: { top: 100, bottom: 100, left: 100, right: 100 },
                maxZoom: 17,
                duration: 1200,
                easing: (t) => t * (2 - t) // Smooth ease-out
            });

            syncData();
            showToast(`Route calculated: ${travelTimeMinutes} mins ETA for ${formatBusID(activeBusID)}`);
        } else {
            console.error('No routes in response');
            showToast("Could not calculate route: No routes found.");
        }
    }).catch(err => {
        console.error('Route calculation error:', err);
        // More specific error handling
        let errorMsg = "Could not calculate route. ";
        if (err.message && err.message.includes('Bad Request')) {
            errorMsg += "Invalid coordinates. Please re-enter locations.";
        } else if (err.message && err.message.includes('Network')) {
            errorMsg += "Network error. Please check connection.";
        } else {
            errorMsg += "Please verify both locations are valid.";
        }
        showToast(errorMsg);
    });
}

// Helper function to remove all route layers
function removeRouteLayers() {
    if (map.getLayer('route-inner')) map.removeLayer('route-inner');
    if (map.getLayer('route-path')) map.removeLayer('route-path');
    if (map.getLayer('route-glow')) map.removeLayer('route-glow');
    if (map.getSource('route-source')) map.removeSource('route-source');
}

// --- 3. DATA SYNC & UI ---
function syncData() {
    // Skip sync if user is currently interacting or resetting
    const now = Date.now();
    if (isResetting) {
        console.log('Sync skipped: Reset in progress');
        updateSyncStatus();
        return;
    }
    
    if (isUserInteracting && (now - lastUserActionTime) < INTERACTION_COOLDOWN) {
        console.log('Sync skipped: User interaction cooldown active');
        updateSyncStatus();
        return;
    }
    
    // Hide sync status when sync is active
    hideSyncStatus();
    
    const fleet = JSON.parse(localStorage.getItem("fleet_data"));
    const role = sessionStorage.getItem("active_role") || localStorage.getItem("saved_user_role");
    
    // Update the Bus ID display text (e.g., "Bus BUS01" -> "Bus B-01")
    updateBusDisplayText();
    
    if (!fleet || !fleet[activeBusID]) return;
    const d = fleet[activeBusID];

    if (role !== 'driver') {
        document.getElementById('m-bus-id').innerText = "VEHICLE: " + formatBusID(activeBusID);
        document.getElementById('m-from').innerText = "From: " + (d.from || "--");
        document.getElementById('m-to').innerText = "To: " + (d.to || "--");
        document.getElementById('m-eta').innerText = d.eta || "--";
        if(d.eta) {
            const p = Math.min(100, Math.max(0, 100 - (d.eta * 2.5)));
            document.getElementById('m-progress').style.width = p + "%";
            document.getElementById('m-bus-icon').style.left = p + "%";
        }
    } else {
        document.getElementById('d-bus-id').innerText = formatBusID(activeBusID);
        document.getElementById('d-eta-text').innerText = d.eta || "--";
        document.getElementById('driver-eta-box').style.display = d.eta ? 'block' : 'none';
    }
}

// Format bus ID for display (bus01 -> B-01)
function formatBusID(id) {
    return id.replace(/bus(\d+)/i, 'B-$1').toUpperCase();
}

// Update the Bus display text below inputs
function updateBusDisplayText() {
    const monitorTitle = document.getElementById('m-bus-id');
    if (monitorTitle) {
        monitorTitle.innerText = "VEHICLE: " + formatBusID(activeBusID);
    }
}

// --- UTILS ---
function changeBus(id) {
    // Set interaction flag when switching buses
    isUserInteracting = true;
    lastUserActionTime = Date.now();
    
    activeBusID = id;
    sessionStorage.setItem("active_bus", id);
    updateChipUI(id);
    
    // Clear existing route and markers
    removeRouteLayers();
    if (busMarker) { busMarker.remove(); busMarker = null; }
    if (destMarker) { destMarker.remove(); destMarker = null; }
    
    // Restore coordinates for new bus if exists
    let fleet = JSON.parse(localStorage.getItem("fleet_data")) || {};
    if (fleet[id]) {
        if (fleet[id].lat && fleet[id].lng) {
            startCoords = { lat: fleet[id].lat, lng: fleet[id].lng, name: fleet[id].from || 'Start' };
        } else {
            startCoords = null;
        }
        if (fleet[id].dLat && fleet[id].dLng) {
            endCoords = { lat: fleet[id].dLat, lng: fleet[id].dLng, name: fleet[id].to || 'Destination' };
        } else {
            endCoords = null;
        }
        
        // Update markers and route for this bus
        updateMarkersAndRoute();
        
        // Calculate unique ETA for this bus if both coords exist
        if (startCoords && endCoords) {
            calculateBusETA(id);
        }
    } else {
        startCoords = null;
        endCoords = null;
    }
    
    // Update input fields with this bus's data
    updateInputFields(fleet[id]);
    
    syncData();
    showToast(`Selected Bus ${formatBusID(id)}`);
    
    // Release interaction flag after action completes
    setTimeout(() => {
        isUserInteracting = false;
        lastUserActionTime = 0;
    }, INTERACTION_COOLDOWN);
}

// Calculate unique ETA for a specific bus
function calculateBusETA(busId) {
    if (!startCoords || !endCoords) return;
    
    tt.services.calculateRoute({
        key: TOMTOM_KEY,
        locations: `${startCoords.lng},${startCoords.lat}:${endCoords.lng},${endCoords.lat}`,
        travelMode: 'bus',
        routeType: 'fastest',
        traffic: true
    }).then((res) => {
        if (res.routes && res.routes.length > 0) {
            const route = res.routes[0];
            const travelTimeMinutes = Math.ceil(route.summary.travelTimeInSeconds / 60);
            
            // Store unique ETA for this specific bus
            let fleet = JSON.parse(localStorage.getItem("fleet_data")) || {};
            if(!fleet[busId]) fleet[busId] = { active: false };
            fleet[busId].eta = travelTimeMinutes;
            localStorage.setItem("fleet_data", JSON.stringify(fleet));
            
            syncData();
            showToast(`${formatBusID(busId)} ETA: ${travelTimeMinutes} mins`);
        }
    }).catch(err => {
        console.error('ETA calculation error for', busId, err);
    });
}

// Update input fields with bus data
function updateInputFields(busData) {
    const srcInput = document.getElementById('search-src');
    const destInput = document.getElementById('search-dest');
    
    if (srcInput && busData && busData.from) {
        srcInput.value = busData.from;
    } else if (srcInput) {
        srcInput.value = '';
    }
    
    if (destInput && busData && busData.to) {
        destInput.value = busData.to;
    } else if (destInput) {
        destInput.value = '';
    }
}

// Custom Confirmation Modal State
let pendingResetBusId = null;

// Show custom confirmation modal
function showResetConfirm(busId) {
    // Set interaction flag to prevent auto-refresh during reset
    isUserInteracting = true;
    isResetting = true;
    lastUserActionTime = Date.now();
    
    pendingResetBusId = busId;
    const modal = document.getElementById('confirm-modal');
    const message = document.getElementById('modal-message');
    
    message.innerHTML = `Are you sure you want to reset <strong>${formatBusID(busId)}</strong>?<br>This will clear all trip data and route information.`;
    
    modal.classList.add('active');
}

// Close confirmation modal
function closeConfirmModal() {
    const modal = document.getElementById('confirm-modal');
    modal.classList.remove('active');
    pendingResetBusId = null;
    
    // Reset interaction flags after a short delay
    setTimeout(() => {
        isResetting = false;
        isUserInteracting = false;
        lastUserActionTime = 0;
    }, 500);
}

// Execute reset after confirmation
function executeReset() {
    if (pendingResetBusId) {
        performReset(pendingResetBusId);
        closeConfirmModal();
    }
}

// Perform the actual reset
function performReset(busId) {
    // Set resetting flag
    isResetting = true;
    lastUserActionTime = Date.now();
    
    // Clear fleet data for this bus
    let fleet = JSON.parse(localStorage.getItem("fleet_data")) || {};
    fleet[busId] = { 
        active: false,
        eta: null,
        from: null,
        to: null,
        lat: null,
        lng: null,
        dLat: null,
        dLng: null
    };
    localStorage.setItem("fleet_data", JSON.stringify(fleet));
    
    // If this is the currently active bus, clear the map
    if (activeBusID === busId) {
        removeRouteLayers();
        if (busMarker) { busMarker.remove(); busMarker = null; }
        if (destMarker) { destMarker.remove(); destMarker = null; }
        startCoords = null;
        endCoords = null;
        
        // Clear input fields
        const srcInput = document.getElementById('search-src');
        const destInput = document.getElementById('search-dest');
        if (srcInput) srcInput.value = '';
        if (destInput) destInput.value = '';
        
        // Hide ETA box
        const etaBox = document.getElementById('driver-eta-box');
        if (etaBox) etaBox.style.display = 'none';
    }
    
    syncData();
    showToast(`Bus ${formatBusID(busId)} reset successfully`);
    
    // Reset flags after completion
    setTimeout(() => {
        isResetting = false;
        isUserInteracting = false;
        lastUserActionTime = 0;
    }, 1000);
}

// Legacy reset function (redirects to modal)
function resetBus(busId) {
    showResetConfirm(busId);
}

function updateChipUI(id) {
    document.querySelectorAll('.chip').forEach(c => {
        // Match button text like "B-01" with id like "bus01"
        const chipId = c.innerText.toLowerCase().replace("-", "").replace("b", "bus");
        const isActive = chipId === id;
        c.classList.toggle('active', isActive);
        
        // Add visual active state styling
        if (isActive) {
            c.style.background = 'linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%)';
            c.style.borderColor = '#3b82f6';
            c.style.color = '#1d4ed8';
            c.style.boxShadow = '0 4px 15px rgba(59,130,246,0.2)';
        } else {
            c.style.background = '';
            c.style.borderColor = '';
            c.style.color = '';
            c.style.boxShadow = '';
        }
    });
    
    // Update reset button states
    document.querySelectorAll('.fleet-item').forEach(item => {
        const chip = item.querySelector('.chip');
        const resetBtn = item.querySelector('.btn-reset-bus');
        if (chip && resetBtn) {
            const chipId = chip.innerText.toLowerCase().replace("-", "").replace("b", "bus");
            if (chipId === id) {
                resetBtn.style.borderColor = '#3b82f6';
                resetBtn.style.color = '#3b82f6';
            } else {
                resetBtn.style.borderColor = '';
                resetBtn.style.color = '';
            }
        }
    });
}

function drawRoute(id) {
    const fleet = JSON.parse(localStorage.getItem("fleet_data"));
    const d = fleet[id];
    tt.services.calculateRoute({ key: TOMTOM_KEY, locations: `${d.lng},${d.lat}:${d.dLng},${d.dLat}`, travelMode: 'truck' })
    .then((res) => {
        d.eta = Math.floor(res.routes[0].summary.travelTimeInSeconds / 60) + 5;
        localStorage.setItem("fleet_data", JSON.stringify(fleet));
        const g = res.toGeoJson();
        if (map.getLayer('route-path')) { map.removeLayer('route-path'); map.removeSource('route-path'); }
        map.addLayer({ 'id': 'route-path', 'type': 'line', 'source': { 'type': 'geojson', 'data': g }, 'paint': { 'line-color': '#2563eb', 'line-width': 6 } });
        syncData();
    });
}

function initMap() { 
    if(map) map.remove(); 
    map = tt.map({ 
        key: TOMTOM_KEY, 
        container: 'map', 
        center: [72.8557, 19.2813], 
        zoom: 14 
    }); 
    
    map.on('load', () => { 
        map.resize(); 
        syncData(); 
        
        // Fix map rendering on mobile after load
        setTimeout(() => {
            map.invalidateSize();
        }, 500);
    }); 
    
    // Handle window resize for mobile
    window.addEventListener('resize', () => {
        if (map) {
            map.invalidateSize();
        }
    });
    
    // Handle orientation change on mobile
    window.addEventListener('orientationchange', () => {
        setTimeout(() => {
            if (map) {
                map.invalidateSize();
            }
        }, 300);
    });
    
    setInterval(syncData, 5000); 
}

// GPS Location function for mobile users
function getUserLocation() {
    // Set interaction flag
    isUserInteracting = true;
    lastUserActionTime = Date.now();
    updateSyncStatus();
    
    if (navigator.geolocation) {
        showToast("Getting your location...");
        
        navigator.geolocation.getCurrentPosition(
            (pos) => {
                const lat = pos.coords.latitude;
                const lng = pos.coords.longitude;
                
                console.log("User location:", lat, lng);
                
                // Update startCoords with GPS location
                startCoords = { lat: lat, lng: lng, name: 'My Current Location' };
                
                // Update map view
                if (map) {
                    map.setView([lng, lat], 16);
                }
                
                // Update fleet data
                let fleet = JSON.parse(localStorage.getItem("fleet_data")) || {};
                if(!fleet[activeBusID]) fleet[activeBusID] = { active: false };
                fleet[activeBusID].lat = lat;
                fleet[activeBusID].lng = lng;
                fleet[activeBusID].from = 'My Current Location';
                localStorage.setItem("fleet_data", JSON.stringify(fleet));
                
                // Update input field
                const srcInput = document.getElementById('search-src');
                if (srcInput) {
                    srcInput.value = 'My Current Location';
                }
                
                // Update markers and route
                updateMarkersAndRoute();
                syncData();
                
                showToast("Location detected successfully!");
                
                // Release interaction flag
                setTimeout(() => {
                    isUserInteracting = false;
                    lastUserActionTime = 0;
                    hideSyncStatus();
                }, INTERACTION_COOLDOWN);
            },
            (error) => {
                console.error("Geolocation error:", error);
                
                let errorMsg = "Unable to get your location. ";
                switch(error.code) {
                    case error.PERMISSION_DENIED:
                        errorMsg += "Please enable location permissions in your browser settings.";
                        break;
                    case error.POSITION_UNAVAILABLE:
                        errorMsg += "Location information is unavailable.";
                        break;
                    case error.TIMEOUT:
                        errorMsg += "Location request timed out. Please try again.";
                        break;
                    default:
                        errorMsg += "An unknown error occurred.";
                }
                
                showToast(errorMsg);
                
                // Release interaction flag
                isUserInteracting = false;
                lastUserActionTime = 0;
                hideSyncStatus();
            },
            {
                enableHighAccuracy: true,
                timeout: 10000,
                maximumAge: 0
            }
        );
    } else {
        showToast("Geolocation is not supported by your browser");
        isUserInteracting = false;
        lastUserActionTime = 0;
        hideSyncStatus();
    }
}
function publishTrip() { 
    // Set interaction flag when publishing
    isUserInteracting = true;
    lastUserActionTime = Date.now();
    
    let f = JSON.parse(localStorage.getItem("fleet_data")); 
    f[activeBusID].active = true; 
    localStorage.setItem("fleet_data", JSON.stringify(f)); 
    showToast(`Bus ${activeBusID.toUpperCase()} is LIVE!`); 
    
    // Release interaction flag after action completes
    setTimeout(() => {
        isUserInteracting = false;
        lastUserActionTime = 0;
    }, INTERACTION_COOLDOWN);
}
function logout() { 
    localStorage.removeItem('saved_user_role');
    localStorage.removeItem('temp_role');
    sessionStorage.clear(); 
    location.reload(); 
}
function switchRole() { 
    document.getElementById('app-container').style.display='none'; 
    document.getElementById('login-screen').style.display='flex'; 
    sessionStorage.clear(); 
}
function showToast(m) { 
    const t = document.getElementById('toast'); 
    t.innerText = m; 
    t.style.display = 'block'; 
    setTimeout(()=>t.style.display='none',3000); 
}
function resetLogin() { 
    document.getElementById('role-selection-v3').style.display='block'; 
    document.getElementById('auth-form-v3').style.display='none'; 
}

// Initialize on page load
window.onload = () => { 
    // Initialize fleet data
    initializeFleetData();
    
    // Check if user is logged in
    const savedRole = localStorage.getItem("saved_user_role");
    const isLoggedInSession = sessionStorage.getItem("is_logged_in");
    
    if (isLoggedInSession === "true" || savedRole) {
        launchDashboard();
    }
};