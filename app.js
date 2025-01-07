document.addEventListener("DOMContentLoaded", () => {
    let inclusionKeywords = [];
    let exclusionKeywords = [];
    let originalData = [];
    let keywordWeights = {}; // Store weights for keywords
    let auditLog = [];

    // Load JSON Data
    fetch("ATM annotations.json")
        .then((response) => response.json())
        .then((data) => {
            originalData = formatData(data);
            extractKeywordWeights(data);
            populateTable(originalData);
            createChart(originalData);
        })
        .catch((error) => console.error("Error loading JSON:", error));

    function extractKeywordWeights(data) {
        Object.values(data).forEach((paper) => {
            if (paper.Keywords) {
                Object.entries(paper.Keywords).forEach(([keyword, weight]) => {
                    keywordWeights[keyword.toLowerCase()] = weight;
                });
            }
        });
    }

    // Set Criteria
    document.getElementById("setCriteriaBtn").addEventListener("click", () => {
        const inclusionInput = document.getElementById("inclusion").value.trim();
        const exclusionInput = document.getElementById("exclusion").value.trim();

        if (!inclusionInput && !exclusionInput) {
            alert("Please enter at least one inclusion or exclusion keyword.");
            return;
        }

        inclusionKeywords = inclusionInput.split(",").map((k) => k.trim().toLowerCase());
        exclusionKeywords = exclusionInput.split(",").map((k) => k.trim().toLowerCase());

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

        const formData = new FormData();
        Array.from(files).forEach((file) => formData.append("files", file));
        formData.append("inclusionKeywords", inclusionKeywords.join(","));
        formData.append("exclusionKeywords", exclusionKeywords.join(","));

        // Send files and keywords to the backend for AI processing
        fetch("/process-files", {
            method: "POST",
            body: formData,
        })
            .then((response) => response.json())
            .then((results) => {
                displayResults(results);
            })
            .catch((error) => {
                console.error("Error processing PDFs:", error);
                alert("An error occurred while processing your files.");
            });
    });

    function displayResults(results) {
        const statusDiv = document.getElementById("upload-status");
        statusDiv.innerHTML = ""; // Clear previous results

        results.forEach((result) => {
            const div = document.createElement("div");
            div.textContent = result.message;
            div.style.color = result.isRelevant ? "green" : "red";
            statusDiv.appendChild(div);

            // Log results to audit
            auditLog.push(`${result.file}: ${result.message}`);
        });

        document.getElementById("viewAuditLogBtn").disabled = false;
    }

    // View Audit Log
    document.getElementById("viewAuditLogBtn").addEventListener("click", () => {
        const auditLogSection = document.getElementById("auditLogSection");
        const auditLogDiv = document.getElementById("auditLog");

        auditLogSection.style.display = "block";
        auditLogDiv.innerHTML = "<ul>" + auditLog.map((log) => `<li>${log}</li>`).join("") + "</ul>";
    });

    function formatData(data) {
        const formatted = [];
        Object.entries(data).forEach(([paperId, details]) => {
            const { Title, Cancer, Risk, Keywords, Authors } = details;
            const types = Cancer.Types || [];

            types.forEach((type) => {
                formatted.push({
                    Title,
                    Cancer: type,
                    Risk: Risk?.Percentages?.[type] || "Unknown",
                    Keywords: Keywords ? Object.keys(Keywords).join(", ") : "None",
                    Authors: Authors?.join(", ") || "Unknown",
                });
            });
        });
        return formatted;
    }

    function createChart(data) {
        const ctx = document.getElementById("riskChart").getContext("2d");
        const labels = data.map((item) => item.Cancer);
        const risks = data.map((item) => parseFloat(item.Risk.match(/\d+/)?.[0]) || 0);

        new Chart(ctx, {
            type: "bar",
            data: {
                labels: labels,
                datasets: [{
                    label: "Risk Percentage",
                    data: risks,
                    backgroundColor: "rgba(75, 192, 192, 0.2)",
                    borderColor: "rgba(75, 192, 192, 1)",
                    borderWidth: 1,
                }],
            },
            options: {
                responsive: true,
                scales: {
                    y: {
                        beginAtZero: true,
                    },
                },
            },
        });
    }

    function recheckCriteria() {
        const statusDiv = document.getElementById("upload-status");
        statusDiv.innerHTML = "";

        auditLog.forEach((log) => {
            const result = document.createElement("div");
            result.textContent = log;
            result.style.color = log.includes("Relevant") ? "green" : "red";
            statusDiv.appendChild(result);
        });

        alert("Recheck completed. Audit log updated.");
    }
});
