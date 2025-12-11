export const formatDate = (isoString) => {
    if (!isoString) return ''; // Return blank if the date string is empty or undefined

    const date = new Date(isoString);

    // Check if the date is valid
    if (isNaN(date.getTime())) return ''; // Return blank for invalid dates

    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0'); // Months are 0-based
    const year = date.getFullYear();

    return `${day}-${month}-${year}`;
};
