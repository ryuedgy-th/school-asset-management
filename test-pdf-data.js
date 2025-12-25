// Test script to check PDF data
// Run: node test-pdf-data.js

const testData = {
    checkoutInspection: {
        overallCondition: "excellent",
        photoUrls: "[\"photo1.jpg\",\"photo2.jpg\"]" // This is a STRING
    }
};

console.log("Raw photoUrls:", testData.checkoutInspection.photoUrls);
console.log("Type:", typeof testData.checkoutInspection.photoUrls);

// Parse it
const parsed = JSON.parse(testData.checkoutInspection.photoUrls);
console.log("Parsed:", parsed);
console.log("Is Array:", Array.isArray(parsed));
console.log("Length:", parsed.length);

// Capitalize
const condition = testData.checkoutInspection.overallCondition;
const capitalized = condition.charAt(0).toUpperCase() + condition.slice(1).toLowerCase();
console.log("Original condition:", condition);
console.log("Capitalized:", capitalized);
