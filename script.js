
"use strict";

// Sample donor data for frontend testing.
// These records are fictional.
let donors = [
    {
        id: 1,
        fullName: "Ravi Kumar",
        bloodGroup: "O+",
        city: "Hyderabad",
        phone: "9000000001",
        availability: "yes",
        contactConsent: true
    },
    {
        id: 2,
        fullName: "Priya Sharma",
        bloodGroup: "A+",
        city: "Secunderabad",
        phone: "9000000002",
        availability: "yes",
        contactConsent: true
    },
    {
        id: 3,
        fullName: "Arjun Reddy",
        bloodGroup: "B+",
        city: "Hyderabad",
        phone: "9000000003",
        availability: "no",
        contactConsent: true
    },
    {
        id: 4,
        fullName: "Sneha Rao",
        bloodGroup: "O-",
        city: "Warangal",
        phone: "9000000004",
        availability: "yes",
        contactConsent: false
    }
];

let nextId = 5;

// Get HTML elements
const donorForm = document.getElementById("donorForm");
const searchForm = document.getElementById("searchForm");
const formMessage = document.getElementById("formMessage");
const donorResults = document.getElementById("donorResults");

// Display donors safely
function displayDonors(list) {
    donorResults.replaceChildren();

    if (list.length === 0) {
        const message = document.createElement("p");
        message.textContent = "No matching donors found.";
        donorResults.appendChild(message);
        return;
    }

    const heading = document.createElement("h3");
    heading.textContent = `Found ${list.length} donor(s)`;
    donorResults.appendChild(heading);

    list.forEach(function (donor) {
        const card = document.createElement("article");
        card.className = "donor-card";

        const name = document.createElement("h3");
        name.textContent = donor.fullName;

        const group = document.createElement("p");
        group.textContent = `Blood Group: ${donor.bloodGroup}`;

        const city = document.createElement("p");
        city.textContent = `City: ${donor.city}`;

        const availability = document.createElement("p");
        availability.textContent =
            donor.availability === "yes"
                ? "Available to donate: Yes"
                : "Available to donate: No";

        card.append(name, group, city, availability);

        if (donor.contactConsent) {
            const contact = document.createElement("p");
            contact.textContent = `Phone: ${donor.phone}`;
            card.appendChild(contact);
        } else {
            const privateMessage = document.createElement("p");
            privateMessage.textContent =
                "Contact details are private.";
            card.appendChild(privateMessage);
        }

        donorResults.appendChild(card);
    });
}

// Register a donor
donorForm.addEventListener("submit", function (event) {
    event.preventDefault();

    const fullName = document
        .getElementById("fullName")
        .value.trim();

    const bloodGroup = document
        .getElementById("bloodGroup")
        .value;

    const city = document
        .getElementById("city")
        .value.trim();

    const phone = document
        .getElementById("phone")
        .value.trim();

    const availability = document
        .getElementById("availability")
        .value;

    const contactConsent = document
        .getElementById("contactConsent")
        .checked;

    if (!fullName || !city || !bloodGroup || !phone) {
        formMessage.textContent =
            "Please complete all required fields.";
        return;
    }

    if (!/^[0-9]{10}$/.test(phone)) {
        formMessage.textContent =
            "Enter a valid 10-digit phone number.";
        return;
    }

    if (!contactConsent) {
        formMessage.textContent =
            "Please provide consent to display contact details.";
        return;
    }

    const newDonor = {
        id: nextId++,
        fullName: fullName,
        bloodGroup: bloodGroup,
        city: city,
        phone: phone,
        availability: availability,
        contactConsent: contactConsent
    };

    donors.push(newDonor);

    formMessage.textContent =
        "Donor registered successfully!";

    donorForm.reset();

    displayDonors(
        donors.filter(function (donor) {
            return donor.availability === "yes";
        })
    );
});

// Search donors by blood group and city
searchForm.addEventListener("submit", function (event) {
    event.preventDefault();

    const bloodGroup = document
        .getElementById("searchBloodGroup")
        .value;

    const city = document
        .getElementById("searchCity")
        .value.trim()
        .toLowerCase();

    const matchingDonors = donors.filter(function (donor) {
        const matchesBloodGroup =

        const matchesCity =
            !city || donor.city.toLowerCase().includes(city);

        return (
            matchesBloodGroup &&
            matchesCity &&
            donor.availability === "yes"
        );
    });

    displayDonors(matchingDonors);
});

// Clear search and show available donors
searchForm.addEventListener("reset", function () {
    setTimeout(function () {
        displayDonors(
            donors.filter(function (donor) {
                return donor.availability === "yes";
            })
        );
    }, 0);
});

// Show sample donors when the page loads
displayDonors(
    donors.filter(function (donor) {
        return donor.availability === "yes";
    })
);
