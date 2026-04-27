import { Router } from "express";
import {
  registerUser,
  loginUser,
  getCurrentUser,
  getUserGallery,
  addFlowerToGallery,
  removeFlowerFromGallery,
} from "../controllers/users.js";

const router = Router();

router.post("/register", registerUser);
router.post("/login", loginUser);
router.get("/me", getCurrentUser);
router.get("/gallery", getUserGallery);
router.post("/gallery", addFlowerToGallery);
router.delete("/gallery/:flowerId", removeFlowerFromGallery);

export default router;