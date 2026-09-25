// 🦟 MOSQUISCAN - MAIN JAVASCRIPT
// ============================================================

const MODEL_URL =
    "https://teachablemachine.withgoogle.com/models/cKLAix4wn/";

let model = null;
let maxPredictions = 0;

let currentImage = null;
let currentAIResult = "";

let map = null;
let selectedLocationMarker = null;


// ============================================================
// DOM ELEMENTS
// ============================================================

const imageInput = document.getElementById("imageInput");
const imagePreview = document.getElementById("imagePreview");
const analyzeButton = document.getElementById("analyzeButton");
const aiResult = document.getElementById("aiResult");

const latitudeInput = document.getElementById("latitude");
const longitudeInput = document.getElementById("longitude");
const locationButton = document.getElementById("locationButton");

const inspectionDate = document.getElementById("inspectionDate");
const notesInput = document.getElementById("notes");

const saveButton = document.getElementById("saveButton");
const saveMessage = document.getElementById("saveMessage");

const recordsList = document.getElementById("recordsList");

const totalRecords = document.getElementById("totalRecords");
const possibleSites = document.getElementById("possibleSites");
const notPossibleSites = document.getElementById("notPossibleSites");


// ============================================================
// DEFAULT DATE
// ============================================================

if (inspectionDate) {

    const today = new Date();

    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, "0");
    const day = String(today.getDate()).padStart(2, "0");

    inspectionDate.value =
        `${year}-${month}-${day}`;
}


// ============================================================
// MAP
// ============================================================

if (document.getElementById("map")) {

    map = L.map("map").setView(
        [9.8167, 124.4833],
        12
    );

    L.tileLayer(
        "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
        {
            maxZoom: 19,
            attribution:
                "&copy; OpenStreetMap contributors"
        }
    ).addTo(map);


    map.on("click", function (event) {

        const lat = event.latlng.lat;
        const lng = event.latlng.lng;

        if (latitudeInput) {
            latitudeInput.value =
                lat.toFixed(6);
        }

        if (longitudeInput) {
            longitudeInput.value =
                lng.toFixed(6);
        }


        if (selectedLocationMarker) {
            map.removeLayer(
                selectedLocationMarker
            );
        }


        selectedLocationMarker =
            L.marker([lat, lng])
                .addTo(map);


        selectedLocationMarker
            .bindPopup(
                `<b>Selected Location</b><br>
                Latitude: ${lat.toFixed(6)}<br>
                Longitude: ${lng.toFixed(6)}`
            )
            .openPopup();

    });

}


// ============================================================
// LOAD AI MODEL
// ============================================================

async function loadAIModel() {

    try {

        if (!window.tmImage) {

            console.error(
                "Teachable Machine library was not loaded."
            );

            if (aiResult) {
                aiResult.textContent =
                    "AI library not loaded.";
            }

            return;
        }


        const modelURL =
            MODEL_URL + "model.json";

        const metadataURL =
            MODEL_URL + "metadata.json";


        console.log(
            "Loading MosquiScan AI..."
        );


        model = await tmImage.load(
            modelURL,
            metadataURL
        );


        maxPredictions =
            model.getTotalClasses();


        console.log(
            "MosquiScan AI Model Loaded!"
        );


        console.log(
            "Number of classes:",
            maxPredictions
        );


        if (model.getClassLabels) {

            console.log(
                "Model classes:",
                model.getClassLabels()
            );

        }


        if (analyzeButton) {
            analyzeButton.disabled = false;
        }


        if (aiResult) {

            aiResult.textContent =
                "AI model ready. Upload an image.";

            aiResult.className =
                "result-box";

        }


    } catch (error) {

        console.error(
            "AI model loading error:",
            error
        );


        if (aiResult) {

            aiResult.textContent =
                "AI model failed to load.";

        }


        if (analyzeButton) {
            analyzeButton.disabled = true;
        }

    }

}


// ============================================================
// IMAGE UPLOAD
// ============================================================

if (imageInput) {

    imageInput.addEventListener(
        "change",
        function (event) {

            const file =
                event.target.files[0];

            if (!file) {
                return;
            }


            currentImage = file;


            const reader =
                new FileReader();


            reader.onload =
                function (e) {

                    if (imagePreview) {

                        imagePreview.src =
                            e.target.result;

                        imagePreview.style.display =
                            "block";

                    }


                    if (analyzeButton) {
                        analyzeButton.disabled =
                            false;
                    }


                    if (aiResult) {

                        aiResult.textContent =
                            "Image ready for AI analysis.";

                        aiResult.className =
                            "result-box";

                    }

                };


            reader.readAsDataURL(file);

        }
    );

}


// ============================================================
// AI ANALYSIS
// ============================================================

if (analyzeButton) {

    analyzeButton.addEventListener(
        "click",
        async function () {

            if (!model) {

                alert(
                    "The AI model is still loading. Please wait."
                );

                return;
            }


            if (
                !imagePreview ||
                !imagePreview.src
            ) {

                alert(
                    "Please upload an image first."
                );

                return;
            }


            try {

                analyzeButton.disabled = true;

                analyzeButton.textContent =
                    "Analyzing...";


                if (aiResult) {

                    aiResult.innerHTML = `

                        <div class="ai-title">
                            🔄 AI is analyzing the image...
                        </div>

                    `;

                    aiResult.className =
                        "result-box result-loading";

                }


                // =====================================================
                // RUN TEACHABLE MACHINE
                // =====================================================

                const predictions =
                    await model.predict(
                        imagePreview
                    );


                console.log(
                    "===== MOSQUISCAN AI ====="
                );


                predictions.forEach(
                    function (prediction) {

                        console.log(
                            prediction.className +
                            ": " +
                            (
                                prediction.probability * 100
                            ).toFixed(2) +
                            "%"
                        );

                    }
                );


                // =====================================================
                // FIND HIGHEST PROBABILITY
                // =====================================================

                let highestPrediction =
                    predictions[0];


                for (
                    let i = 1;
                    i < predictions.length;
                    i++
                ) {

                    if (
                        predictions[i].probability >
                        highestPrediction.probability
                    ) {

                        highestPrediction =
                            predictions[i];

                    }

                }


                const className =
                    highestPrediction.className.trim();


                const confidence =
                    (
                        highestPrediction.probability * 100
                    ).toFixed(2);


                console.log(
                    "Final prediction:",
                    className
                );


                console.log(
                    "Confidence:",
                    confidence + "%"
                );


                // =====================================================
                // MOSQUISCAN EXPLANATION
                // =====================================================

                let resultTitle = "";
                let whyText = "";
                let recommendation = "";
                let resultClass = "result-box";


                // =====================================================
                // POSSIBLE BREEDING SITE
                // =====================================================

                if (
                    className ===
                    "Possible Breeding Site"
                ) {

                    currentAIResult =
                        "Possible Breeding Site";


                    resultTitle =
                        "⚠️ Possible Breeding Site";


                    whyText =
                        "The image is visually similar to examples in the training dataset that represent potential mosquito breeding environments.";


                    recommendation =
                        "🔎 Flag this location for human inspection.";


                    resultClass =
                        "result-box result-possible";

                }


                // =====================================================
                // NOT A POSSIBLE BREEDING SITE
                // =====================================================

                else if (
                    className ===
                    "Not a Possible Breeding Site"
                ) {

                    currentAIResult =
                        "Not a Possible Breeding Site";


                    resultTitle =
                        "✅ Not a Possible Breeding Site";


                    whyText =
                        "The image is more visually similar to examples classified as non-breeding environments, including visually similar conditions that may confuse the AI.";


                    recommendation =
                        "✔️ No potential breeding environment was identified from this image. Continue routine inspection when appropriate.";


                    resultClass =
                        "result-box result-not-possible";

                }


                // =====================================================
                // UNKNOWN CLASS
                // =====================================================

                else {

                    currentAIResult =
                        className;


                    resultTitle =
                        "ℹ️ " + className;


                    whyText =
                        "The AI returned a class that is not part of the expected MosquiScan classification categories.";


                    recommendation =
                        "🔎 Human verification is recommended.";


                    resultClass =
                        "result-box";

                }


                // =====================================================
                // DISPLAY RESULT
                // =====================================================

                if (aiResult) {

                    aiResult.innerHTML = `

                        <div class="ai-title">
                            ${resultTitle}
                        </div>


                        <div class="ai-confidence">

                            AI Confidence:
                            <strong>
                                ${confidence}%
                            </strong>

                        </div>


                        <div class="ai-why">

                            <strong>
                                💡 Why was this classified this way?
                            </strong>

                            <br>

                            ${whyText}

                        </div>


                        <div class="ai-recommendation">

                            <strong>
                                📌 Recommendation:
                            </strong>

                            <br>

                            ${recommendation}

                        </div>


                        <div class="ai-note">

                            ⚠️ This is an AI-assisted screening result.
                            It does not confirm actual mosquito breeding.
                            Human verification is required.

                        </div>

                    `;


                    aiResult.className =
                        resultClass;

                }

            }


            catch (error) {

                console.error(
                    "AI analysis error:",
                    error
                );


                if (aiResult) {

                    aiResult.innerHTML = `

                        <div class="ai-title">
                            ❌ AI analysis failed
                        </div>


                        <div class="ai-note">

                            Please check the uploaded image
                            and try again.

                        </div>

                    `;


                    aiResult.className =
                        "result-box";

                }

            }


            analyzeButton.disabled =
                false;


            analyzeButton.textContent =
                "Analyze Image";

        }
    );

}


// ============================================================
// CURRENT LOCATION
// ============================================================

if (locationButton) {

    locationButton.addEventListener(
        "click",
        function () {

            if (!navigator.geolocation) {

                alert(
                    "Geolocation is not supported."
                );

                return;
            }


            locationButton.disabled =
                true;


            locationButton.textContent =
                "Getting location...";


            navigator.geolocation.getCurrentPosition(

                function (position) {

                    const lat =
                        position.coords.latitude;


                    const lng =
                        position.coords.longitude;


                    if (latitudeInput) {

                        latitudeInput.value =
                            lat.toFixed(6);

                    }


                    if (longitudeInput) {

                        longitudeInput.value =
                            lng.toFixed(6);

                    }


                    if (map) {

                        map.setView(
                            [lat, lng],
                            17
                        );


                        if (selectedLocationMarker) {

                            map.removeLayer(
                                selectedLocationMarker
                            );

                        }


                        selectedLocationMarker =
                            L.marker([
                                lat,
                                lng
                            ]).addTo(map);


                        selectedLocationMarker
                            .bindPopup(
                                `<b>Current Location</b><br>
                                Latitude: ${lat.toFixed(6)}<br>
                                Longitude: ${lng.toFixed(6)}`
                            )
                            .openPopup();

                    }


                    locationButton.disabled =
                        false;


                    locationButton.textContent =
                        "Use Current Location";

                },


                function () {

                    alert(
                        "Unable to get your location. Enter the coordinates manually or click the map."
                    );


                    locationButton.disabled =
                        false;


                    locationButton.textContent =
                        "Use Current Location";

                }

            );

        }
    );

}


// ============================================================
// COMPRESS AND RESIZE IMAGE
// ============================================================
//
// Maximum saved image size: 800 px
// JPEG quality: 0.60
//
// This greatly reduces the amount of data stored in
// localStorage while keeping the image usable for records.
//

function compressImage(
    file,
    maxWidth = 800,
    quality = 0.60
) {

    return new Promise(
        function (resolve, reject) {

            const reader =
                new FileReader();


            reader.onload =
                function (event) {

                    const img =
                        new Image();


                    img.onload =
                        function () {

                            let width =
                                img.width;

                            let height =
                                img.height;


                            // Resize only if needed
                            if (
                                width >
                                maxWidth
                            ) {

                                const ratio =
                                    maxWidth /
                                    width;


                                width =
                                    maxWidth;


                                height =
                                    Math.round(
                                        height *
                                        ratio
                                    );

                            }


                            const canvas =
                                document.createElement(
                                    "canvas"
                                );


                            canvas.width =
                                width;


                            canvas.height =
                                height;


                            const ctx =
                                canvas.getContext(
                                    "2d"
                                );


                            ctx.imageSmoothingEnabled =
                                true;


                            ctx.imageSmoothingQuality =
                                "medium";


                            ctx.drawImage(
                                img,
                                0,
                                0,
                                width,
                                height
                            );


                            // Convert to compressed JPEG
                            const compressedImage =
                                canvas.toDataURL(
                                    "image/jpeg",
                                    quality
                                );


                            resolve(
                                compressedImage
                            );

                        };


                    img.onerror =
                        reject;


                    img.src =
                        event.target.result;

                };


            reader.onerror =
                reject;


            reader.readAsDataURL(file);

        }
    );

}


// ============================================================
// SAVE INSPECTION
// ============================================================

if (saveButton) {

    saveButton.addEventListener(
        "click",
        async function () {

            if (!currentImage) {

                alert(
                    "Please upload an image first."
                );

                return;
            }


            if (!currentAIResult) {

                alert(
                    "Please analyze the image first."
                );

                return;
            }


            if (
                !latitudeInput ||
                !latitudeInput.value.trim()
            ) {

                alert(
                    "Please enter or select a latitude."
                );

                return;
            }


            if (
                !longitudeInput ||
                !longitudeInput.value.trim()
            ) {

                alert(
                    "Please enter or select a longitude."
                );

                return;
            }


            try {

                saveButton.disabled =
                    true;


                saveButton.textContent =
                    "Compressing & Saving...";


                // Compress BEFORE storing
                const compressedImage =
                    await compressImage(
                        currentImage,
                        800,
                        0.60
                    );


                // Calculate approximate size
                const approximateSize =
                    Math.round(
                        (
                            compressedImage.length *
                            3
                        ) / 4
                    );


                console.log(
                    "Compressed image size:",
                    (
                        approximateSize /
                        1024
                    ).toFixed(1),
                    "KB"
                );


                const record = {

                    id:
                        Date.now(),

                    image:
                        compressedImage,

                    result:
                        currentAIResult,

                    latitude:
                        latitudeInput.value.trim(),

                    longitude:
                        longitudeInput.value.trim(),

                    date:
                        inspectionDate
                            ? inspectionDate.value
                            : "",

                    timestamp:
                        new Date().toISOString(),

                    notes:
                        notesInput
                            ? notesInput.value.trim()
                            : ""

                };


                let records =
                    getSavedRecords();


                records.push(record);


                localStorage.setItem(
                    "mosquiscanRecords",
                    JSON.stringify(records)
                );


                if (saveMessage) {

                    saveMessage.textContent =
                        "Inspection saved successfully!";


                    saveMessage.style.color =
                        "#16a34a";

                }


                alert(
                    "Inspection saved successfully!"
                );


                // Reset
                currentImage = null;

                currentAIResult = "";


                if (imageInput) {

                    imageInput.value =
                        "";

                }


                if (imagePreview) {

                    imagePreview.src =
                        "";

                    imagePreview.style.display =
                        "none";

                }


                if (aiResult) {

                    aiResult.textContent =
                        "No analysis yet.";

                    aiResult.className =
                        "result-box";

                }


                if (notesInput) {

                    notesInput.value =
                        "";

                }


                updateDashboard();

                displayRecords();

                displayMapMarkers();


            }

            catch (error) {

                console.error(
                    "SAVE ERROR:",
                    error
                );


                if (
                    error.name ===
                    "QuotaExceededError"
                ) {

                    alert(
                        "Storage is full. Delete some old records and try again."
                    );

                }

                else {

                    alert(
                        "The inspection could not be saved."
                    );

                }

            }


            saveButton.disabled =
                false;


            saveButton.textContent =
                "💾 Save Inspection";

        }
    );

}


// ============================================================
// GET RECORDS
// ============================================================

function getSavedRecords() {

    try {

        const stored =
            localStorage.getItem(
                "mosquiscanRecords"
            );


        if (!stored) {

            return [];

        }


        const records =
            JSON.parse(stored);


        if (!Array.isArray(records)) {

            return [];

        }


        return records;

    }

    catch (error) {

        console.error(
            "Could not read records:",
            error
        );


        return [];

    }

}


// ============================================================
// DASHBOARD
// ============================================================

function updateDashboard() {

    const records =
        getSavedRecords();


    const possible =
        records.filter(
            function (record) {

                return (
                    record.result ===
                    "Possible Breeding Site"
                );

            }
        ).length;


    const notPossible =
        records.filter(
            function (record) {

                return (
                    record.result ===
                    "Not a Possible Breeding Site"
                );

            }
        ).length;


    if (totalRecords) {

        totalRecords.textContent =
            records.length;

    }


    if (possibleSites) {

        possibleSites.textContent =
            possible;

    }


    if (notPossibleSites) {

        notPossibleSites.textContent =
            notPossible;

    }

}


// ============================================================
// DISPLAY RECORDS
// ============================================================

function displayRecords() {

    if (!recordsList) {

        return;

    }


    const records =
        getSavedRecords();


    recordsList.innerHTML =
        "";


    if (records.length === 0) {

        recordsList.innerHTML =
            `
            <p class="no-records">
                No inspection records yet.
            </p>
            `;

        return;

    }


    const reversedRecords =
        [...records].reverse();


    reversedRecords.forEach(
        function (record) {

            const item =
                document.createElement(
                    "div"
                );


            item.className =
                "record-item";


            const isPossible =
                record.result ===
                "Possible Breeding Site";


            const resultClass =
                isPossible
                    ? "result-possible"
                    : "result-not-possible";


            item.innerHTML = `

                <div class="record-image">

                    <img
                        src="${record.image}"
                        alt="MosquiScan inspection image"
                    >

                </div>


                <div class="record-info">

                    <h3 class="${resultClass}">
                        ${record.result}
                    </h3>


                    <p>
                        <strong>Latitude:</strong>
                        ${record.latitude}
                    </p>


                    <p>
                        <strong>Longitude:</strong>
                        ${record.longitude}
                    </p>


                    <p>
                        <strong>Date:</strong>
                        ${record.date || "N/A"}
                    </p>


                    <p>
                        <strong>Notes:</strong>
                        ${record.notes || "None"}
                    </p>

                </div>

            `;


            recordsList.appendChild(
                item
            );

        }
    );

}


// ============================================================
// MAP MARKERS
// ============================================================

function displayMapMarkers() {

    if (!map) {

        return;

    }


    const records =
        getSavedRecords();


    map.eachLayer(
        function (layer) {

            if (
                layer instanceof L.Marker &&
                layer !== selectedLocationMarker
            ) {

                map.removeLayer(
                    layer
                );

            }

        }
    );


    records.forEach(
        function (record) {

            const lat =
                parseFloat(
                    record.latitude
                );


            const lng =
                parseFloat(
                    record.longitude
                );


            if (
                Number.isNaN(lat) ||
                Number.isNaN(lng)
            ) {

                return;

            }


            const isPossible =
                record.result ===
                "Possible Breeding Site";


            const markerColor =
                isPossible
                    ? "red"
                    : "green";


            const marker =
                L.circleMarker(
                    [lat, lng],
                    {
                        radius: 9,

                        color:
                            markerColor,

                        fillColor:
                            markerColor,

                        fillOpacity:
                            0.8
                    }
                ).addTo(map);


            const popupImage =
                record.image
                    ? `
                        <img
                            src="${record.image}"
                            style="
                                width:160px;
                                height:100px;
                                object-fit:cover;
                                border-radius:8px;
                                display:block;
                                margin:0 auto 8px;
                            "
                        >
                    `
                    : "";


            marker.bindPopup(`

                <div style="text-align:center;">

                    ${popupImage}

                    <strong>
                        ${record.result}
                    </strong>

                    <br><br>

                    Latitude:
                    ${record.latitude}

                    <br>

                    Longitude:
                    ${record.longitude}

                    <br>

                    Date:
                    ${record.date || "N/A"}

                </div>

            `);

        }
    );

}


// ============================================================
// CLEAR RECORDS
// ============================================================

const clearRecordsButton =
    document.getElementById(
        "clearRecordsButton"
    );


if (clearRecordsButton) {

    clearRecordsButton.addEventListener(
        "click",
        function () {

            const confirmed =
                confirm(
                    "Are you sure you want to delete all MosquiScan records?"
                );


            if (!confirmed) {

                return;

            }


            localStorage.removeItem(
                "mosquiscanRecords"
            );


            updateDashboard();

            displayRecords();

            displayMapMarkers();


            alert(
                "All records have been deleted."
            );

        }
    );

}


// ============================================================
// START MOSQUISCAN
// ============================================================

async function initializeMosquiScan() {

    console.log(
        "Starting MosquiScan..."
    );


    updateDashboard();

    displayRecords();

    displayMapMarkers();


    await loadAIModel();


    console.log(
        "MosquiScan is ready!"
    );

}


initializeMosquiScan();
