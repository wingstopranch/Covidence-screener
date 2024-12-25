document.addEventListener("DOMContentLoaded", () => {
    let inclusionKeywords = [];
    let exclusionKeywords = [];
    let originalData = [];

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

        alert("Criteria set successfully!");
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

        Array.from(files).forEach(file => {
            const reader = new FileReader();
            reader.onload = function (e) {
                const text = e.target.result.toLowerCase();

                const includesAllKeywords = inclusionKeywords.every(keyword => text.includes(keyword));
                const includesPartialKeywords = inclusionKeywords.some(keyword => text.includes(keyword));
                const excludesKeywords = exclusionKeywords.some(keyword => text.includes(keyword));

                const result = document.createElement("div");

                if (includesAllKeywords && !excludesKeywords) {
                    result.textContent = `File: ${file.name} - Meets All Criteria`;
                    result.style.color = "green";
                } else if (includesPartialKeywords && !excludesKeywords) {
                    result.textContent = `File: ${file.name} - Partially Meets Criteria`;
                    result.style.color = "orange";
                } else {
                    result.textContent = `File: ${file.name} - Does Not Meet Criteria`;
                    result.style.color = "red";
                }

                statusDiv.appendChild(result);
            };

            reader.onerror = function () {
                const errorResult = document.createElement("div");
                errorResult.textContent = `Error reading file: ${file.name}`;
                errorResult.style.color = "red";
                statusDiv.appendChild(errorResult);
            };

            reader.readAsText(file); // Read file as text for keyword analysis
        });
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
});
