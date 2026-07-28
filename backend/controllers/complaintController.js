const jsonDb = require('../data/jsonDb');

// Helper to notify active users
const notifyUser = (req, userId, notification) => {
  if (req.io) {
    req.io.to(`user_${userId}`).emit('notification_received', {
      id: Math.random().toString(36).substring(2, 9),
      createdAt: new Date().toISOString(),
      ...notification
    });
  }
};

// Create a new complaint
exports.createComplaint = async (req, res) => {
  try {
    const { title, description, category, priority, building, wing, floor, flatNumber, exactLocation } = req.body;
    const residentId = req.user.id;

    if (!title || !description || !category || !priority) {
      return res.status(400).json({ message: 'Please provide title, description, category and priority.' });
    }

    // 1. Duplicate Complaint Detection Logic
    // Find active complaints (not closed/completed) in the same building, wing, floor, and category
    let duplicates = [];
    const queryDetails = {
      category,
      'location.building': building,
      'location.wing': wing,
      status: { $nin: ['completed', 'closed'] }
    };

    if (global.useJsonDb) {
      const allComplaints = jsonDb.find('complaints');
      duplicates = allComplaints.filter(c => 
        c.category === category &&
        c.location.building === building &&
        c.location.wing === wing &&
        c.location.floor === parseInt(floor) &&
        !['completed', 'closed'].includes(c.status)
      );
    } else {
      const Complaint = require('../models/Complaints');
      duplicates = await Complaint.find({
        category,
        'location.building': building,
        'location.wing': wing,
        'location.floor': parseInt(floor),
        status: { $in: ['pending', 'assigned', 'accepted', 'in-progress', 'waiting-materials'] }
      });
    }

    let duplicateOf = null;
    let autoMerged = false;
    let initialNotes = `Complaint registered by Resident ${req.user.name}`;

    if (duplicates.length > 0) {
      // Auto merge with the first active duplicate
      duplicateOf = duplicates[0].id || duplicates[0]._id.toString();
      autoMerged = true;
      initialNotes = `Complaint registered and automatically linked to existing issue (${duplicates[0].title}) by Resident ${req.user.name}`;
    }

    // Process files if uploaded
    const files = req.files || [];
    const images = files.map(file => `/uploads/${file.filename}`);

    const newComplaintObj = {
      title,
      description,
      category,
      priority,
      status: 'pending',
      location: {
        building: building || 'Orchid',
        wing: wing || 'A',
        floor: floor ? parseInt(floor) : 1,
        flatNumber: flatNumber || '101',
        exactLocation: exactLocation || ''
      },
      residentId,
      assignedStaffId: null,
      images: images,
      beforeAfterImages: { before: images, after: [] },
      duplicateOf,
      timeline: [
        {
          status: 'pending',
          notes: initialNotes,
          updatedBy: residentId,
          updatedAt: new Date().toISOString()
        }
      ]
    };

    let complaint;
    if (global.useJsonDb) {
      complaint = jsonDb.insert('complaints', newComplaintObj);
    } else {
      const Complaint = require('../models/Complaints');
      const mongoComplaint = new Complaint(newComplaintObj);
      await mongoComplaint.save();
      complaint = mongoComplaint.toObject();
      complaint.id = mongoComplaint._id.toString();
    }

    // If auto-merged, we can notify managers
    if (autoMerged && req.io) {
      // Notify managers
      req.io.emit('notification_received', {
        id: Math.random().toString(36).substring(2, 9),
        type: 'duplicate_merge',
        title: 'Duplicate Issue Merged',
        content: `A new ticket for '${category}' in Wing ${wing} was auto-merged.`,
        createdAt: new Date().toISOString()
      });
    }

    res.status(201).json({
      message: autoMerged 
        ? 'A similar active complaint is already being addressed. Your report has been merged/linked to it.' 
        : 'Complaint filed successfully!',
      complaint,
      autoMerged
    });
  } catch (error) {
    console.error('Create complaint error:', error);
    res.status(500).json({ message: 'Server error filing complaint.' });
  }
};

// Fetch complaints with global search & filtering
exports.getComplaints = async (req, res) => {
  try {
    const { search, category, priority, status, building, staffId, residentId } = req.query;
    let list = [];

    // Load raw complaints
    if (global.useJsonDb) {
      list = jsonDb.find('complaints');
      // Hydrate resident name and staff name
      const users = jsonDb.find('users');
      list = list.map(c => {
        const resUser = users.find(u => u.id === c.residentId);
        const staffUser = c.assignedStaffId ? users.find(u => u.id === c.assignedStaffId) : null;
        return {
          ...c,
          residentName: resUser ? resUser.name : 'Unknown Resident',
          assignedStaffName: staffUser ? staffUser.name : null,
          assignedStaffAvatar: staffUser ? staffUser.avatar : null
        };
      });
    } else {
      const Complaint = require('../models/Complaints');
      list = await Complaint.find()
        .populate('residentId', 'name avatar')
        .populate('assignedStaffId', 'name avatar')
        .lean();
      
      list = list.map(c => {
        const item = { ...c, id: c._id.toString() };
        if (c.residentId) {
          item.residentName = c.residentId.name;
          item.residentId = c.residentId._id.toString();
        }
        if (c.assignedStaffId) {
          item.assignedStaffName = c.assignedStaffId.name;
          item.assignedStaffAvatar = c.assignedStaffId.avatar;
          item.assignedStaffId = c.assignedStaffId._id.toString();
        }
        return item;
      });
    }

    // Role-based scoping
    const userRole = req.user.role;
    const currentUserId = req.user.id;

    if (userRole === 'resident') {
      list = list.filter(c => c.residentId === currentUserId);
    } else if (userRole === 'staff') {
      list = list.filter(c => c.assignedStaffId === currentUserId);
    }

    // Apply Filter Criteria
    if (category) {
      list = list.filter(c => c.category.toLowerCase() === category.toLowerCase());
    }
    if (priority) {
      list = list.filter(c => c.priority.toLowerCase() === priority.toLowerCase());
    }
    if (status) {
      list = list.filter(c => c.status.toLowerCase() === status.toLowerCase());
    }
    if (building) {
      list = list.filter(c => c.location.building.toLowerCase() === building.toLowerCase());
    }
    if (staffId) {
      list = list.filter(c => c.assignedStaffId === staffId);
    }
    if (residentId) {
      list = list.filter(c => c.residentId === residentId);
    }

    // Global Search (Title, Description, Complaint ID, Building, Flat, Resident name)
    if (search) {
      const s = search.toLowerCase();
      list = list.filter(c => 
        c.id.toLowerCase().includes(s) ||
        c.title.toLowerCase().includes(s) ||
        c.description.toLowerCase().includes(s) ||
        c.location.building.toLowerCase().includes(s) ||
        c.location.flatNumber.toLowerCase().includes(s) ||
        (c.residentName && c.residentName.toLowerCase().includes(s)) ||
        (c.assignedStaffName && c.assignedStaffName.toLowerCase().includes(s))
      );
    }

    // Sort by newest first
    list.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    res.status(200).json({ complaints: list });
  } catch (error) {
    console.error('Get complaints error:', error);
    res.status(500).json({ message: 'Server error retrieving complaints.' });
  }
};

// Retrieve a single complaint with timeline details
exports.getComplaintById = async (req, res) => {
  try {
    const { id } = req.params;
    let complaint;

    if (global.useJsonDb) {
      complaint = jsonDb.findById('complaints', id);
      if (complaint) {
        const users = jsonDb.find('users');
        const resUser = users.find(u => u.id === complaint.residentId);
        const staffUser = complaint.assignedStaffId ? users.find(u => u.id === complaint.assignedStaffId) : null;
        complaint.residentName = resUser ? resUser.name : 'Unknown Resident';
        complaint.residentPhone = resUser ? resUser.phone : '';
        complaint.assignedStaffName = staffUser ? staffUser.name : null;
        complaint.assignedStaffPhone = staffUser ? staffUser.phone : null;
        complaint.assignedStaffAvatar = staffUser ? staffUser.avatar : null;
      }
    } else {
      const Complaint = require('../models/Complaints');
      const mongoComplaint = await Complaint.findById(id)
        .populate('residentId', 'name phone avatar')
        .populate('assignedStaffId', 'name phone avatar')
        .lean();
      
      if (mongoComplaint) {
        complaint = { ...mongoComplaint, id: mongoComplaint._id.toString() };
        if (mongoComplaint.residentId) {
          complaint.residentName = mongoComplaint.residentId.name;
          complaint.residentPhone = mongoComplaint.residentId.phone;
          complaint.residentId = mongoComplaint.residentId._id.toString();
        }
        if (mongoComplaint.assignedStaffId) {
          complaint.assignedStaffName = mongoComplaint.assignedStaffId.name;
          complaint.assignedStaffPhone = mongoComplaint.assignedStaffId.phone;
          complaint.assignedStaffAvatar = mongoComplaint.assignedStaffId.avatar;
          complaint.assignedStaffId = mongoComplaint.assignedStaffId._id.toString();
        }
      }
    }

    if (!complaint) {
      return res.status(404).json({ message: 'Complaint not found.' });
    }

    // Role restrictions: Resident can only view their own
    if (req.user.role === 'resident' && complaint.residentId !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized to view this complaint.' });
    }

    res.status(200).json({ complaint });
  } catch (error) {
    console.error('Get complaint detail error:', error);
    res.status(500).json({ message: 'Server error retrieving details.' });
  }
};

// Manager assigns or reassigns staff
exports.assignStaff = async (req, res) => {
  try {
    const { id } = req.params;
    const { staffId } = req.body;

    if (!staffId) {
      return res.status(400).json({ message: 'Please provide staffId.' });
    }

    let complaint;
    let staffUser;

    if (global.useJsonDb) {
      complaint = jsonDb.findById('complaints', id);
      staffUser = jsonDb.findById('users', staffId);
    } else {
      const Complaint = require('../models/Complaints');
      const User = require('../models/Users');
      complaint = await Complaint.findById(id);
      staffUser = await User.findById(staffId);
    }

    if (!complaint || !staffUser) {
      return res.status(404).json({ message: 'Complaint or Staff user not found.' });
    }

    const updates = {
      assignedStaffId: staffId,
      status: 'assigned',
      updatedAt: new Date().toISOString()
    };

    const timelineEvent = {
      status: 'assigned',
      notes: `Assigned to staff ${staffUser.name} by Manager ${req.user.name}`,
      updatedBy: req.user.id,
      updatedAt: new Date().toISOString()
    };

    let updatedComplaint;
    if (global.useJsonDb) {
      updates.timeline = [...complaint.timeline, timelineEvent];
      updatedComplaint = jsonDb.updateById('complaints', id, updates);
    } else {
      complaint.assignedStaffId = staffId;
      complaint.status = 'assigned';
      complaint.timeline.push(timelineEvent);
      await complaint.save();
      updatedComplaint = complaint.toObject();
      updatedComplaint.id = complaint._id.toString();
    }

    // Notify Resident and Staff
    notifyUser(req, complaint.residentId, {
      type: 'assigned',
      title: 'Staff Assigned',
      content: `Your complaint '${complaint.title}' has been assigned to ${staffUser.name}.`,
      complaintId: id
    });

    notifyUser(req, staffId, {
      type: 'job_assigned',
      title: 'New Job Assigned',
      content: `You have been assigned a new task: ${complaint.title}.`,
      complaintId: id
    });

    res.status(200).json({
      message: 'Staff assigned successfully!',
      complaint: updatedComplaint
    });
  } catch (error) {
    console.error('Assign staff error:', error);
    res.status(500).json({ message: 'Server error during staff assignment.' });
  }
};

// Staff accepts, rejects, starts, waits, or completes work
exports.updateComplaintStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, notes } = req.body;

    const allowedStatuses = ['accepted', 'in-progress', 'waiting-materials', 'completed', 'pending']; // pending = rejected fallback

    if (!status || !allowedStatuses.includes(status)) {
      return res.status(400).json({ message: 'Invalid status update request.' });
    }

    let complaint;
    if (global.useJsonDb) {
      complaint = jsonDb.findById('complaints', id);
    } else {
      const Complaint = require('../models/Complaints');
      complaint = await Complaint.findById(id);
    }

    if (!complaint) {
      return res.status(404).json({ message: 'Complaint not found.' });
    }

    // Ensure staff updating is indeed the assigned staff
    if (req.user.role === 'staff' && complaint.assignedStaffId !== req.user.id) {
      return res.status(403).json({ message: 'You are not assigned to this complaint.' });
    }

    let targetStatus = status;
    let descriptionNotes = notes || `Status updated to ${status} by ${req.user.name}`;
    let assignedStaffId = complaint.assignedStaffId;

    // Handle rejection (revert to pending and unassign)
    if (status === 'pending') {
      assignedStaffId = null;
      descriptionNotes = notes ? `Assignment rejected: ${notes}` : `Assignment rejected by staff ${req.user.name}`;
    }

    const updates = {
      status: targetStatus,
      assignedStaffId,
      updatedAt: new Date().toISOString()
    };

    const timelineEvent = {
      status: targetStatus,
      notes: descriptionNotes,
      updatedBy: req.user.id,
      updatedAt: new Date().toISOString()
    };

    // Before/After image support if uploaded during completion
    if (status === 'completed' && req.files && req.files.length > 0) {
      const files = req.files || [];
      const afterImages = files.map(file => `/uploads/${file.filename}`);
      updates['beforeAfterImages.after'] = afterImages;
    }

    let updatedComplaint;
    if (global.useJsonDb) {
      updates.timeline = [...complaint.timeline, timelineEvent];
      if (status === 'completed' && req.files && req.files.length > 0) {
        const files = req.files || [];
        const afterImages = files.map(file => `/uploads/${file.filename}`);
        updates.beforeAfterImages = {
          before: complaint.beforeAfterImages.before || [],
          after: afterImages
        };
      }
      updatedComplaint = jsonDb.updateById('complaints', id, updates);
    } else {
      complaint.status = targetStatus;
      complaint.assignedStaffId = assignedStaffId;
      complaint.timeline.push(timelineEvent);
      if (status === 'completed' && req.files && req.files.length > 0) {
        const files = req.files || [];
        const afterImages = files.map(file => `/uploads/${file.filename}`);
        complaint.beforeAfterImages.after = afterImages;
      }
      await complaint.save();
      updatedComplaint = complaint.toObject();
      updatedComplaint.id = complaint._id.toString();
    }

    // Notify resident on status update
    notifyUser(req, complaint.residentId, {
      type: 'status_update',
      title: `Complaint ${status.charAt(0).toUpperCase() + status.slice(1)}`,
      content: `Your complaint '${complaint.title}' status has changed to: ${status}.`,
      complaintId: id
    });

    // Notify manager if rejected
    if (status === 'pending' && req.io) {
      req.io.emit('notification_received', {
        id: Math.random().toString(36).substring(2, 9),
        type: 'job_rejected',
        title: 'Job Assignment Rejected',
        content: `Staff ${req.user.name} rejected assignment for '${complaint.title}'`,
        createdAt: new Date().toISOString()
      });
    }

    res.status(200).json({
      message: `Complaint marked as ${status} successfully!`,
      complaint: updatedComplaint
    });
  } catch (error) {
    console.error('Update status error:', error);
    res.status(500).json({ message: 'Server error updating status.' });
  }
};

// Manager approves complaint closure
exports.closeComplaint = async (req, res) => {
  try {
    const { id } = req.params;

    let complaint;
    if (global.useJsonDb) {
      complaint = jsonDb.findById('complaints', id);
    } else {
      const Complaint = require('../models/Complaints');
      complaint = await Complaint.findById(id);
    }

    if (!complaint) {
      return res.status(404).json({ message: 'Complaint not found.' });
    }

    const updates = {
      status: 'closed',
      updatedAt: new Date().toISOString()
    };

    const timelineEvent = {
      status: 'closed',
      notes: `Complaint closed and approved by Manager ${req.user.name}`,
      updatedBy: req.user.id,
      updatedAt: new Date().toISOString()
    };

    let updatedComplaint;
    if (global.useJsonDb) {
      updates.timeline = [...complaint.timeline, timelineEvent];
      updatedComplaint = jsonDb.updateById('complaints', id, updates);
    } else {
      complaint.status = 'closed';
      complaint.timeline.push(timelineEvent);
      await complaint.save();
      updatedComplaint = complaint.toObject();
      updatedComplaint.id = complaint._id.toString();
    }

    // Notify Resident
    notifyUser(req, complaint.residentId, {
      type: 'closed',
      title: 'Complaint Closed',
      content: `Your complaint '${complaint.title}' has been successfully closed.`,
      complaintId: id
    });

    res.status(200).json({
      message: 'Complaint closed and archived successfully.',
      complaint: updatedComplaint
    });
  } catch (error) {
    console.error('Close complaint error:', error);
    res.status(500).json({ message: 'Server error closing complaint.' });
  }
};

// Resident deletes complaint (only if status is pending - before staff assigned)
exports.deleteComplaint = async (req, res) => {
  try {
    const { id } = req.params;
    let complaint;

    if (global.useJsonDb) {
      complaint = jsonDb.findById('complaints', id);
    } else {
      const Complaint = require('../models/Complaints');
      complaint = await Complaint.findById(id);
    }

    if (!complaint) {
      return res.status(404).json({ message: 'Complaint not found.' });
    }

    if (complaint.residentId !== req.user.id) {
      return res.status(403).json({ message: 'You can only delete your own complaints.' });
    }

    if (complaint.status !== 'pending') {
      return res.status(400).json({ message: 'Cannot delete complaint after it has been assigned/processed.' });
    }

    if (global.useJsonDb) {
      jsonDb.deleteById('complaints', id);
    } else {
      const Complaint = require('../models/Complaints');
      await Complaint.findByIdAndDelete(id);
    }

    res.status(200).json({ message: 'Complaint deleted successfully.' });
  } catch (error) {
    console.error('Delete complaint error:', error);
    res.status(500).json({ message: 'Server error deleting complaint.' });
  }
};

// Resident rates and leaves feedback on a completed complaint
exports.rateComplaint = async (req, res) => {
  try {
    const { id } = req.params;
    const { stars, comment, suggestions } = req.body;

    if (!stars || stars < 1 || stars > 5) {
      return res.status(400).json({ message: 'Rating must be between 1 and 5 stars.' });
    }

    let complaint;
    if (global.useJsonDb) {
      complaint = jsonDb.findById('complaints', id);
    } else {
      const Complaint = require('../models/Complaints');
      complaint = await Complaint.findById(id);
    }

    if (!complaint) {
      return res.status(404).json({ message: 'Complaint not found.' });
    }

    if (complaint.residentId !== req.user.id) {
      return res.status(403).json({ message: 'Only the resident who filed the complaint can rate it.' });
    }

    // Allow rating on completed or closed complaints
    if (!['completed', 'closed'].includes(complaint.status)) {
      return res.status(400).json({ message: 'Can only rate completed or closed complaints.' });
    }

    const ratingObj = {
      stars: parseInt(stars),
      comment: comment || '',
      suggestions: suggestions || '',
      createdAt: new Date().toISOString()
    };

    let updatedComplaint;
    if (global.useJsonDb) {
      updatedComplaint = jsonDb.updateById('complaints', id, { rating: ratingObj });
      
      // Update average rating for the staff member
      if (complaint.assignedStaffId) {
        const staff = jsonDb.findById('users', complaint.assignedStaffId);
        if (staff) {
          const staffComplaints = jsonDb.find('complaints', { assignedStaffId: staff.id });
          const ratedComplaints = staffComplaints.filter(c => c.rating);
          const totalStars = ratedComplaints.reduce((acc, c) => acc + c.rating.stars, 0) + ratingObj.stars;
          const avgStars = parseFloat((totalStars / (ratedComplaints.length + 1)).toFixed(1));
          
          jsonDb.updateById('users', staff.id, {
            details: {
              ...staff.details,
              rating: avgStars
            }
          });
        }
      }
    } else {
      complaint.rating = ratingObj;
      await complaint.save();
      updatedComplaint = complaint.toObject();
      updatedComplaint.id = complaint._id.toString();

      // Mongoose: Update staff avg rating
      if (complaint.assignedStaffId) {
        const User = require('../models/Users');
        const Complaint = require('../models/Complaints');
        const staff = await User.findById(complaint.assignedStaffId);
        if (staff) {
          const ratings = await Complaint.find({ assignedStaffId: staff._id, 'rating.stars': { $exists: true } }).select('rating');
          const totalStars = ratings.reduce((acc, c) => acc + c.rating.stars, 0);
          const count = ratings.length;
          staff.details.rating = count > 0 ? parseFloat((totalStars / count).toFixed(1)) : ratingObj.stars;
          await staff.save();
        }
      }
    }

    res.status(200).json({
      message: 'Thank you for your feedback!',
      complaint: updatedComplaint
    });
  } catch (error) {
    console.error('Rate complaint error:', error);
    res.status(500).json({ message: 'Server error submitting feedback.' });
  }
};

// Dynamic AI-powered Assistant suggestions
exports.suggestAI = (req, res) => {
  const { description } = req.body;

  if (!description || description.trim().length < 5) {
    return res.status(200).json({
      suggestedCategory: '',
      tips: []
    });
  }

  const text = description.toLowerCase();

  // Category mapping mapping
  let suggestedCategory = 'Others';
  let tips = [];

  if (text.includes('leak') || text.includes('water') || text.includes('drip') || text.includes('tap') || text.includes('flush') || text.includes('clog')) {
    suggestedCategory = 'Plumbing';
    tips = [
      'Locate and turn off the main water valve/inlet (usually located under your sink or in the balcony duct) to prevent immediate flooding.',
      'Wrap a dry cloth around the leaking joint or place a bucket underneath.',
      'Avoid running other taps or flush systems connected to the same pipe line.'
    ];
  } else if (text.includes('lift') || text.includes('elevator') || text.includes('stuck') || text.includes('button')) {
    suggestedCategory = 'Lift';
    tips = [
      'If you are trapped inside: Do not panic. Push the yellow alarm/bell button on the panel or use the intercom.',
      'Check if the lift doors are fully closed. Do not try to force open the doors.',
      'Society backup generator automatically kicks in within 15 seconds in case of a power outage.'
    ];
  } else if (text.includes('electricity') || text.includes('power') || text.includes('fuse') || text.includes('mcb') || text.includes('socket') || text.includes('bulb') || text.includes('switch') || text.includes('flicker')) {
    suggestedCategory = 'Electricity';
    tips = [
      'Check if the main MCB breaker in your flat utility area has tripped. Toggle it back to ON.',
      'Unplug heavy appliances (AC, microwave, geyser) that may have caused overloading.',
      'If it is a partial blackout (only some rooms), it could be a phase failure. Maintenance staff will check the society main distribution panel.'
    ];
  } else if (text.includes('parking') || text.includes('car') || text.includes('bike') || text.includes('vehicle') || text.includes('slot') || text.includes('blocked')) {
    suggestedCategory = 'Parking';
    tips = [
      'Double check your parking sticker. Ensure vehicle is within marked yellow boundaries.',
      'If another vehicle blocked your slot, note down the license plate and category. Staff will check the society vehicle register to alert the owner.'
    ];
  } else if (text.includes('clean') || text.includes('dust') || text.includes('garbage') || text.includes('trash') || text.includes('sweep') || text.includes('dirty') || text.includes('smell')) {
    suggestedCategory = 'Cleaning';
    tips = [
      'Please ensure dry and wet waste are separated in standard color-coded bins.',
      'For immediate spills in the lobby, our housekeeping team operates in shifts from 8 AM to 6 PM.'
    ];
  } else if (text.includes('stranger') || text.includes('guard') || text.includes('gate') || text.includes('security') || text.includes('theft') || text.includes('camera') || text.includes('lock')) {
    suggestedCategory = 'Security';
    tips = [
      'For immediate safety concerns, use the Quick Call button on the Emergency screen to reach the main security gate directly.',
      'Ensure your flat door smart-locks or safety latch are engaged.',
      'Guest verification history can be checked in real-time via the security gate portal.'
    ];
  }

  res.status(200).json({
    suggestedCategory,
    tips
  });
};
