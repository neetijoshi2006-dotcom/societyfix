const jsonDb = require('../data/jsonDb');

// Send chat message
exports.sendMessage = async (req, res) => {
  try {
    const { complaintId, message } = req.body;
    const senderId = req.user.id;

    if (!complaintId || !message) {
      return res.status(400).json({ message: 'Complaint ID and message content are required.' });
    }

    // Verify complaint exists
    let complaint;
    if (global.useJsonDb) {
      complaint = jsonDb.findById('complaints', complaintId);
    } else {
      const Complaint = require('../models/Complaints');
      complaint = await Complaint.findById(complaintId);
    }

    if (!complaint) {
      return res.status(404).json({ message: 'Complaint not found.' });
    }

    // Verify user is either the resident who filed or the staff assigned
    const isResident = complaint.residentId === senderId || (complaint.residentId._id && complaint.residentId._id.toString() === senderId);
    const isStaff = complaint.assignedStaffId === senderId || (complaint.assignedStaffId._id && complaint.assignedStaffId._id.toString() === senderId);

    if (!isResident && !isStaff) {
      return res.status(403).json({ message: 'You are not authorized to participate in this chat.' });
    }

    const receiverId = isResident 
      ? (complaint.assignedStaffId.id || complaint.assignedStaffId._id || complaint.assignedStaffId) 
      : (complaint.residentId.id || complaint.residentId._id || complaint.residentId);

    if (!receiverId) {
      return res.status(400).json({ message: 'No staff is assigned to this complaint yet.' });
    }

    const newMsgObj = {
      complaintId,
      senderId,
      receiverId: receiverId.toString(),
      message,
      attachments: [],
      seen: false
    };

    let msg;
    if (global.useJsonDb) {
      msg = jsonDb.insert('messages', newMsgObj);
      // Hydrate sender details
      const senderUser = jsonDb.findById('users', senderId);
      msg.senderName = senderUser ? senderUser.name : 'User';
      msg.senderAvatar = senderUser ? senderUser.avatar : null;
    } else {
      const Message = require('../models/Messages');
      const mongoMsg = new Message(newMsgObj);
      await mongoMsg.save();
      
      const User = require('../models/Users');
      const senderUser = await User.findById(senderId).lean();
      
      msg = mongoMsg.toObject();
      msg.id = mongoMsg._id.toString();
      msg.senderName = senderUser ? senderUser.name : 'User';
      msg.senderAvatar = senderUser ? senderUser.avatar : null;
    }

    res.status(201).json({ message: msg });
  } catch (error) {
    console.error('Send message error:', error);
    res.status(500).json({ message: 'Server error sending message.' });
  }
};

// Fetch message log for a complaint
exports.getMessages = async (req, res) => {
  try {
    const { complaintId } = req.params;
    const currentUserId = req.user.id;

    let complaint;
    if (global.useJsonDb) {
      complaint = jsonDb.findById('complaints', complaintId);
    } else {
      const Complaint = require('../models/Complaints');
      complaint = await Complaint.findById(complaintId);
    }

    if (!complaint) {
      return res.status(404).json({ message: 'Complaint not found.' });
    }

    // Scoping check
    const isResident = complaint.residentId === currentUserId || (complaint.residentId._id && complaint.residentId._id.toString() === currentUserId);
    const isStaff = complaint.assignedStaffId === currentUserId || (complaint.assignedStaffId._id && complaint.assignedStaffId._id.toString() === currentUserId);
    const isManager = ['manager', 'admin'].includes(req.user.role);

    if (!isResident && !isStaff && !isManager) {
      return res.status(403).json({ message: 'You are not authorized to view this chat history.' });
    }

    let chatList = [];
    if (global.useJsonDb) {
      chatList = jsonDb.find('messages', { complaintId });
      
      // Hydrate messages
      const users = jsonDb.find('users');
      chatList = chatList.map(m => {
        const sender = users.find(u => u.id === m.senderId);
        return {
          ...m,
          senderName: sender ? sender.name : 'Unknown User',
          senderAvatar: sender ? sender.avatar : null
        };
      });

      // Mark unread messages received by current user as seen
      chatList.forEach(m => {
        if (m.receiverId === currentUserId && !m.seen) {
          jsonDb.updateById('messages', m.id, { seen: true });
          m.seen = true;
        }
      });
    } else {
      const Message = require('../models/Messages');
      const mongoMessages = await Message.find({ complaintId })
        .populate('senderId', 'name avatar')
        .sort({ createdAt: 1 })
        .lean();
      
      chatList = mongoMessages.map(m => ({
        ...m,
        id: m._id.toString(),
        senderName: m.senderId ? m.senderId.name : 'Unknown User',
        senderAvatar: m.senderId ? m.senderId.avatar : null,
        senderId: m.senderId ? m.senderId._id.toString() : null
      }));

      // Mark as seen
      await Message.updateMany(
        { complaintId, receiverId: currentUserId, seen: false },
        { $set: { seen: true } }
      );
    }

    res.status(200).json({ messages: chatList });
  } catch (error) {
    console.error('Get messages error:', error);
    res.status(500).json({ message: 'Server error retrieving messages.' });
  }
};
