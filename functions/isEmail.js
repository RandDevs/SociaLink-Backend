export default function isEmail(email) {
	// Regular expression to validate email addresses
	const re = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

	// Check if the email is valid
	if (!re.test(email)) {
		return false;
	}

	// Additional checks
	const parts = email.split("@");
	if (parts.length !== 2) {
		return false;
	}

	const localPart = parts[0];
	const domainPart = parts[1];

	// Check length of local and domain parts
	if (localPart.length > 64 || domainPart.length > 255) {
		return false;
	}

	// Domain part should have at least one dot
	if (!domainPart.includes(".")) {
		return false;
	}

	// Check domain part for valid characters
	const domainRe = /^[a-zA-Z0-9.-]+$/;
	if (!domainRe.test(domainPart)) {
		return false;
	}

	return true;
}
