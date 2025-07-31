export function neutralizeString(string: string, lower: boolean = false): string {
    let newString = string.replace(/\s+/g, ' ').trim() // Trim and remove excess spaces from the string

    if (lower) {
        newString = newString.toLowerCase(); // make lowercase if said so
    }

    return newString;
}
