// JavaScript Code for ATM Mutation Research Dashboard

document.addEventListener("DOMContentLoaded", () => {
    let inclusionKeywords = [];
    let exclusionKeywords = [];
    let originalData = [];
    let auditLog = [];

    // Set Criteria
    document.getElementById("setCriteriaBtn").addEventListener("click", () => {
        const inclusionInput = document.getElementById("inclusion").value.trim();
        const exclusionInput = document.getElementById("exclusion").value.trim();

        if (!inclusionInput && !exclusionInput) {
            alert("Please enter at least one inclusion or exclusion keyword.");
            return;
        }

        inclusionKeywords = inclusionInput.split(",").map(k => k.trim().toLowerCase());
        exclusionKeywords = exclusionInput.split(",").map(k => k.trim().toLowerCase());

        document.getElementById("recheckCriteriaBtn").disabled = false;
        alert("Criteria set successfully!");
    });

    // Recheck Criteria
    document.getElementById("recheckCriteriaBtn").addEventListener("click", () => {
        recheckCriteria();
    });

    // PDF Upload and Processing
    document.getElementById("processPdfsBtn").addEventListener("click", () => {
        const files = document.getElementById("pdfUploader").files;
        if (files.length === 0) {
            alert("Please upload at least one PDF file.");
            return;
        }

        const statusDiv = document.getElementById("upload-status");
        statusDiv.innerHTML = ""; // Clear previous results
        auditLog = []; // Reset audit log

        Array.from(files).forEach(file => {
            const reader = new FileReader();
            reader.onload = function (e) {
                const text = e.target.result.toLowerCase();

                const includesAllKeywords = inclusionKeywords.every(keyword => text.includes(keyword));
                const includesPartialKeywords = inclusionKeywords.some(keyword => text.includes(keyword));
                const excludesKeywords = exclusionKeywords.some(keyword => text.includes(keyword));

                // Check against JSON Data
                const jsonMatches = checkAgainstJson(text);

                const result = document.createElement("div");
                let auditMessage;

                if (includesAllKeywords && jsonMatches && !excludesKeywords) {
                    result.textContent = `File: ${file.name} - Meets All Criteria (Keywords and JSON)`;
                    result.style.color = "green";
                    auditMessage = `${file.name}: Meets All Criteria (Keywords and JSON)`;
                } else if ((includesPartialKeywords || jsonMatches) && !excludesKeywords) {
                    result.textContent = `File: ${file.name} - Partially Meets Criteria`;
                    result.style.color = "orange";
                    auditMessage = `${file.name}: Partially Meets Criteria - Missing some inclusion keywords or partial JSON match.`;
                } else {
                    result.textContent = `File: ${file.name} - Does Not Meet Criteria`;
                    result.style.color = "red";
                    auditMessage = `${file.name}: Does Not Meet Criteria - ${excludesKeywords ? "Contains exclusion keywords." : "Missing inclusion keywords or no JSON match."}`;
                }

                auditLog.push(auditMessage);
                statusDiv.appendChild(result);
            };

            reader.onerror = function () {
                const errorResult = document.createElement("div");
                errorResult.textContent = `Error reading file: ${file.name}`;
                errorResult.style.color = "red";
                statusDiv.appendChild(errorResult);
            };

            reader.readAsText(file); // Read file as text for keyword and JSON analysis
        });

        document.getElementById("viewAuditLogBtn").disabled = false;
    });

    // View Audit Log
    document.getElementById("viewAuditLogBtn").addEventListener("click", () => {
        const auditLogSection = document.getElementById("auditLogSection");
        const auditLogDiv = document.getElementById("auditLog");

        auditLogSection.style.display = "block";
        auditLogDiv.innerHTML = "<ul>" + auditLog.map(log => `<li>${log}</li>`).join("") + "</ul>";
    });

    // Load JSON Data
    fetch("ATM annotations.json")
        .then(response => response.json())
        .then(data => {
            originalData = formatData(data);
            populateTable(originalData);
            createChart(originalData);
        })
        .catch(error => console.error("Error loading JSON:", error));

    function formatData(data) {
        const formatted = [];
        for (const [paper, details] of Object.entries(data)) {
            const { Title, Cancer, Risk, Medical_Actions_Management, Authors } = details;
            const types = Cancer.Types || [];
            const risks = Risk.Percentages || {};
            const evidenceCancer = Cancer.Evidence || [];

            types.forEach(type => {
                const management = Medical_Actions_Management?.[type] || {};
                formatted.push({
                    Title,
                    Cancer: type,
                    Risk: risks[type] || "Unknown",
                    Management: management.Recommendations?.join("; ") || "No recommendations",
                    EvidenceCancer: evidenceCancer.join("; ") || "No evidence provided",
                    EvidenceManagement: management.Evidence?.join("; ") || "No evidence provided",
                    Authors: Authors?.join(", ") || "No authors listed"
                });
            });
        }
        return formatted;
    }

    function checkAgainstJson(text) {
        return originalData.some(entry => {
            return Object.values(entry).some(value =>
                typeof value === "string" && text.includes(value.toLowerCase())
            );
        });
    }

    function populateTable(data) {
        const tbody = document.querySelector("#riskTable tbody");
        tbody.innerHTML = "";

        if (data.length === 0) {
            tbody.innerHTML = `<tr><td colspan="6" style="text-align:center;">No matching results</td></tr>`;
            return;
        }

        data.forEach(item => {
            const row = document.createElement("tr");
            row.innerHTML = `
                <td>${item.Title}</td>
                <td>${item.Cancer}</td>
                <td>${item.Risk}</td>
                <td>${item.Management}</td>
                <td>${item.EvidenceCancer}</td>
                <td>${item.EvidenceManagement}</td>
            `;
            tbody.appendChild(row);
        });
    }

    function createChart(data) {
        const ctx = document.getElementById("riskChart").getContext("2d");
        const labels = data.map(item => item.Cancer);
        const risks = data.map(item => parseFloat(item.Risk.match(/\d+/)?.[0]) || 0);

        new Chart(ctx, {
            type: "bar",
            data: {
                labels: labels,
                datasets: [{
                    label: "Risk Percentage",
                    data: risks,
                    backgroundColor: "rgba(75, 192, 192, 0.2)",
                    borderColor: "rgba(75, 192, 192, 1)",
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                scales: {
                    y: {
                        beginAtZero: true
                    }
                }
            }
        });
    }

    function recheckCriteria() {
        const statusDiv = document.getElementById("upload-status");
        statusDiv.innerHTML = "";

        auditLog.forEach(log => {
            const result = document.createElement("div");
            result.textContent = log;
            result.style.color = log.includes("Meets All Criteria") ? "green" : log.includes("Partially Meets Criteria") ? "orange" : "red";
            statusDiv.appendChild(result);
        });

        alert("Recheck completed. Audit log updated.");
    }
});
