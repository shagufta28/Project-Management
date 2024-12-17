const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const app = express();
const PORT = 5000;

// Middleware
app.use(express.json());
app.use(cors());

// OR enable CORS only for a specific origin
app.use(cors({
  origin: 'https://testingassignment.vercel.app' // Frontend URL
}));

// MongoDB Connection
mongoose.connect('mongodb+srv://shaguftasaifi2807:TBZL2I9aaGEQQKVh@cluster0.4ex2j.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0', {
    useNewUrlParser: true,
    useUnifiedTopology: true,
}).then(() => console.log('Connected to MongoDB')).catch(err => console.error(err));

// Schemas and Models
const projectSchema = new mongoose.Schema({
  title: String,
  description: String,
  skillsRequired: [String],
  deadline: Date,
  assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: 'Candidate' },
  tasks: [
      {
          taskName: String,
          dueDate: Date,
          points: Number,
          status: { type: String, default: 'Not Started' },
          completedDate: Date,  // Add this field
      }
  ],
  status: { type: String, default: 'Open' },
});

  
  const candidateSchema = new mongoose.Schema({
      name: String,
      skills: [String],
      email: String,
      contact: String,
  });
  
  const assignmentSchema = new mongoose.Schema({
      projectId: { type: mongoose.Schema.Types.ObjectId, ref: 'Project' },
      candidateId: { type: mongoose.Schema.Types.ObjectId, ref: 'Candidate' },
      assignmentDate: { type: Date, default: Date.now },
      acceptanceDate: Date,
      status: { type: String, default: 'Pending Acceptance' },
  });
  
  const Project = mongoose.model('Project', projectSchema);
  const Candidate = mongoose.model('Candidate', candidateSchema);
  const Assignment = mongoose.model('Assignment', assignmentSchema);
  
  // API Endpoints
  
  // Create Project
  app.post('/projects', async (req, res) => {
      try {
          const project = new Project(req.body);
          await project.save();
          res.status(201).json(project);
        } catch (error) {
          res.status(500).json({ error: error.message });
      }
  });
  
  // View Projects (Filter by Skills)
  app.get('/projects', async (req, res) => {
      try {
          const { skills } = req.query;
          const query = skills ? { skillsRequired: { $in: skills.split(',') } } : {};
          const projects = await Project.find(query).populate('assignedTo');
          res.status(200).json(projects);
      } catch (error) {
          res.status(500).json({ error: error.message });
      }
  });
  
  // Assign Project
  app.post('/assignments', async (req, res) => {
      try {
          const assignment = new Assignment(req.body);
          await assignment.save();
          res.status(201).json(assignment);
      } catch (error) {
          res.status(500).json({ error: error.message });
      }
  });
  
  // Accept/Decline Project
  app.patch('/assignments/:id', async (req, res) => {
      try {
        const { id } = req.params;
        const { status, acceptanceDate } = req.body;
        const assignment = await Assignment.findByIdAndUpdate(
            id,
            { status, acceptanceDate },
            { new: true }
        );
        res.status(200).json(assignment);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Update Project Status
app.patch('/projects/:id/status', async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;
        const project = await Project.findByIdAndUpdate(
            id,
            { status },
            { new: true }
        );
        res.status(200).json(project);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});
// Update Task Status
app.patch('/projects/:projectId/tasks/:taskId', async (req, res) => {
  const { projectId, taskId } = req.params;
  const { status } = req.body;

  try {
      const project = await Project.findById(projectId);
      if (!project) {
          return res.status(404).json({ error: 'Project not found' });
      }

      const task = project.tasks.id(taskId);
      if (!task) {
          return res.status(404).json({ error: 'Task not found' });
      }

      // Update task status and optional fields
      task.status = status;
      if (status === 'Completed') {
          task.completedDate = new Date();
      }

      await project.save();
      res.status(200).json(project);
  } catch (error) {
      res.status(500).json({ error: error.message });
  }
});


app.delete('/projects/:id', async (req, res) => {
  try {
    const projectId = req.params.id;
    await Project.findByIdAndDelete(projectId);
    res.status(200).json({ message: 'Project deleted successfully!' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting project', error });
  }
});


// Start Server
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));


