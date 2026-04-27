import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { pool } from "../config/database.js";

const JWT_SECRET = process.env.JWT_SECRET || "flowerhunt-dev-secret";

const createToken = (user) => {
  return jwt.sign(
    {
      id: user.id,
      username: user.username,
      user_role: user.user_role,
    },
    JWT_SECRET,
    { expiresIn: "7d" }
  );
};

const getAuthUserId = (req) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return null;
  }

  const token = authHeader.split(" ")[1];
  const decoded = jwt.verify(token, JWT_SECRET);
  return decoded.id;
};

const registerUser = async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({
        error: "Username and password are required",
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        error: "Password must be at least 6 characters",
      });
    }

    const existingUser = await pool.query(
      "SELECT id FROM users WHERE username = $1",
      [username]
    );

    if (existingUser.rows.length > 0) {
      return res.status(409).json({
        error: "Username already exists",
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const { rows } = await pool.query(
      `INSERT INTO users (username, password, user_role, user_gallery)
       VALUES ($1, $2, $3, $4::jsonb)
       RETURNING id, username, user_role, created_at, user_gallery`,
      [username, hashedPassword, "user", JSON.stringify([])]
    );

    const user = rows[0];
    const token = createToken(user);

    res.status(201).json({
      message: "Account created successfully",
      token,
      user,
    });
  } catch (error) {
    console.error("Register error:", error);
    res.status(500).json({
      error: "Could not register user",
    });
  }
};

const loginUser = async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({
        error: "Username and password are required",
      });
    }

    const { rows } = await pool.query(
      "SELECT * FROM users WHERE username = $1",
      [username]
    );

    if (rows.length === 0) {
      return res.status(401).json({
        error: "Invalid username or password",
      });
    }

    const user = rows[0];
    const passwordMatches = await bcrypt.compare(password, user.password);

    if (!passwordMatches) {
      return res.status(401).json({
        error: "Invalid username or password",
      });
    }

    const safeUser = {
      id: user.id,
      username: user.username,
      user_role: user.user_role,
      created_at: user.created_at,
      user_gallery: user.user_gallery,
    };

    const token = createToken(safeUser);

    res.status(200).json({
      message: "Login successful",
      token,
      user: safeUser,
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({
      error: "Could not log in user",
    });
  }
};

const getCurrentUser = async (req, res) => {
  try {
    const userId = getAuthUserId(req);
    if (!userId) {
      return res.status(401).json({
        error: "No token provided",
      });
    }

    const { rows } = await pool.query(
      `SELECT id, username, user_role, created_at, user_gallery
       FROM users
       WHERE id = $1`,
      [userId]
    );

    if (rows.length === 0) {
      return res.status(404).json({
        error: "User not found",
      });
    }

    res.status(200).json(rows[0]);
  } catch (error) {
    console.error("Current user error:", error);
    res.status(401).json({
      error: "Invalid or expired token",
    });
  }
};

const getUserGallery = async (req, res) => {
  try {
    const userId = getAuthUserId(req);
    if (!userId) {
      return res.status(401).json({ error: "No token provided" });
    }

    const { rows } = await pool.query(
      "SELECT user_gallery FROM users WHERE id = $1",
      [userId]
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: "User not found" });
    }

    res.status(200).json(Array.isArray(rows[0].user_gallery) ? rows[0].user_gallery : []);
  } catch (error) {
    console.error("Get gallery error:", error);
    res.status(401).json({ error: "Invalid or expired token" });
  }
};

const addFlowerToGallery = async (req, res) => {
  try {
    const userId = getAuthUserId(req);
    if (!userId) {
      return res.status(401).json({ error: "No token provided" });
    }

    const { id, name, image_url, flower_family } = req.body;
    if (!id || !name) {
      return res.status(400).json({ error: "Flower id and name are required" });
    }

    const { rows } = await pool.query(
      "SELECT user_gallery FROM users WHERE id = $1",
      [userId]
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: "User not found" });
    }

    const currentGallery = Array.isArray(rows[0].user_gallery) ? rows[0].user_gallery : [];
    const alreadyExists = currentGallery.some((flower) => String(flower.id) === String(id));
    if (alreadyExists) {
      return res.status(200).json({ message: "Flower already in gallery", gallery: currentGallery });
    }

    const updatedGallery = [
      ...currentGallery,
      {
        id: String(id),
        name,
        image_url: image_url || null,
        flower_family: flower_family || null,
      },
    ];

    await pool.query(
      "UPDATE users SET user_gallery = $1::jsonb WHERE id = $2",
      [JSON.stringify(updatedGallery), userId]
    );

    res.status(201).json({ message: "Flower added to gallery", gallery: updatedGallery });
  } catch (error) {
    console.error("Add gallery flower error:", error);
    res.status(401).json({ error: "Invalid or expired token" });
  }
};

const removeFlowerFromGallery = async (req, res) => {
  try {
    const userId = getAuthUserId(req);
    if (!userId) {
      return res.status(401).json({ error: "No token provided" });
    }

    const { flowerId } = req.params;
    const { rows } = await pool.query(
      "SELECT user_gallery FROM users WHERE id = $1",
      [userId]
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: "User not found" });
    }

    const currentGallery = Array.isArray(rows[0].user_gallery) ? rows[0].user_gallery : [];
    const updatedGallery = currentGallery.filter(
      (flower) => String(flower.id) !== String(flowerId)
    );

    await pool.query(
      "UPDATE users SET user_gallery = $1::jsonb WHERE id = $2",
      [JSON.stringify(updatedGallery), userId]
    );

    res.status(200).json({ message: "Flower removed from gallery", gallery: updatedGallery });
  } catch (error) {
    console.error("Remove gallery flower error:", error);
    res.status(401).json({ error: "Invalid or expired token" });
  }
};

export {
  registerUser,
  loginUser,
  getCurrentUser,
  getUserGallery,
  addFlowerToGallery,
  removeFlowerFromGallery,
};