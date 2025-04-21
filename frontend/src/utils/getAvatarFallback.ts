function getAvatarFallback(name) {
  // Split the name into parts
  const nameParts = name.split(" ");

  // Get the first letter of the first name
  const firstInitial = nameParts[0] ? nameParts[0][0] : "";

  // Get the first letter of the last name (if it exists)
  const lastInitial =
    nameParts.length > 1 ? nameParts[nameParts.length - 1][0] : "";

  // Combine the initials and convert to uppercase
  const initials = (firstInitial + lastInitial).toUpperCase();

  return initials || "?"; // Return '?' if no initials are found
}

export default getAvatarFallback;
