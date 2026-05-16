import express from "express";
import { isAuthenticated, isAdmin } from "../middleware/auth";
import {
  getStats,
  listPendingRegistrations,
  approveRegistration,
  rejectRegistration,
  getPlacementReport,
} from "../controller/admin.controller";
import {
  listFaculty,
  getFacultyDetail,
  createFaculty,
  updateFaculty,
  setUserStatus,
} from "../controller/admin.faculty.controller";
import {
  listStudents,
  getStudentDetail,
  graduateStudent,
  listAdminPendingVerifications,
  adminReviewVerificationRequest,
  adminReviewInternship,
  adminReviewAchievement,
  adminReviewCertificate,
} from "../controller/admin.students.controller";
import {
  listStudentNotes,
  addStudentNote,
  deleteStudentNote,
} from "../controller/notes.controller";
import {
  createJob,
  listJobs,
  getJob,
  updateJob,
  setJobStatus,
  deleteJob,
  listApplications,
  updateApplicationStatus,
} from "../controller/admin.jobs.controller";
import {
  createEvent,
  listEvents,
  updateEvent,
  cancelEvent,
  deleteEvent,
} from "../controller/admin.events.controller";
import {
  listStartups,
  createStartup,
  updateStartup,
  deleteStartup,
} from "../controller/admin.startups.controller";
import {
  listAmbassadorAssignments,
  createAmbassadorAssignment,
  deleteAmbassadorAssignment,
} from "../controller/admin.ambassadors.controller";

const router = express.Router();

router.use(isAuthenticated, isAdmin);

// Overview
router.get("/stats", getStats);
router.get("/placement-report", getPlacementReport);

// Registrations (pending signups)
router.get("/registrations", listPendingRegistrations);
router.post("/registrations/:id/approve", approveRegistration);
router.post("/registrations/:id/reject", rejectRegistration);

// Faculty
router.get("/faculty", listFaculty);
router.get("/faculty/:id", getFacultyDetail);
router.post("/faculty", createFaculty);
router.patch("/faculty/:id", updateFaculty);

// Students / alumni
router.get("/students", listStudents);
router.get("/students/:id", getStudentDetail);
router.post("/students/:id/graduate", graduateStudent);

// Admin verification queue (all departments)
router.get("/verifications", listAdminPendingVerifications);
router.post("/verifications/:id/review", adminReviewVerificationRequest);
router.post("/internships/:id/review", adminReviewInternship);
router.post("/achievements/:id/review", adminReviewAchievement);
router.post("/certificates/:id/review", adminReviewCertificate);

// Student notes
router.get("/students/:id/notes", listStudentNotes);
router.post("/students/:id/notes", addStudentNote);
router.delete("/students/:id/notes/:noteId", deleteStudentNote);

// Generic user status toggle (active/inactive)
router.patch("/users/:id/status", setUserStatus);

// Jobs
router.get("/jobs", listJobs);
router.post("/jobs", createJob);
router.get("/jobs/:id", getJob);
router.patch("/jobs/:id", updateJob);
router.patch("/jobs/:id/status", setJobStatus);
router.delete("/jobs/:id", deleteJob);
router.get("/jobs/:id/applications", listApplications);
router.patch("/applications/:id/status", updateApplicationStatus);

// Events
router.get("/events", listEvents);
router.post("/events", createEvent);
router.patch("/events/:id", updateEvent);
router.post("/events/:id/cancel", cancelEvent);
router.delete("/events/:id", deleteEvent);

// Startups
router.get("/startups", listStartups);
router.post("/startups", createStartup);
router.patch("/startups/:id", updateStartup);
router.delete("/startups/:id", deleteStartup);

// Student ambassadors / volunteers
router.get("/ambassadors", listAmbassadorAssignments);
router.post("/ambassadors", createAmbassadorAssignment);
router.delete("/ambassadors/:id", deleteAmbassadorAssignment);

export default router;
