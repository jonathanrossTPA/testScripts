const fs = require('fs');

function findConcoursepltLinks(jsonFile) {
    // Read the JSON file
    const data = JSON.parse(fs.readFileSync(jsonFile, 'utf-8'));
    
    const results = [];
    
    // Function to recursively search for URLs in nested structures
    function extractUrls(obj, parentName = '', parentKey = '') {
        if (typeof obj === 'object' && obj !== null && !Array.isArray(obj)) {
            for (const [key, value] of Object.entries(obj)) {
                if (typeof value === 'string' && value.toLowerCase().includes('concourseplt')) {
                    // Check if it's a URL
                    if (value.startsWith('http')) {
                        results.push({
                            Component: parentName,
                            Field: key,
                            URL: value
                        });
                    }
                } else if (typeof value === 'object' && value !== null) {
                    extractUrls(value, parentName, key);
                }
            }
        } else if (Array.isArray(obj)) {
            for (const item of obj) {
                if (typeof item === 'object' && item !== null) {
                    // Get the name if it exists
                    const name = item.name || parentName;
                    extractUrls(item, name, parentKey);
                } else if (typeof item === 'string' && item.toLowerCase().includes('concourseplt') && item.startsWith('http')) {
                    results.push({
                        Component: parentName,
                        Field: parentKey,
                        URL: item
                    });
                }
            }
        }
    }
    
    extractUrls(data);
    
    // Print results
    console.log('='.repeat(150));
    console.log(`LINKS CONTAINING "concourseplt" (Total: ${results.length})`);
    console.log('='.repeat(150));
    console.log();
    
    if (results.length > 0) {
        // Print header
        console.log(`${'Component'.padEnd(30)} ${'Field'.padEnd(20)} ${'URL'.padEnd(100)}`);
        console.log('-'.repeat(150));
        
        // Print rows
        for (const item of results) {
            const component = item.Component.substring(0, 29).padEnd(30);
            const field = item.Field.substring(0, 19).padEnd(20);
            const url = item.URL;
            console.log(`${component} ${field} ${url}`);
        }
    } else {
        console.log('No links containing "concourseplt" found.');
    }
    
    // Create CSV file
    const csvContent = [
        'Component,Field,URL',
        ...results.map(r => `"${r.Component}","${r.Field}","${r.URL}"`)
    ].join('\n');
    
    fs.writeFileSync('concourseplt_links.csv', csvContent, 'utf-8');
    
    console.log();
    console.log(`\n✓ Results saved to 'concourseplt_links.csv'`);
}

// Run the function
findConcoursepltLinks('applications.json');
