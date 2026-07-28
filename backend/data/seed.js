const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');

const DB_FILE = path.join(__dirname, 'db.json');

// Helper to hash password
const hashPassword = (password) => {
  return bcrypt.hashSync(password, 10);
};

const seedData = () => {
  console.log('Seeding initial data...');
  
  // 1. Users
  const users = [
    {
      id: 'usr_admin1',
      name: 'Vikram Aditya',
      email: 'admin@societyfix.com',
      password: hashPassword('admin123'),
      phone: '+91 98765 43210',
      role: 'admin',
      avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150',
      notificationPreferences: { email: true, sms: true, inApp: true },
      createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
    },
    {
      id: 'usr_manager1',
      name: 'Suresh Patil',
      email: 'manager@societyfix.com',
      password: hashPassword('manager123'),
      phone: '+91 98765 43211',
      role: 'manager',
      avatar: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=150',
      notificationPreferences: { email: true, sms: true, inApp: true },
      createdAt: new Date(Date.now() - 25 * 24 * 60 * 60 * 1000).toISOString()
    },
    // Residents
    {
      id: 'usr_res1',
      name: 'Amit Sharma',
      email: 'amit@societyfix.com',
      password: hashPassword('resident123'),
      phone: '+91 98765 43212',
      role: 'resident',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150',
      details: { building: 'Orchid', wing: 'A', floor: 4, flatNumber: '402' },
      notificationPreferences: { email: true, sms: true, inApp: true },
      createdAt: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString()
    },
    {
      id: 'usr_res2',
      name: 'Priya Deshmukh',
      email: 'priya@societyfix.com',
      password: hashPassword('resident123'),
      phone: '+91 98765 43213',
      role: 'resident',
      avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150',
      details: { building: 'Orchid', wing: 'B', floor: 12, flatNumber: '1205' },
      notificationPreferences: { email: true, sms: false, inApp: true },
      createdAt: new Date(Date.now() - 18 * 24 * 60 * 60 * 1000).toISOString()
    },
    {
      id: 'usr_res3',
      name: 'Rohan Mehta',
      email: 'rohan@societyfix.com',
      password: hashPassword('resident123'),
      phone: '+91 98765 43214',
      role: 'resident',
      avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150',
      details: { building: 'Tulip', wing: 'C', floor: 8, flatNumber: '801' },
      notificationPreferences: { email: false, sms: false, inApp: true },
      createdAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString()
    },
    // Staff
    {
      id: 'usr_staff1',
      name: 'Rahul Kumar',
      email: 'rahul@societyfix.com',
      password: hashPassword('staff123'),
      phone: '+91 98765 43220',
      role: 'staff',
      avatar: 'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?w=150',
      details: { skills: ['Electrician', 'Plumber'], rating: 4.8, activeJobsCount: 1, isSuspended: false },
      notificationPreferences: { email: true, sms: true, inApp: true },
      createdAt: new Date(Date.now() - 22 * 24 * 60 * 60 * 1000).toISOString()
    },
    {
      id: 'usr_staff2',
      name: 'Karan Singh',
      email: 'karan@societyfix.com',
      password: hashPassword('staff123'),
      phone: '+91 98765 43221',
      role: 'staff',
      avatar: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=150',
      details: { skills: ['Lift Technician'], rating: 4.5, activeJobsCount: 1, isSuspended: false },
      notificationPreferences: { email: true, sms: false, inApp: true },
      createdAt: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString()
    },
    {
      id: 'usr_staff3',
      name: 'Shanti Devi',
      email: 'shanti@societyfix.com',
      password: hashPassword('staff123'),
      phone: '+91 98765 43222',
      role: 'staff',
      avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150',
      details: { skills: ['Cleaner'], rating: 4.2, activeJobsCount: 0, isSuspended: false },
      notificationPreferences: { email: false, sms: false, inApp: true },
      createdAt: new Date(Date.now() - 19 * 24 * 60 * 60 * 1000).toISOString()
    },
    {
      id: 'usr_staff4',
      name: 'Vijay Mali',
      email: 'vijay@societyfix.com',
      password: hashPassword('staff123'),
      phone: '+91 98765 43223',
      role: 'staff',
      avatar: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=150',
      details: { skills: ['Gardener'], rating: 4.6, activeJobsCount: 0, isSuspended: false },
      notificationPreferences: { email: true, sms: true, inApp: true },
      createdAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString()
    }
  ];

  // 2. Complaints
  const complaints = [
    {
      id: 'comp_1',
      title: 'Water Leakage in Bathroom Ceiling',
      description: 'Water is dripping constantly from the ceiling in the master bathroom. It is starting to damage the wall paint. Might be related to the flat above.',
      category: 'Plumbing',
      priority: 'high',
      status: 'assigned',
      location: { building: 'Orchid', wing: 'A', floor: 4, flatNumber: '402', exactLocation: 'Master Bathroom Ceiling' },
      residentId: 'usr_res1',
      assignedStaffId: 'usr_staff1',
      images: ['https://images.unsplash.com/photo-1584622650111-993a426fbf0a?w=400'],
      beforeAfterImages: { before: ['https://images.unsplash.com/photo-1584622650111-993a426fbf0a?w=400'], after: [] },
      timeline: [
        { status: 'pending', notes: 'Complaint registered by Resident Amit Sharma', updatedBy: 'usr_res1', updatedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString() },
        { status: 'assigned', notes: 'Assigned to plumber Rahul Kumar by Manager Suresh Patil', updatedBy: 'usr_manager1', updatedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString() }
      ],
      createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
      updatedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString()
    },
    {
      id: 'comp_2',
      title: 'Lift A Not Working',
      description: 'The main elevator A in Wing B is stuck on the 10th floor. Buttons are not responding.',
      category: 'Lift',
      priority: 'emergency',
      status: 'in-progress',
      location: { building: 'Orchid', wing: 'B', floor: 10, flatNumber: 'Common Area', exactLocation: 'Elevator A' },
      residentId: 'usr_res2',
      assignedStaffId: 'usr_staff2',
      images: ['https://images.unsplash.com/photo-1558244661-d248897f7bc4?w=400'],
      beforeAfterImages: { before: ['https://images.unsplash.com/photo-1558244661-d248897f7bc4?w=400'], after: [] },
      timeline: [
        { status: 'pending', notes: 'Complaint filed by Priya Deshmukh', updatedBy: 'usr_res2', updatedAt: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString() },
        { status: 'assigned', notes: 'Assigned to Lift Tech Karan Singh', updatedBy: 'usr_manager1', updatedAt: new Date(Date.now() - 5.5 * 60 * 60 * 1000).toISOString() },
        { status: 'accepted', notes: 'Karan accepted assignment', updatedBy: 'usr_staff2', updatedAt: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString() },
        { status: 'in-progress', notes: 'Investigating electrical motor controller in lift room', updatedBy: 'usr_staff2', updatedAt: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString() }
      ],
      createdAt: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
      updatedAt: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString()
    },
    {
      id: 'comp_3',
      title: 'Common Area Light Bulb Broken',
      description: 'The corridor light bulb in Wing C 8th floor is flickering and needs replacement.',
      category: 'Electricity',
      priority: 'low',
      status: 'closed',
      location: { building: 'Tulip', wing: 'C', floor: 8, flatNumber: 'Common Area', exactLocation: '8th Floor Lobby' },
      residentId: 'usr_res3',
      assignedStaffId: 'usr_staff1',
      images: [],
      beforeAfterImages: { before: [], after: [] },
      timeline: [
        { status: 'pending', notes: 'Flickering light reported', updatedBy: 'usr_res3', updatedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString() },
        { status: 'assigned', notes: 'Assigned to Rahul Kumar', updatedBy: 'usr_manager1', updatedAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString() },
        { status: 'accepted', notes: 'Accepted by Rahul Kumar', updatedBy: 'usr_staff1', updatedAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString() },
        { status: 'in-progress', notes: 'Work started', updatedBy: 'usr_staff1', updatedAt: new Date(Date.now() - 3.8 * 24 * 60 * 60 * 1000).toISOString() },
        { status: 'completed', notes: 'Replaced bulb with 12W LED bulb', updatedBy: 'usr_staff1', updatedAt: new Date(Date.now() - 3.5 * 24 * 60 * 60 * 1000).toISOString() },
        { status: 'closed', notes: 'Resident approved resolution. Rated 5 stars.', updatedBy: 'usr_res3', updatedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString() }
      ],
      rating: { stars: 5, comment: 'Quick fix, thanks!', suggestions: 'None', createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString() },
      createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
      updatedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString()
    },
    {
      id: 'comp_4',
      title: 'Garbage Bin Overflowing',
      description: 'The green waste bin near Building Orchid Entrance is full and trash is spilling onto the road.',
      category: 'Cleaning',
      priority: 'medium',
      status: 'pending',
      location: { building: 'Orchid', wing: 'Common', floor: 0, flatNumber: 'Gate 2', exactLocation: 'Near security cabin' },
      residentId: 'usr_res1',
      images: [],
      beforeAfterImages: { before: [], after: [] },
      timeline: [
        { status: 'pending', notes: 'Garbage reported by Amit Sharma', updatedBy: 'usr_res1', updatedAt: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString() }
      ],
      createdAt: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
      updatedAt: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString()
    }
  ];

  // 3. Announcements
  const announcements = [
    {
      id: 'ann_1',
      title: 'Scheduled Water Shutdown',
      content: 'Please note there will be a scheduled water shutdown on Thursday (July 3) from 10:00 AM to 2:00 PM for cleaning of overhead water tanks of building Orchid Wing A & B. Please store water in advance.',
      category: 'water-shutdown',
      postedBy: 'usr_manager1',
      createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString()
    },
    {
      id: 'ann_2',
      title: 'Security Alert: Vehicle Parking Stickers',
      content: 'All residents are requested to collect new vehicle RFID tags from the society office. Unmarked vehicles will not be allowed inside the main gate starting next Monday.',
      category: 'security-alerts',
      postedBy: 'usr_manager1',
      createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString()
    },
    {
      id: 'ann_3',
      title: 'Monsoon Cleanliness Drive',
      content: 'We are organizing a garden cleanup and pest spraying activity this Saturday morning. Volunteers are welcome to join at the clubhouse lawn.',
      category: 'events',
      postedBy: 'usr_manager1',
      createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString()
    }
  ];

  // 4. Messages
  const messages = [
    {
      id: 'msg_1',
      complaintId: 'comp_1',
      senderId: 'usr_res1',
      receiverId: 'usr_staff1',
      message: 'Hi Rahul, is there an update on the ceiling leak? It is starting to expand.',
      seen: true,
      createdAt: new Date(Date.now() - 1.5 * 24 * 60 * 60 * 1000).toISOString()
    },
    {
      id: 'msg_2',
      complaintId: 'comp_1',
      senderId: 'usr_staff1',
      receiverId: 'usr_res1',
      message: 'Hello Amit. Yes, I inspected the pipes. The leak is coming from Flat 502 bathroom pipe. I am contacting the resident of 502 to get access and fix the main joint.',
      seen: true,
      createdAt: new Date(Date.now() - 1.4 * 24 * 60 * 60 * 1000).toISOString()
    },
    {
      id: 'msg_3',
      complaintId: 'comp_1',
      senderId: 'usr_res1',
      receiverId: 'usr_staff1',
      message: 'Okay. Please let me know once you get the keys. Thank you.',
      seen: true,
      createdAt: new Date(Date.now() - 1.2 * 24 * 60 * 60 * 1000).toISOString()
    }
  ];

  const dbData = {
    users,
    complaints,
    announcements,
    messages
  };

  fs.writeFileSync(DB_FILE, JSON.stringify(dbData, null, 2), 'utf8');
  console.log('Database successfully seeded inside db.json!');
};

seedData();
module.exports = seedData;
