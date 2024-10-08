import bcrypt from "bcrypt";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export default async function loginUser(req, res) {
  if (req.method === "POST") {
    try {
      const { email, password } = req.body;

      const user = await prisma.user.findUnique({
        where: { email: email },
      });

      if (!user) {
        return res.status(401).json({ error: "Invalid email or password" });
      }

      const match = await bcrypt.compare(password, user.password);

      if (match) {
        // Return user data for session
        res.status(200).json({ message: "Login successful", user });
      } else {
        res.status(401).json({ error: "Invalid email or password" });
      }
    } catch (error) {
      console.error("Error logging in:", error);
      res.status(500).json({ error: error.message });
    }
  } else {
    res.setHeader("Allow", ["POST"]);
    res.status(405).json({ error: `Method ${req.method} Not Allowed` });
  }
}
