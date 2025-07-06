import express from "express";
import callerController from "../controller/caller.controller";
import { authenticateCaller, redirectIfCallerAuthenticated } from "../middelware/caller.auth.middleware";
import { upload } from "../middelware/multer.middleware";

const router = express.Router();

// Public routes (no authentication required)
router.get("/login", redirectIfCallerAuthenticated, callerController.renderCallerLogin);
router.post("/login", redirectIfCallerAuthenticated, callerController.callerLogin);

// Protected routes (authentication required)
router.get("/dashboard", authenticateCaller, callerController.renderCallerDashboard);
router.get("/profile", authenticateCaller, callerController.renderCallerProfile);
router.post("/profile", authenticateCaller, upload.single('profileImage'), callerController.updateCallerProfile);
router.get("/customers", authenticateCaller, callerController.renderCallerCustomers);
router.get("/create-customer", authenticateCaller, callerController.renderCreateCustomerForm);
router.post("/create-customer", authenticateCaller, callerController.createCustomer);
router.get("/create-issue", authenticateCaller, callerController.renderCreateIssueForm);
router.post("/create-issue", authenticateCaller, callerController.createIssue);
router.get("/logout", authenticateCaller, callerController.callerLogout);

export default router; 