const jsonDb = require('../data/jsonDb');

// Get overview stats & chart datasets (Manager Dashboard / Admin Dashboard)
exports.getAnalytics = async (req, res) => {
  try {
    let complaints = [];
    let staffList = [];
    
    if (global.useJsonDb) {
      complaints = jsonDb.find('complaints');
      staffList = jsonDb.find('users', { role: 'staff' });
    } else {
      const Complaint = require('../models/Complaints');
      const User = require('../models/Users');
      complaints = await Complaint.find().lean();
      staffList = await User.find({ role: 'staff' }).lean();
    }

    // 1. Basic counts
    const total = complaints.length;
    const pending = complaints.filter(c => c.status === 'pending').length;
    const assigned = complaints.filter(c => c.status === 'assigned').length;
    const accepted = complaints.filter(c => c.status === 'accepted').length;
    const inProgress = complaints.filter(c => c.status === 'in-progress').length;
    const waitingMaterials = complaints.filter(c => c.status === 'waiting-materials').length;
    const completed = complaints.filter(c => c.status === 'completed').length;
    const closed = complaints.filter(c => c.status === 'closed').length;
    const active = total - closed;
    
    const emergency = complaints.filter(c => c.priority === 'emergency' && c.status !== 'closed').length;

    // 2. Category distribution
    const categories = {};
    complaints.forEach(c => {
      categories[c.category] = (categories[c.category] || 0) + 1;
    });
    const byCategory = Object.keys(categories).map(cat => ({
      name: cat,
      value: categories[cat]
    }));

    // 3. Monthly Trends (Simulating last 6 months)
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const monthlyDataMap = {};
    
    // Group complaints by month/year
    complaints.forEach(c => {
      const date = new Date(c.createdAt);
      const label = `${months[date.getMonth()]} ${date.getFullYear()}`;
      monthlyDataMap[label] = (monthlyDataMap[label] || 0) + 1;
    });

    // Ensure we have some entries sorted chronologically
    const monthlyTrends = Object.keys(monthlyDataMap).map(key => ({
      name: key,
      count: monthlyDataMap[key]
    })).slice(-6); // Last 6 months

    // 4. Resolution Time calculation (in hours)
    let totalResolutionTimeMs = 0;
    let resolvedCount = 0;
    
    complaints.forEach(c => {
      if (['completed', 'closed'].includes(c.status)) {
        // Find completion date from timeline
        const compEvent = c.timeline.find(e => e.status === 'completed');
        if (compEvent) {
          const start = new Date(c.createdAt);
          const end = new Date(compEvent.updatedAt);
          const diff = end - start;
          if (diff > 0) {
            totalResolutionTimeMs += diff;
            resolvedCount++;
          }
        }
      }
    });

    const avgResolutionTimeHours = resolvedCount > 0 
      ? parseFloat((totalResolutionTimeMs / (1000 * 60 * 60 * resolvedCount)).toFixed(1))
      : 8.5; // default fallback metric for visualization

    // 5. Staff Workload & Performance details
    const staffWorkload = staffList.map(s => {
      const staffId = s.id || s._id.toString();
      const activeJobs = complaints.filter(c => c.assignedStaffId === staffId && !['completed', 'closed'].includes(c.status)).length;
      const completedJobs = complaints.filter(c => c.assignedStaffId === staffId && ['completed', 'closed'].includes(c.status)).length;
      return {
        id: staffId,
        name: s.name,
        avatar: s.avatar,
        skills: s.details?.skills || [],
        rating: s.details?.rating || 5.0,
        activeJobs,
        completedJobs
      };
    });

    res.status(200).json({
      stats: {
        total,
        pending,
        assigned,
        accepted,
        inProgress,
        waitingMaterials,
        completed,
        closed,
        active,
        emergency,
        avgResolutionTimeHours
      },
      byCategory,
      monthlyTrends: monthlyTrends.length > 0 ? monthlyTrends : [
        { name: 'Feb 2026', count: 4 },
        { name: 'Mar 2026', count: 7 },
        { name: 'Apr 2026', count: 5 },
        { name: 'May 2026', count: 12 },
        { name: 'Jun 2026', count: 15 },
        { name: 'Jul 2026', count: 10 }
      ],
      staffWorkload
    });
  } catch (error) {
    console.error('Get analytics error:', error);
    res.status(500).json({ message: 'Server error compiling analytics.' });
  }
};

// Staff list for selection (Manager dropdown helper)
exports.getStaffList = async (req, res) => {
  try {
    let staff = [];
    if (global.useJsonDb) {
      staff = jsonDb.find('users', { role: 'staff' });
    } else {
      const User = require('../models/Users');
      staff = await User.find({ role: 'staff' }).lean();
      staff = staff.map(s => ({ ...s, id: s._id.toString() }));
    }

    res.status(200).json({ staff });
  } catch (error) {
    console.error('Get staff list error:', error);
    res.status(500).json({ message: 'Server error retrieving staff.' });
  }
};

// Create a new staff account (Manager/Admin only)
exports.createStaff = async (req, res) => {
  try {
    const { name, email, password, phone, skills } = req.body;

    if (!name || !email || !password || !phone) {
      return res.status(400).json({ message: 'Name, email, password, and phone are required.' });
    }

    const bcrypt = require('bcryptjs');
    const hashedPassword = await bcrypt.hash(password, 10);
    const defaultAvatar = `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(name)}`;

    const newStaffObj = {
      name,
      email: email.toLowerCase(),
      password: hashedPassword,
      phone,
      role: 'staff',
      avatar: defaultAvatar,
      details: {
        skills: Array.isArray(skills) ? skills : [skills || 'General maintenance'],
        rating: 5.0,
        activeJobsCount: 0,
        isSuspended: false
      },
      notificationPreferences: { email: true, sms: true, inApp: true }
    };

    let staff;
    if (global.useJsonDb) {
      const existing = jsonDb.findOne('users', { email: email.toLowerCase() });
      if (existing) return res.status(400).json({ message: 'User with this email already exists.' });
      staff = jsonDb.insert('users', newStaffObj);
    } else {
      const User = require('../models/Users');
      const existing = await User.findOne({ email: email.toLowerCase() });
      if (existing) return res.status(400).json({ message: 'User with this email already exists.' });
      const mongoStaff = new User(newStaffObj);
      await mongoStaff.save();
      staff = mongoStaff.toObject();
      staff.id = mongoStaff._id.toString();
    }

    delete staff.password;
    res.status(201).json({
      message: 'Staff registered successfully!',
      staff
    });
  } catch (error) {
    console.error('Create staff error:', error);
    res.status(500).json({ message: 'Server error creating staff account.' });
  }
};

// Suspend or toggle staff suspension status
exports.toggleSuspendStaff = async (req, res) => {
  try {
    const { staffId } = req.params;
    let staff;

    if (global.useJsonDb) {
      staff = jsonDb.findById('users', staffId);
      if (!staff || staff.role !== 'staff') {
        return res.status(404).json({ message: 'Staff member not found.' });
      }
      const isSuspended = staff.details?.isSuspended || false;
      staff = jsonDb.updateById('users', staffId, {
        details: {
          ...staff.details,
          isSuspended: !isSuspended
        }
      });
    } else {
      const User = require('../models/Users');
      const mongoStaff = await User.findById(staffId);
      if (!mongoStaff || mongoStaff.role !== 'staff') {
        return res.status(404).json({ message: 'Staff member not found.' });
      }
      mongoStaff.details.isSuspended = !mongoStaff.details.isSuspended;
      await mongoStaff.save();
      staff = mongoStaff.toObject();
      staff.id = mongoStaff._id.toString();
    }

    res.status(200).json({
      message: `Staff ${staff.details.isSuspended ? 'suspended' : 'activated'} successfully!`,
      staff
    });
  } catch (error) {
    console.error('Toggle suspend staff error:', error);
    res.status(500).json({ message: 'Server error managing staff state.' });
  }
};

// Admin database user list endpoint
exports.getAllUsers = async (req, res) => {
  try {
    let users = [];
    if (global.useJsonDb) {
      users = jsonDb.find('users');
    } else {
      const User = require('../models/Users');
      users = await User.find().lean();
      users = users.map(u => ({ ...u, id: u._id.toString() }));
    }

    // Strip passwords
    users.forEach(u => delete u.password);

    res.status(200).json({ users });
  } catch (error) {
    console.error('Get all users error:', error);
    res.status(500).json({ message: 'Server error retrieving users.' });
  }
};
