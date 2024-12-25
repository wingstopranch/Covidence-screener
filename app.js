document.addEventListener("DOMContentLoaded", () => {
    let inclusionKeywords = [];
    let exclusionKeywords = [];

    document.getElementById("setCriteriaBtn").addEventListener("click", () => {
        inclusionKeywords = document.getElementById("inclusion").value.split(",").map(k => k.trim().toLowerCase());
        exclusionKeywords = document.getElementById("exclusion").value.split(",").map(k => k.trim().toLowerCase());
        alert("Criteria set successfully!");
    });

    document.getElementById("processPdfsBtn").addEventListener("click", () => {
        const files = document.getElementById("pdfUploader").files;
        if (files.length === 0) {
            alert("Please upload at least one PDF file.");
            return;
        }

        const statusDiv = document.getElementById("upload-status");
        statusDiv.innerHTML = "";

        Array.from(files).forEach(file => {
            const reader = new FileReader();
            reader.onload = function (e) {
                const text = e.target.result.toLowerCase();

                const includesKeywords = inclusionKeywords.some(keyword => text.includes(keyword));
                const excludesKeywords = exclusionKeywords.some(keyword => text.includes(keyword));

                const result = document.createElement("div");
                result.textContent = `File: ${file.name} - ${includesKeywords && !excludesKeywords ? "Meets Criteria" : "Does Not Meet Criteria"}`;
                statusDiv.appendChild(result);
            };

            reader.readAsText(file);
        });
    });

    // Existing dashboard code here (loading data, creating tables, charts, etc.)
    // Add the logic for populating the table and chart
});
