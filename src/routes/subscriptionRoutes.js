const express = require("express");
const router = express.Router();
const {
    getSubscriptionStatus,
    getAllAdminSubscriptions,
    updateAdminExpiry,
} = require("../controllers/subscriptionController");
const { auth: protect, permitRoles: restrictTo } = require("../middlewares/auth");

// Get current user's subscription status
router.get("/status", protect, getSubscriptionStatus);

// SuperAdmin only routes
router.get("/admins", protect, restrictTo("superAdmin"), getAllAdminSubscriptions);
router.put("/admin/:userId", protect, restrictTo("superAdmin"), updateAdminExpiry);

module.exports = router;
