import express from 'express';
import mongoose from 'mongoose';

const app = express();
app.use(express.json());
const PORT = 8000;

mongoose.connect("mongodb+srv://bala:ramya25@cluster0.wrdqsh6.mongodb.net/")
const db = mongoose.connection;

const mentorSchema = new mongoose.Schema({
  name: String,
  students: [{ type: mongoose.Schema.Types.ObjectId, ref: "Students" }],
}, { versionKey: false });

const studentSchema = new mongoose.Schema({
  name: String,
  mentor: { type: mongoose.Schema.Types.ObjectId, ref: "Mentor" },
}, { versionKey: false });

const Mentor = mongoose.model("Mentor", mentorSchema);
const Student = mongoose.model("Student", studentSchema);


app.get("/", (req, res) => {
  res.send(" <h1> Welcome to the Student and Mentors page </h1> ");
});

//Write API to create Mentor
app.post("/api/mentors", async (req, res) => {
  try {
    const mentor = new Mentor(req.body);
    await mentor.save();
    res.status(201).json({ message: "Mentor created successfully", mentor });
  } catch (error) {
    res.status(500).json({ message: "Internal server error" });
  }
});

//Write API to create Student
app.post("/api/students", async (req, res) => {
  try {
    const { mentorId, name } = req.body;

    const mentor = await Mentor.findById(mentorId);
    if (!mentor) {
      return res.status(404).json({ message: "Mentor not found" });
    }

    const student = new Student({
      name,
      mentor: mentorId,
    });

    await student.save();

    mentor.students.push(student);
    await mentor.save();

    res.status(201).json({ message: "Student created successfully", student });
  } catch (error) {
    res.status(500).json({ message: "Internal server error" });
  }
});

//Write API to Assign a student to Mentor
app.post("/api/assign-mentor", async (req, res) => {
  try {
    const { mentorId, studentIds } = req.body;

    const mentor = await Mentor.findById(mentorId);
    if (!mentor) {
      return res.status(404).json({ message: "Mentor not found" });
    }

    const students = await Student.find({ _id: { $in: studentIds } });

    mentor.students.push(...students);
    await mentor.save();

    students.forEach(async (student) => {
      student.mentor = mentor;
      await student.save();
    });

    res.status(200).json({ message: "Students assigned to mentor successfully" });
  } catch (error) {
    res.status(500).json({ message: "Internal server error" });
  }
});

// Select one mentor and Add multiple Student
// A student who has a mentor should not be shown in List
//Write API to Assign or Change Mentor for particular Student
app.put("/api/assign-mentor/:studentId", async (req, res) => {
  try {
    const { studentId } = req.params;
    const { mentorId } = req.body;

    const student = await Student.findById(studentId);
    const mentor = await Mentor.findById(mentorId);

    if (!student || !mentor) {
      return res.status(404).json({ message: "Student or Mentor not found" });
    }

    student.mentor = mentor;
    await student.save();

    res.status(200).json({ message: "Student assigned to mentor successfully" });
  } catch (error) {
    res.status(500).json({ message: "Internal server error" });
  }
});

//Select One Student and Assign one Mentor
//Write API to show all students for a particular mentor
app.get("/api/mentor-students/:mentorId", async (req, res) => {
  try {
    const { mentorId } = req.params;
    const mentor = await Mentor.findById(mentorId).populate("students");

    if (!mentor) {
      return res.status(404).json({ message: "Mentor not found" });
    }

    res.status(200).json({ message: "Students fetched successfully", students: mentor.students });
  } catch (error) {
    res.status(500).json({ message: "Internal server error" });
  }
});

//Write an API to show the previously assigned mentor for a particular student
app.get("/api/student-mentor/:studentId", async (req, res) => {
  try {
    const { studentId } = req.params;
    const student = await Student.findById(studentId).populate("mentor");

    if (!student) {
      return res.status(404).json({ message: "Student not found" });
    }

    res.status(200).json({ message: "Mentor fetched successfully", mentor: student.mentor });
  } catch (error) {
    res.status(500).json({ message: "Internal server error" });
  }
});

app.listen(PORT, () => {
  console.log(`App listening at http://localhost:${PORT}`);
});