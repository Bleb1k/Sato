export function splitParameters(paramString) {
    const params = [];
    let currentParam = '';
    let bracketCount = 0; // To track nested brackets

    for (let char of paramString) {
        if (char === '[' || char === '{') {
            bracketCount++;
        } else if (char === ']' || char === '}') {
            bracketCount--;
        }

        // If we encounter a comma and we're not inside any brackets, we split
        if (char === ',' && bracketCount === 0) {
            params.push(currentParam.trim());
            currentParam = ''; // Reset for the next parameter
        } else {
            currentParam += char; // Build the current parameter
        }
    }

    // Push the last parameter if there's any remaining
    if (currentParam) {
        params.push(currentParam.trim());
    }

    return params;
}

