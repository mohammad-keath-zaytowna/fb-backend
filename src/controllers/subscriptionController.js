const User = require("../models/User");

// Get current user's subscription status
const getSubscriptionStatus = async (req, res) => {
    try {
        const userId = req.user.id;
        const user = await User.findById(userId);

        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        // Only admins have subscription expiry
        if (user.role !== "admin") {
            return res.json({
                hasExpiry: false,
                role: user.role,
            });
        }

        const now = new Date();
        const expiryDate = user.subscriptionExpiryDate;

        if (!expiryDate) {
            return res.json({
                hasExpiry: false,
                role: user.role,
            });
        }

        const isExpired = expiryDate < now;
        const daysRemaining = Math.ceil((expiryDate - now) / (1000 * 60 * 60 * 24));

        res.json({
            hasExpiry: true,
            role: user.role,
            expiryDate,
            isExpired,
            daysRemaining: isExpired ? 0 : daysRemaining,
        });
    } catch (error) {
        console.error("Get subscription status error:", error);
        res.status(500).json({ message: "Server error" });
    }
};

// Get all admins with their subscription info (SuperAdmin only)
const getAllAdminSubscriptions = async (req, res) => {
    try {
        const admins = await User.find({ role: "admin" }).select(
            "name email subscriptionExpiryDate createdAt status"
        );

        const now = new Date();
        const adminsWithStatus = admins.map((admin) => {
            const expiryDate = admin.subscriptionExpiryDate;
            const isExpired = expiryDate ? expiryDate < now : false;
            const daysRemaining = expiryDate
                ? Math.ceil((expiryDate - now) / (1000 * 60 * 60 * 24))
                : null;

            return {
                _id: admin._id,
                name: admin.name,
                email: admin.email,
                subscriptionExpiryDate: expiryDate,
                status: admin.status,
                createdAt: admin.createdAt,
                isExpired,
                daysRemaining: isExpired ? 0 : daysRemaining,
            };
        });

        res.json({ admins: adminsWithStatus });
    } catch (error) {
        console.error("Get all admin subscriptions error:", error);
        res.status(500).json({ message: "Server error" });
    }
};

// Update admin expiry date (SuperAdmin only)
const updateAdminExpiry = async (req, res) => {
    try {
        const { userId } = req.params;
        const { expiryDate } = req.body;

        // Validate the user exists and is an admin
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        if (user.role !== "admin") {
            return res
                .status(400)
                .json({ message: "Can only update expiry for admin users" });
        }

        // Update expiry date
        user.subscriptionExpiryDate = expiryDate ? new Date(expiryDate) : null;
        await user.save();

        res.json({
            message: "Subscription expiry updated successfully",
            user: {
                _id: user._id,
                name: user.name,
                email: user.email,
                subscriptionExpiryDate: user.subscriptionExpiryDate,
            },
        });
    } catch (error) {
        console.error("Update admin expiry error:", error);
        res.status(500).json({ message: "Server error" });
    }
};

module.exports = {
    getSubscriptionStatus,
    getAllAdminSubscriptions,
    updateAdminExpiry,
};
