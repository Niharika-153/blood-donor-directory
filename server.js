
require("dotenv").config();

const express = require("express");
const cors = require("cors");
const supabase = require("./supabase");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors({
    origin: process.env.FRONTEND_ORIGIN || "http://127.0.0.1:5500"
}));

app.use(express.json({ limit: "10kb" }));

const BLOOD_GROUPS = [
    "A+", "A-", "B+", "B-",
    "AB+", "AB-", "O+", "O-"
];

function validateDonor(body, partial = false) {
    const errors = [];

    if (!partial || body.full_name !== undefined) {
        if (
            typeof body.full_name !== "string" ||
            body.full_name.trim().length < 2 ||
            body.full_name.trim().length > 100
        ) {
            errors.push("Full name must contain 2 to 100 characters.");
        }
    }

    if (!partial || body.blood_group !== undefined) {
        if (!BLOOD_GROUPS.includes(body.blood_group)) {
            errors.push("Please select a valid blood group.");
        }
    }

    if (!partial || body.city !== undefined) {
        if (
            typeof body.city !== "string" ||
            body.city.trim().length < 2 ||
            body.city.trim().length > 100
        ) {
            errors.push("City must contain 2 to 100 characters.");
        }
    }

    if (!partial || body.phone !== undefined) {
        if (
            typeof body.phone !== "string" ||
            !/^[6-9]\d{9}$/.test(body.phone.trim())
        ) {
            errors.push("Enter a valid 10-digit Indian mobile number.");
        }
    }

    if (
        body.is_available !== undefined &&
        typeof body.is_available !== "boolean"
    ) {
        errors.push("is_available must be true or false.");
    }

    if (
        partial &&
        !["full_name", "blood_group", "city", "phone", "is_available"]
            .some((field) => body[field] !== undefined)
    ) {
        errors.push("Provide at least one field to update.");
    }

    return errors;
}

function handleDatabaseError(res, error) {
    console.error("Database operation failed:", error.message);

    return res.status(500).json({
        error: "A database error occurred. Please try again."
    });
}

// Home / API status
app.get("/", (req, res) => {
    res.json({
        message: "Blood Donor Directory API is running."
    });
});

// READ: Search donors
app.get("/api/donors", async (req, res) => {
    try {
        const { blood_group, city } = req.query;

        if (
            blood_group &&
            !BLOOD_GROUPS.includes(blood_group)
        ) {
            return res.status(400).json({
                error: "Invalid blood group."
            });
        }

        if (
            city !== undefined &&
            (typeof city !== "string" || city.trim().length > 100)
        ) {
            return res.status(400).json({
                error: "City search must be at most 100 characters."
            });
        }

        let query = supabase
            .from("donors")
            .select("id, full_name, blood_group, city, is_available, created_at")
            .eq("is_available", true)
            .order("created_at", { ascending: false })
            .limit(100);

        if (blood_group) {
            query = query.eq("blood_group", blood_group);
        }

        if (city && city.trim()) {
            query = query.ilike("city", `%${city.trim()}%`);
        }

        const { data, error } = await query;

        if (error) {
            return handleDatabaseError(res, error);
        }

        res.json(data);
    } catch (error) {
        return handleDatabaseError(res, error);
    }
});

// CREATE: Register a donor
app.post("/api/donors", async (req, res) => {
    try {
        const errors = validateDonor(req.body);

        if (errors.length > 0) {
            return res.status(400).json({ errors });
        }

        const donor = {
            full_name: req.body.full_name.trim(),
            blood_group: req.body.blood_group,
            city: req.body.city.trim(),
            phone: req.body.phone.trim(),
            is_available: req.body.is_available ?? true
        };

        const { data, error } = await supabase
            .from("donors")
            .insert(donor)
            .select("id, full_name, blood_group, city, is_available")
            .single();

        if (error) {
            return handleDatabaseError(res, error);
        }

        res.status(201).json({
            message: "Donor registered successfully.",
            donor: data
        });
    } catch (error) {
        return handleDatabaseError(res, error);
    }
});

// UPDATE: Update a donor
app.put("/api/donors/:id", async (req, res) => {
    try {
        const { id } = req.params;

        if (
            typeof id !== "string" ||
            !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id)
        ) {
            return res.status(400).json({
                error: "Invalid donor ID."
            });
        }

        const errors = validateDonor(req.body, true);

        if (errors.length > 0) {
            return res.status(400).json({ errors });
        }

        const updates = {};

        if (req.body.full_name !== undefined) {
            updates.full_name = req.body.full_name.trim();
        }

        if (req.body.blood_group !== undefined) {
            updates.blood_group = req.body.blood_group;
        }

        if (req.body.city !== undefined) {
            updates.city = req.body.city.trim();
        }

        if (req.body.phone !== undefined) {
            updates.phone = req.body.phone.trim();
        }

        if (req.body.is_available !== undefined) {
            updates.is_available = req.body.is_available;
        }

        const { data, error } = await supabase
            .from("donors")
            .update(updates)
            .eq("id", id)
            .select("id, full_name, blood_group, city, is_available")
            .maybeSingle();

        if (error) {
            return handleDatabaseError(res, error);
        }

        if (!data) {
            return res.status(404).json({
                error: "Donor not found."
            });
        }

        res.json({
            message: "Donor updated successfully.",
            donor: data
        });
    } catch (error) {
        return handleDatabaseError(res, error);
    }
});

// DELETE: Delete a donor
app.delete("/api/donors/:id", async (req, res) => {
    try {
        const { id } = req.params;

        if (
            typeof id !== "string" ||
            !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id)
        ) {
            return res.status(400).json({
                error: "Invalid donor ID."
            });
        }

        const { data, error } = await supabase
            .from("donors")
            .delete()
            .eq("id", id)
            .select("id")
            .maybeSingle();

        if (error) {
            return handleDatabaseError(res, error);
        }

        if (!data) {
            return res.status(404).json({
                error: "Donor not found."
            });
        }

        res.json({
            message: "Donor deleted successfully."
        });
    } catch (error) {
        return handleDatabaseError(res, error);
    }
});

// Handle invalid JSON and unexpected errors
app.use((err, req, res, next) => {
    if (err instanceof SyntaxError && err.status === 400 && "body" in err) {
        return res.status(400).json({
            error: "Invalid JSON request body."
        });
    }

    console.error("Server error:", err.message);

    res.status(500).json({
        error: "Internal server error."
    });
});

app.listen(PORT, () => {
    console.log(`Blood Donor Directory API running at http://localhost:${PORT}`);
});
