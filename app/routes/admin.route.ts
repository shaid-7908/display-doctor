import express from "express";
import adminController from "../controller/admin.controller";
import { authenticateAdmin, authorizeRoles, redirectIfAuthenticated } from "../middelware/auth.middleware";
import { upload } from "../middelware/multer.middleware";

const router = express.Router();

// Public routes (no authentication required)
router.get("/login", redirectIfAuthenticated, adminController.renderAdminLogin);
router.post("/login", redirectIfAuthenticated, adminController.adminLogin);

// Protected routes (authentication required)
router.get("/dashboard", authenticateAdmin, adminController.renderDashboard);
router.get("/create", authenticateAdmin, authorizeRoles("super_admin"), adminController.renderCreateAdminForm);
router.post("/create", authenticateAdmin, authorizeRoles("super_admin"), adminController.createAdmin);
router.get('/create-caller',authenticateAdmin,adminController.renderCreateCallerForm)
router.post('/callers/create',authenticateAdmin,upload.single('profileImage'),adminController.createCaller)
router.get("/callers", authenticateAdmin, adminController.renderCallerList);
router.get("/list", authenticateAdmin, adminController.renderAdminList);

router.get("/edit/:id", authenticateAdmin, adminController.renderEditAdminForm);
router.post("/edit/:id", authenticateAdmin, adminController.updateAdmin);

router.post("/delete/:id", authenticateAdmin, authorizeRoles("super_admin"), adminController.deleteAdmin);
router.post("/toggle-status/:id", authenticateAdmin, authorizeRoles("super_admin"), adminController.toggleAdminStatus);

router.get("/logout", authenticateAdmin, adminController.adminLogout);

export default router; 