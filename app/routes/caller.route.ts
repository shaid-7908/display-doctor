import express from "express";
import callerController from "../controller/caller.controller";
import {
  authenticateCaller,
  redirectIfCallerAuthenticated,
} from "../middelware/caller.auth.middleware";
import { upload } from "../middelware/multer.middleware";

const router = express.Router();

// Public routes (no authentication required)
router.get(
  "/login",
  redirectIfCallerAuthenticated,
  callerController.renderCallerLogin
);
router.post(
  "/login",
  redirectIfCallerAuthenticated,
  callerController.callerLogin
);

// Protected routes (authentication required)
router.get(
  "/dashboard",
  authenticateCaller,
  callerController.renderCallerDashboard
);
router.get(
  "/profile",
  authenticateCaller,
  callerController.renderCallerProfile
);
router.post(
  "/profile",
  authenticateCaller,
  upload.single("profileImage"),
  callerController.updateCallerProfile
);
router.get(
  "/customers",
  authenticateCaller,
  callerController.renderCallerCustomers
);
router.get(
  "/create-customer",
  authenticateCaller,
  callerController.renderCreateCustomerForm
);
router.post(
  "/create-customer",
  authenticateCaller,
  callerController.createCustomer
);
router.get(
  "/create-issue/:customerId",
  authenticateCaller,
  callerController.renderCreateIssueForm
);
router.post(
  "/create-issue/:customerId",
  authenticateCaller,
  callerController.createIssue
);
router.get(
  "/issues",
  authenticateCaller,
  callerController.renderCallerIssues
);
router.get(
  "/customer/:customerId",
  authenticateCaller,
  callerController.renderCustomerDetails
);
router.get(
  "/send-mail/:issueId",
  authenticateCaller,
  callerController.sendIssueEmail
);
router.get("/logout", authenticateCaller, callerController.callerLogout);
router.get(
  "/edit-issue/:issueid",
  authenticateCaller,
  callerController.renderEditIssue
);
router.get(
  "/issue-details/:issueid",
  authenticateCaller,
  callerController.renderIssueDetails
);
router.post("/update-issue-status",authenticateCaller,callerController.upadteIssueStatus);
export default router;
