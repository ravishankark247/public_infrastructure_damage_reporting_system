// Public Infrastructure Damage Reporting System - Core Application Logic

let reportMap, reportMarker;
let liveMap, liveMarkersLayer;
let currentTicketData = null;

document.addEventListener("DOMContentLoaded", () => {
  initTabs();
  initReportMap();
  initLiveMap();
  initImageUpload();
  initReportForm();
  initTracking();
  initAuthorityPortal();
  loadAnalytics();

  // Load default ticket on tracker tab
  loadTicketDetails("PIDR-2026-0001");
});

/* -------------------------------------------------------------
 * 1. TAB NAVIGATION
 * ----------------------------------------------------------- */
function initTabs() {
  const navBtns = document.querySelectorAll(".nav-btn");
  navBtns.forEach(btn => {
    btn.addEventListener("click", () => {
      const targetTabId = btn.getAttribute("data-tab");
      navBtns.forEach(b => b.classList.remove("active"));
      btn.classList.add("active");

      document.querySelectorAll(".tab-pane").forEach(pane => {
        pane.classList.remove("active");
      });
      const activePane = document.getElementById(targetTabId);
      if (activePane) activePane.classList.add("active");

      // Invalidate maps for correct tile rendering
      if (targetTabId === "tab-report" && reportMap) {
        setTimeout(() => reportMap.invalidateSize(), 200);
      }
      if (targetTabId === "tab-map" && liveMap) {
        setTimeout(() => {
          liveMap.invalidateSize();
          loadLiveMapMarkers();
        }, 200);
      }
      if (targetTabId === "tab-authority") {
        loadAuthorityTable();
      }
      if (targetTabId === "tab-analytics") {
        loadAnalytics();
      }
    });
  });
}

/* -------------------------------------------------------------
 * 2. REPORT DAMAGE MAP
 * ----------------------------------------------------------- */
function initReportMap() {
  const defaultLat = 28.6139;
  const defaultLng = 77.2090;

  reportMap = L.map("reportMap").setView([defaultLat, defaultLng], 12);
  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    maxZoom: 19,
    attribution: "&copy; OpenStreetMap contributors"
  }).addTo(reportMap);

  reportMarker = L.marker([defaultLat, defaultLng], { draggable: true }).addTo(reportMap);

  reportMarker.on("dragend", function (e) {
    const coords = e.target.getLatLng();
    updateLocationInputs(coords.lat, coords.lng);
  });

  reportMap.on("click", function (e) {
    reportMarker.setLatLng(e.latlng);
    updateLocationInputs(e.latlng.lat, e.latlng.lng);
  });

  document.getElementById("btnDetectLocation").addEventListener("click", () => {
    const locStatus = document.getElementById("locStatus");
    if (!navigator.geolocation) {
      alert("Geolocation is not supported by your browser");
      return;
    }
    locStatus.innerText = "Detecting GPS...";
    navigator.geolocation.getCurrentPosition(
      pos => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        reportMap.setView([lat, lng], 15);
        reportMarker.setLatLng([lat, lng]);
        updateLocationInputs(lat, lng);
        locStatus.innerText = "GPS Location captured!";
      },
      err => {
        locStatus.innerText = "Could not get location. Please pin manually on map.";
      }
    );
  });
}

function updateLocationInputs(lat, lng) {
  document.getElementById("latitude").value = lat.toFixed(5);
  document.getElementById("longitude").value = lng.toFixed(5);
  // Attempt lightweight reverse geocoding via Nominatim
  fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`)
    .then(res => res.json())
    .then(data => {
      if (data && data.display_name) {
        document.getElementById("address_text").value = data.display_name;
      }
    })
    .catch(() => {});
}

/* -------------------------------------------------------------
 * 3. IMAGE UPLOAD & PREVIEW
 * ----------------------------------------------------------- */
function initImageUpload() {
  const dropzone = document.getElementById("dropzone");
  const photoInput = document.getElementById("photoInput");
  const previewContainer = document.getElementById("previewContainer");
  const imagePreview = document.getElementById("imagePreview");
  const previewName = document.getElementById("previewName");
  const btnRemovePhoto = document.getElementById("btnRemovePhoto");

  dropzone.addEventListener("click", () => photoInput.click());

  dropzone.addEventListener("dragover", e => {
    e.preventDefault();
    dropzone.style.borderColor = "#3b82f6";
  });

  dropzone.addEventListener("dragleave", () => {
    dropzone.style.borderColor = "#94a3b8";
  });

  dropzone.addEventListener("drop", e => {
    e.preventDefault();
    dropzone.style.borderColor = "#94a3b8";
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      photoInput.files = e.dataTransfer.files;
      handleFileSelected(e.dataTransfer.files[0]);
    }
  });

  photoInput.addEventListener("change", e => {
    if (e.target.files && e.target.files[0]) {
      handleFileSelected(e.target.files[0]);
    }
  });

  function handleFileSelected(file) {
    previewName.innerText = file.name;
    const reader = new FileReader();
    reader.onload = e => {
      imagePreview.src = e.target.result;
      previewContainer.style.display = "flex";
      dropzone.style.display = "none";
    };
    reader.readAsDataURL(file);
  }

  btnRemovePhoto.addEventListener("click", () => {
    photoInput.value = "";
    imagePreview.src = "";
    previewContainer.style.display = "none";
    dropzone.style.display = "block";
  });
}

/* -------------------------------------------------------------
 * 4. ISSUE SUBMISSION (CITIZEN PORTAL)
 * ----------------------------------------------------------- */
function initReportForm() {
  const form = document.getElementById("reportForm");
  const btnSubmit = document.getElementById("btnSubmitReport");

  form.addEventListener("submit", async e => {
    e.preventDefault();
    btnSubmit.disabled = true;
    btnSubmit.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> Submitting Report...`;

    const formData = new FormData(form);

    try {
      const res = await fetch("/api/v1/issues", {
        method: "POST",
        body: formData
      });
      const data = await res.json();

      if (res.ok) {
        document.getElementById("successTicketId").innerText = data.ticket_number;
        document.getElementById("successModal").classList.add("active");
        form.reset();
        document.getElementById("btnRemovePhoto").click();
      } else {
        alert("Submission failed: " + (data.detail || "Unknown error"));
      }
    } catch (err) {
      alert("Error submitting issue report: " + err.message);
    } finally {
      btnSubmit.disabled = false;
      btnSubmit.innerHTML = `<i class="fa-solid fa-paper-plane"></i> Submit Incident Report`;
    }
  });

  document.getElementById("btnSuccessClose").addEventListener("click", () => {
    document.getElementById("successModal").classList.remove("active");
  });

  document.getElementById("btnSuccessTrack").addEventListener("click", () => {
    const tkt = document.getElementById("successTicketId").innerText;
    document.getElementById("successModal").classList.remove("active");
    // Switch to track tab
    document.querySelector('[data-tab="tab-track"]').click();
    loadTicketDetails(tkt);
  });
}

/* -------------------------------------------------------------
 * 5. TICKET TRACKING & STATUS STEPPER
 * ----------------------------------------------------------- */
function initTracking() {
  document.getElementById("btnSearchTicket").addEventListener("click", () => {
    const tkt = document.getElementById("trackSearchInput").value.trim();
    if (tkt) loadTicketDetails(tkt);
  });

  document.querySelectorAll(".chip-btn").forEach(chip => {
    chip.addEventListener("click", () => {
      const tkt = chip.getAttribute("data-tkt");
      document.getElementById("trackSearchInput").value = tkt;
      loadTicketDetails(tkt);
    });
  });
}

async function loadTicketDetails(ticketNumber) {
  const container = document.getElementById("trackResultContainer");
  container.innerHTML = `<div style="text-align: center; padding: 2rem; color: #64748b;"><i class="fa-solid fa-spinner fa-spin fa-2x"></i><p style="margin-top: 0.5rem;">Fetching ticket ${ticketNumber}...</p></div>`;

  try {
    const res = await fetch(`/api/v1/issues/${ticketNumber}`);
    if (!res.ok) {
      container.innerHTML = `<div style="text-align: center; padding: 2rem; color: #ef4444;"><i class="fa-solid fa-triangle-exclamation fa-2x"></i><p style="margin-top: 0.5rem;">Ticket '${ticketNumber}' not found. Please verify the ticket ID.</p></div>`;
      return;
    }
    const issue = await res.json();
    currentTicketData = issue;
    renderTrackingView(issue);
  } catch (err) {
    container.innerHTML = `<p style="color: red;">Error: ${err.message}</p>`;
  }
}

function renderTrackingView(issue) {
  const container = document.getElementById("trackResultContainer");

  // Determine active steps
  const steps = ["Submitted", "Acknowledged", "In Progress", "Resolved"];
  const currentStatus = issue.status;
  const currentIndex = steps.indexOf(currentStatus);

  let stepperHtml = `<div class="stepper">`;
  steps.forEach((step, idx) => {
    let stepClass = "";
    if (idx < currentIndex) stepClass = "completed";
    else if (idx === currentIndex) stepClass = "active";
    if (currentStatus === "Resolved") stepClass = "completed";

    stepperHtml += `
      <div class="step ${stepClass}">
        <div class="step-circle">${idx < currentIndex || currentStatus === "Resolved" ? '<i class="fa-solid fa-check"></i>' : idx + 1}</div>
        <div class="step-label">${step}</div>
      </div>
    `;
  });
  stepperHtml += `</div>`;

  // Severity & Status Badges
  const severityBadgeClass = `badge-${issue.severity.toLowerCase()}`;
  const statusBadgeClass = `badge-${issue.status.toLowerCase().replace(" ", "-")}`;

  // Timeline list
  let timelineHtml = `<div style="border-left: 2px solid #e2e8f0; padding-left: 1.25rem; margin-left: 0.5rem; display: flex; flex-direction: column; gap: 1rem;">`;
  if (issue.timeline && issue.timeline.length > 0) {
    issue.timeline.forEach(t => {
      timelineHtml += `
        <div style="position: relative;">
          <div style="position: absolute; left: -1.7rem; top: 0; width: 14px; height: 14px; border-radius: 50%; background: #3b82f6; border: 2px solid white;"></div>
          <div style="font-size: 0.85rem; font-weight: 700; color: #1e3a8a;">${t.status} <span style="font-weight: 400; color: #94a3b8; font-size: 0.75rem;">• ${t.created_at}</span></div>
          <p style="font-size: 0.85rem; color: #475569; margin-top: 0.2rem;">${t.note}</p>
          <span style="font-size: 0.75rem; color: #64748b;">Actioned by: <strong>${t.updated_by}</strong></span>
        </div>
      `;
    });
  }
  timelineHtml += `</div>`;

  container.innerHTML = `
    ${stepperHtml}

    <div class="card" style="border-top: 4px solid #3b82f6;">
      <div style="display: flex; justify-content: space-between; align-items: flex-start; flex-wrap: wrap; gap: 0.5rem; margin-bottom: 1rem;">
        <div>
          <span class="badge ${statusBadgeClass}" style="margin-right: 0.5rem;">${issue.status}</span>
          <span class="badge ${severityBadgeClass}">Severity: ${issue.severity}</span>
          <h3 style="font-size: 1.35rem; color: #0f172a; margin-top: 0.5rem;">${issue.title}</h3>
          <p style="font-size: 0.9rem; color: #64748b;"><i class="fa-solid fa-location-dot"></i> ${issue.address_text} (${issue.ward_name || 'Ward'})</p>
        </div>
        <div style="text-align: right;">
          <span style="font-size: 0.8rem; color: #64748b;">Ticket Number</span>
          <div style="font-size: 1.2rem; font-weight: 700; color: #1e3a8a;">${issue.ticket_number}</div>
          <button type="button" id="btnUpvote" class="btn btn-secondary" style="font-size: 0.8rem; padding: 0.3rem 0.7rem; margin-top: 0.4rem;">
            <i class="fa-regular fa-thumbs-up"></i> Upvote (${issue.upvotes})
          </button>
        </div>
      </div>

      <div class="grid-2" style="margin-bottom: 1.5rem;">
        <div>
          <h4 style="font-size: 0.9rem; color: #334155; margin-bottom: 0.4rem;">Reported Defect Description</h4>
          <p style="font-size: 0.95rem; color: #1e293b; background: #f8fafc; padding: 0.75rem; border-radius: 6px; border: 1px solid #e2e8f0;">
            ${issue.description}
          </p>
          <div style="margin-top: 1rem; font-size: 0.85rem; color: #475569;">
            <p><strong>Assigned Authority:</strong> ${issue.department_name}</p>
            <p><strong>Department Nodal:</strong> ${issue.dept_email} | ${issue.dept_phone}</p>
            <p><strong>Field Engineer:</strong> ${issue.assigned_engineer || 'Under Triage'}</p>
            <p><strong>SLA Resolution Target:</strong> ${issue.sla_hours} Hours from intake</p>
          </div>
        </div>

        <div>
          <h4 style="font-size: 0.9rem; color: #334155; margin-bottom: 0.4rem;">Photographic Verification</h4>
          <div style="display: flex; gap: 1rem; flex-wrap: wrap;">
            <div>
              <span style="display: block; font-size: 0.75rem; font-weight: 700; color: #ef4444; margin-bottom: 0.2rem;">BEFORE REPAIR (Report Proof)</span>
              <img src="${issue.before_image || '/static/uploads/sample_pothole_before.jpg'}" style="width: 180px; height: 120px; object-fit: cover; border-radius: 6px; border: 2px solid #ef4444;" alt="Before Repair">
            </div>
            <div>
              <span style="display: block; font-size: 0.75rem; font-weight: 700; color: #10b981; margin-bottom: 0.2rem;">AFTER REPAIR (Completion Proof)</span>
              ${issue.after_image ?
                `<img src="${issue.after_image}" style="width: 180px; height: 120px; object-fit: cover; border-radius: 6px; border: 2px solid #10b981;" alt="After Repair">` :
                `<div style="width: 180px; height: 120px; background: #f1f5f9; border: 2px dashed #cbd5e1; border-radius: 6px; display: flex; align-items: center; justify-content: center; font-size: 0.75rem; color: #94a3b8; text-align: center; padding: 0.5rem;">Awaiting Field Resolution Proof</div>`
              }
            </div>
          </div>
          ${issue.resolution_notes ?
            `<div style="margin-top: 0.75rem; font-size: 0.85rem; background: #ecfdf5; border-left: 3px solid #10b981; padding: 0.5rem; color: #065f46;">
               <strong>Resolution Notes:</strong> ${issue.resolution_notes}
             </div>` : ''
          }
        </div>
      </div>

      <h4 style="font-size: 0.95rem; color: #1e3a8a; margin-bottom: 0.75rem;"><i class="fa-solid fa-list-check"></i> Audit History & Resolution Timeline</h4>
      ${timelineHtml}
    </div>
  `;

  // Upvote button handler
  document.getElementById("btnUpvote").addEventListener("click", async () => {
    try {
      const res = await fetch(`/api/v1/issues/${issue.ticket_number}/upvote`, { method: "POST" });
      const data = await res.json();
      document.getElementById("btnUpvote").innerHTML = `<i class="fa-solid fa-thumbs-up text-primary"></i> Upvoted (${data.upvotes})`;
      document.getElementById("btnUpvote").disabled = true;
    } catch (e) {
      alert("Failed to upvote: " + e.message);
    }
  });
}

/* -------------------------------------------------------------
 * 6. LIVE INCIDENT MAP
 * ----------------------------------------------------------- */
function initLiveMap() {
  liveMap = L.map("liveMap").setView([28.6250, 77.1800], 11);
  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    maxZoom: 19,
    attribution: "&copy; OpenStreetMap contributors"
  }).addTo(liveMap);

  liveMarkersLayer = L.layerGroup().addTo(liveMap);

  document.getElementById("mapFilterCategory").addEventListener("change", loadLiveMapMarkers);
  document.getElementById("mapFilterStatus").addEventListener("change", loadLiveMapMarkers);
}

async function loadLiveMapMarkers() {
  if (!liveMap) return;
  liveMarkersLayer.clearLayers();

  const catFilter = document.getElementById("mapFilterCategory").value;
  const statusFilter = document.getElementById("mapFilterStatus").value;

  try {
    const res = await fetch(`/api/v1/issues?category=${catFilter}&status=${statusFilter}`);
    const data = await res.json();

    data.issues.forEach(issue => {
      let markerColor = "#3b82f6";
      if (issue.severity === "Critical" || issue.severity === "High") markerColor = "#ef4444";
      if (issue.status === "In Progress") markerColor = "#f59e0b";
      if (issue.status === "Resolved") markerColor = "#10b981";

      const customIcon = L.divIcon({
        className: "custom-map-pin",
        html: `<div style="background-color: ${markerColor}; width: 24px; height: 24px; border-radius: 50%; border: 3px solid white; box-shadow: 0 2px 5px rgba(0,0,0,0.3); display: flex; align-items: center; justify-content: center; color: white; font-size: 10px; font-weight: bold;">!</div>`,
        iconSize: [24, 24],
        iconAnchor: [12, 12]
      });

      const marker = L.marker([issue.latitude, issue.longitude], { icon: customIcon });

      const popupContent = `
        <div style="font-size: 0.85rem; max-width: 220px;">
          <img src="${issue.before_image}" style="width: 100%; height: 90px; object-fit: cover; border-radius: 4px; margin-bottom: 0.3rem;">
          <strong style="color: #1e3a8a;">${issue.ticket_number}</strong>
          <h4 style="margin: 0.2rem 0; font-size: 0.9rem;">${issue.title}</h4>
          <span class="badge badge-${issue.status.toLowerCase().replace(' ', '-')}">${issue.status}</span>
          <p style="color: #64748b; font-size: 0.75rem; margin-top: 0.3rem;">${issue.address_text}</p>
          <button onclick="trackFromMap('${issue.ticket_number}')" style="margin-top: 0.4rem; background: #1e3a8a; color: white; border: none; padding: 0.25rem 0.5rem; border-radius: 4px; cursor: pointer; width: 100%;">Inspect Ticket</button>
        </div>
      `;

      marker.bindPopup(popupContent);
      liveMarkersLayer.addLayer(marker);
    });
  } catch (e) {
    console.error("Failed to load map markers", e);
  }
}

window.trackFromMap = function(ticketNumber) {
  document.querySelector('[data-tab="tab-track"]').click();
  document.getElementById("trackSearchInput").value = ticketNumber;
  loadTicketDetails(ticketNumber);
};

/* -------------------------------------------------------------
 * 7. AUTHORITY DISPATCH PORTAL
 * ----------------------------------------------------------- */
function initAuthorityPortal() {
  document.getElementById("btnRefreshAuthority").addEventListener("click", loadAuthorityTable);
  document.getElementById("authFilterDept").addEventListener("change", loadAuthorityTable);
  document.getElementById("authFilterStatus").addEventListener("change", loadAuthorityTable);
  document.getElementById("authSearch").addEventListener("input", loadAuthorityTable);

  // Modal controls
  document.getElementById("btnCloseAuthModal").addEventListener("click", closeAuthModal);
  document.getElementById("btnCancelAuthModal").addEventListener("click", closeAuthModal);

  document.getElementById("authUpdateForm").addEventListener("submit", async e => {
    e.preventDefault();
    const tkt = document.getElementById("modalTicketNumber").value;
    const formData = new FormData(document.getElementById("authUpdateForm"));

    try {
      const res = await fetch(`/api/v1/authority/issues/${tkt}/status`, {
        method: "PATCH",
        body: formData
      });
      const data = await res.json();
      if (res.ok) {
        closeAuthModal();
        loadAuthorityTable();
        loadAnalytics();
        if (currentTicketData && currentTicketData.ticket_number === tkt) {
          loadTicketDetails(tkt);
        }
      } else {
        alert("Failed to update status: " + (data.detail || "Unknown error"));
      }
    } catch (err) {
      alert("Error: " + err.message);
    }
  });
}

async function loadAuthorityTable() {
  const tableBody = document.getElementById("authorityTableBody");
  const dept = document.getElementById("authFilterDept").value;
  const status = document.getElementById("authFilterStatus").value;
  const search = document.getElementById("authSearch").value;

  tableBody.innerHTML = `<tr><td colspan="7" style="text-align: center; padding: 1.5rem; color: #64748b;">Loading incident queue...</td></tr>`;

  try {
    let url = `/api/v1/issues?`;
    if (dept) url += `department_id=${dept}&`;
    if (status) url += `status=${status}&`;
    if (search) url += `search=${encodeURIComponent(search)}&`;

    const res = await fetch(url);
    const data = await res.json();

    if (data.issues.length === 0) {
      tableBody.innerHTML = `<tr><td colspan="7" style="text-align: center; padding: 1.5rem; color: #64748b;">No matching complaints found.</td></tr>`;
      return;
    }

    let rowsHtml = "";
    data.issues.forEach(i => {
      rowsHtml += `
        <tr>
          <td><strong style="color: #1e3a8a;">${i.ticket_number}</strong></td>
          <td>${i.category}</td>
          <td><span class="badge badge-${i.severity.toLowerCase()}">${i.severity}</span></td>
          <td>
            <div style="font-weight: 600; color: #0f172a;">${i.title}</div>
            <div style="font-size: 0.75rem; color: #64748b;">${i.address_text}</div>
          </td>
          <td><span style="font-size: 0.8rem; font-weight: 600;">${i.department_code || 'PWD'}</span></td>
          <td><span class="badge badge-${i.status.toLowerCase().replace(' ', '-')}">${i.status}</span></td>
          <td>
            <button class="btn btn-secondary" style="font-size: 0.8rem; padding: 0.3rem 0.6rem;" onclick="openAuthModal('${i.ticket_number}', '${i.status}', '${i.assigned_engineer || ''}')">
              <i class="fa-solid fa-pen-to-square"></i> Action
            </button>
          </td>
        </tr>
      `;
    });
    tableBody.innerHTML = rowsHtml;
  } catch (e) {
    tableBody.innerHTML = `<tr><td colspan="7" style="color: red; text-align: center;">Error loading queue: ${e.message}</td></tr>`;
  }
}

window.openAuthModal = function(ticketNumber, currentStatus, currentEngineer) {
  document.getElementById("modalTicketNumber").value = ticketNumber;
  document.getElementById("modalTicketSubtitle").innerText = `Ticket: ${ticketNumber}`;
  document.getElementById("modalStatus").value = currentStatus;
  document.getElementById("modalEngineer").value = currentEngineer || "";
  document.getElementById("modalNotes").value = "";
  document.getElementById("authorityModal").classList.add("active");
};

function closeAuthModal() {
  document.getElementById("authorityModal").classList.remove("active");
}

/* -------------------------------------------------------------
 * 8. ANALYTICS & KPIS
 * ----------------------------------------------------------- */
async function loadAnalytics() {
  try {
    const res = await fetch("/api/v1/analytics/kpis");
    const data = await res.json();

    document.getElementById("kpiTotal").innerText = data.total_issues;
    document.getElementById("kpiOpen").innerText = data.open_issues;
    document.getElementById("kpiResolved").innerText = data.resolved_issues;
    document.getElementById("kpiSLA").innerText = `${data.sla_compliance_rate}%`;
    document.getElementById("kpiMTTR").innerText = `${data.avg_mttr_hours} hrs`;

    // Category Distribution Bars
    const catList = document.getElementById("chartCategoryList");
    let catHtml = "";
    data.by_category.forEach(item => {
      const pct = data.total_issues > 0 ? Math.round((item.count / data.total_issues) * 100) : 0;
      catHtml += `
        <div>
          <div style="display: flex; justify-content: space-between; font-size: 0.85rem; font-weight: 600; margin-bottom: 0.2rem;">
            <span>${item.category}</span>
            <span>${item.count} (${pct}%)</span>
          </div>
          <div style="background: #e2e8f0; height: 10px; border-radius: 5px; overflow: hidden;">
            <div style="background: #3b82f6; width: ${pct}%; height: 100%;"></div>
          </div>
        </div>
      `;
    });
    catList.innerHTML = catHtml;

    // Ward Density Bars
    const wardList = document.getElementById("chartWardList");
    let wardHtml = "";
    data.by_ward.forEach(item => {
      const pct = data.total_issues > 0 ? Math.round((item.count / data.total_issues) * 100) : 0;
      wardHtml += `
        <div>
          <div style="display: flex; justify-content: space-between; font-size: 0.85rem; font-weight: 600; margin-bottom: 0.2rem;">
            <span>${item.ward_name}</span>
            <span>${item.count} (${pct}%)</span>
          </div>
          <div style="background: #e2e8f0; height: 10px; border-radius: 5px; overflow: hidden;">
            <div style="background: #10b981; width: ${pct}%; height: 100%;"></div>
          </div>
        </div>
      `;
    });
    wardList.innerHTML = wardHtml;
  } catch (e) {
    console.error("Failed to load analytics", e);
  }
}
