CTFd.plugin.run((_CTFd) => {
    const $ = _CTFd.lib.$;

    // Wait for Leaflet, Geocoder and Leaflet.Draw to be loaded
    const waitForDeps = setInterval(() => {
        if (window.L && window.L.Control.Geocoder && window.L.Control.Draw) {
            clearInterval(waitForDeps);
            initMap();
        }
    }, 100);

    function initMap() {
        // Get initial coordinates from form
        const initialLat = parseFloat($('#latitude').val());
        const initialLng = parseFloat($('#longitude').val());
        const hasCoords = !isNaN(initialLat) && !isNaN(initialLng);

        // Initialize the map
        const map = L.map('map-update').setView(
            hasCoords ? [initialLat, initialLng] : [0, 0],
            hasCoords ? 13 : 2
        );

        // Define base layers
        const osmLayer = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            maxZoom: 19,
            attribution: '© OpenStreetMap contributors'
        });

        const esriWorldImagery = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
            maxZoom: 19,
            attribution: 'Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community'
        });

        // Add default layer
        osmLayer.addTo(map);

        // Create layer control
        const baseLayers = {
            "Street Map": osmLayer,
            "Satellite": esriWorldImagery
        };
        L.control.layers(baseLayers).addTo(map);

        // Add geocoder control
        // Coordonnées saisies (décimal, DMS, DMM, N/S/E/W) => point exact ;
        // sinon recherche de lieu via Nominatim.
        const geocoder = L.Control.geocoder({
            defaultMarkGeocode: false,
            geocoder: L.Control.Geocoder.latLng({
                next: L.Control.Geocoder.nominatim(),
            }),
        }).addTo(map);

        let marker = hasCoords ? L.marker([initialLat, initialLng]).addTo(map) : null;
        let currentMode = 'point';

        // ---- Point + radius mode ----
        function updateCircles() {
            map.eachLayer((layer) => {
                if (layer instanceof L.Circle) {
                    map.removeLayer(layer);
                }
            });
            if (!marker || currentMode !== 'point') return;
            const tolerance = parseFloat($('input[name="tolerance_radius"]').val());
            if (isNaN(tolerance)) return;
            L.circle(marker.getLatLng(), {
                radius: tolerance,
                color: 'green',
                fillColor: '#3f3',
                fillOpacity: 0.2
            }).addTo(map);
        }

        function setPoint(latlng) {
            $('#latitude').val(latlng.lat.toFixed(10));
            $('#longitude').val(latlng.lng.toFixed(10));
            if (marker) {
                marker.setLatLng(latlng);
            } else {
                marker = L.marker(latlng).addTo(map);
            }
            updateCircles();
        }

        geocoder.on('markgeocode', function (event) {
            const center = event.geocode.center;
            if (currentMode === 'point') {
                setPoint(center);
            }
            map.fitBounds(event.geocode.bbox);
        });

        map.on('click', function (e) {
            if (currentMode !== 'point') return;
            setPoint(e.latlng);
        });

        $('#latitude, #longitude').on('change', function () {
            const lat = parseFloat($('#latitude').val());
            const lng = parseFloat($('#longitude').val());
            if (isNaN(lat) || isNaN(lng)) return;
            const latlng = L.latLng(lat, lng);
            setPoint(latlng);
            map.setView(latlng);
        });

        $('input[name="tolerance_radius"]').on('change', updateCircles);

        // ---- Polygon mode (Leaflet.Draw) ----
        const drawnItems = new L.FeatureGroup().addTo(map);
        const drawControl = new L.Control.Draw({
            draw: {
                polygon: { allowIntersection: false, showArea: false },
                marker: false,
                polyline: false,
                rectangle: false,
                circle: false,
                circlemarker: false,
            },
            edit: { featureGroup: drawnItems, remove: true },
        });

        function polygonCentroid(coords) {
            let lat = 0, lng = 0;
            coords.forEach((c) => { lat += c[0]; lng += c[1]; });
            return [lat / coords.length, lng / coords.length];
        }

        function serializePolygon() {
            let coords = [];
            drawnItems.eachLayer((layer) => {
                if (layer instanceof L.Polygon) {
                    coords = layer.getLatLngs()[0].map((p) => [p.lat, p.lng]);
                }
            });
            if (coords.length >= 3) {
                $('#polygon').val(JSON.stringify(coords));
                const c = polygonCentroid(coords);
                $('#latitude').val(c[0].toFixed(10));
                $('#longitude').val(c[1].toFixed(10));
            } else {
                $('#polygon').val('');
            }
        }

        map.on(L.Draw.Event.CREATED, function (e) {
            drawnItems.clearLayers(); // single polygon only
            drawnItems.addLayer(e.layer);
            serializePolygon();
        });
        map.on(L.Draw.Event.EDITED, serializePolygon);
        map.on(L.Draw.Event.DELETED, serializePolygon);

        // Load an existing polygon from the server-rendered hidden field
        function loadExistingPolygon() {
            const raw = $('#polygon').val();
            if (!raw) return false;
            let coords;
            try {
                coords = JSON.parse(raw);
            } catch (e) {
                return false;
            }
            if (!Array.isArray(coords) || coords.length < 3) return false;
            drawnItems.clearLayers();
            drawnItems.addLayer(L.polygon(coords));
            return true;
        }

        // ---- Mode switching ----
        function setMode(mode) {
            currentMode = mode;
            const isPolygon = mode === 'polygon';

            $('.geo-point-fields').toggle(!isPolygon);
            $('.geo-hint-point').toggle(!isPolygon);
            $('.geo-hint-polygon').toggle(isPolygon);
            $('#latitude, #longitude, input[name="tolerance_radius"]').prop('required', !isPolygon);

            if (isPolygon) {
                map.addControl(drawControl);
                if (marker) { map.removeLayer(marker); marker = null; }
                updateCircles(); // clears circles
            } else {
                map.removeControl(drawControl);
                drawnItems.clearLayers();
                $('#polygon').val('');
            }
        }

        $('input[name="geo_mode"]').on('change', function () {
            setMode(this.value);
        });

        // Initialize in the challenge's current mode
        const startMode = $('input[name="geo_mode"]:checked').val() || 'point';
        if (startMode === 'polygon') {
            loadExistingPolygon();
        }
        setMode(startMode);
        if (startMode === 'polygon' && drawnItems.getLayers().length) {
            map.fitBounds(drawnItems.getBounds());
        } else {
            updateCircles();
        }

        setTimeout(() => map.invalidateSize(), 200);
    }
});
