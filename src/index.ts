import express, { type Request, type Response } from "express";
import { PrismaClient } from "@prisma/client";
import dotenv from "dotenv";
import jsonwebtoken from "jsonwebtoken";
import bcrypt from "bcrypt";

dotenv.config();

const app = express();
const prisma = new PrismaClient();

app.use(express.json());

// Function to establish and verify database connection
async function connectDatabase() {
  try {
    await prisma.$connect();
    console.log("Connected to MongoDB database successfully");
  } catch (error) {
    console.error("Error connecting to the database:", error);
    process.exit(1); // Breaks the application if there’s an issue
  }
}

// Call the function to check database connection
connectDatabase();

// API routes will go here

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});

app.get("/", async (req: Request, res: Response) => {
  res.send(`hello world.`);
});

// Create User
app.post("/users", async (req, res) => {
  const { email, password } = req.body;
  const hashedPassword = await bcrypt.hash(password, 10);
  const user = await prisma.user.create({
    data: { email, password: hashedPassword },
  });
  res.json(user);
});

// Get All Users
app.get("/users", async (req, res) => {
  const users = await prisma.user.findMany();
  res.json(users);
});

// Get User by ID
app.get("/users/:id", async (req, res) => {
  const { id } = req.params;
  const user = await prisma.user.findUnique({ where: { id } });
  res.json(user);
});

// Update User
app.put("/users/:id", async (req, res) => {
  const { id } = req.params;
  const { email, password } = req.body;
  const updatedUser = await prisma.user.update({
    where: { id },
    data: { email, password: await bcrypt.hash(password, 10) },
  });
  res.json(updatedUser);
});

// Delete User
app.delete("/users/:id", async (req, res) => {
  const { id } = req.params;
  await prisma.user.delete({ where: { id } });
  res.sendStatus(204);
});

app.post("/login", async (req, res) => {
  const { email, password } = req.body;
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user || !(await bcrypt.compare(password, user.password))) {
    return res.sendStatus(401);
  }
  const token = jsonwebtoken.sign(
    { id: user.id },
    process.env.JWT_SECRET || "secret",
    { expiresIn: "1h" }
  );
  res.json({ token });
});

const authenticateToken = (
  req: { headers: { [x: string]: string } },
  res: { sendStatus: (arg0: number) => void },
  next: () => void
) => {
  const token = req.headers["authorization"]?.split(" ")[1];
  if (!token) return res.sendStatus(401);
  jsonwebtoken.verify(token, process.env.JWT_SECRET || "secret", (err: any) => {
    if (err) return res.sendStatus(403);
    next();
  });
};

app.get("/protected", authenticateToken, (req, res) => {
  res.send("This is a protected route");
});
