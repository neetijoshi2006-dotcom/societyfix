const jsonDb = require('../data/jsonDb');

exports.createPoll = async (req, res) => {
  try {
    const { question, options, days } = req.body;
    const postedBy = req.user.id;

    if (!question || !options || options.length < 2) {
      return res.status(400).json({ message: 'Question and at least 2 options are required.' });
    }

    const expiry = new Date(Date.now() + 1000 * 60 * 60 * 24 * (days || 3)).toISOString();

    const newPollObj = {
      question,
      options: options.map((o, i) => ({ id: `opt${i+1}`, text: o.text, votes: 0 })),
      createdBy: postedBy,
      expiry,
      status: 'Active',
      voters: [],
      totalVotes: 0
    };

    let poll;
    if (global.useJsonDb) {
      poll = jsonDb.insert('polls', newPollObj);
      const managerUser = jsonDb.findById('users', postedBy);
      poll.createdByName = managerUser ? managerUser.name : 'Manager';
    } else {
      const Poll = require('../models/Polls');
      const mongoPoll = new Poll(newPollObj);
      await mongoPoll.save();
      
      const User = require('../models/Users');
      const managerUser = await User.findById(postedBy).lean();
      
      poll = mongoPoll.toObject();
      poll.id = mongoPoll._id.toString();
      poll.createdByName = managerUser ? managerUser.name : 'Manager';
    }

    if (req.io) {
      req.io.emit('notification_received', {
        id: Math.random().toString(36).substring(2, 9),
        type: 'poll',
        title: `New Poll: ${question}`,
        content: 'Have your say in the society decisions!',
        createdAt: new Date().toISOString()
      });
    }

    res.status(201).json({ message: 'Poll created successfully!', poll });
  } catch (error) {
    console.error('Create poll error:', error);
    res.status(500).json({ message: 'Server error creating poll.' });
  }
};

exports.getPolls = async (req, res) => {
  try {
    const userId = req.user.id;
    let list = [];
    
    if (global.useJsonDb) {
      list = jsonDb.find('polls');
      const users = jsonDb.find('users');
      list = list.map(p => {
        const creator = users.find(u => u.id === p.createdBy);
        return {
          ...p,
          createdBy: creator ? creator.name : 'Manager',
          hasVoted: p.voters.find(v => v.userId === userId)?.optionId || null
        };
      });
    } else {
      const Poll = require('../models/Polls');
      list = await Poll.find().populate('createdBy', 'name').sort({ createdAt: -1 }).lean();
      
      list = list.map(p => ({
        ...p,
        id: p._id.toString(),
        createdBy: p.createdBy ? p.createdBy.name : 'Manager',
        hasVoted: (p.voters || []).includes(userId) ? 'opt1' : null // Mock option for simplicity if voted
      }));
    }

    list.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    res.status(200).json({ polls: list });
  } catch (error) {
    console.error('Get polls error:', error);
    res.status(500).json({ message: 'Server error retrieving polls.' });
  }
};

exports.votePoll = async (req, res) => {
  try {
    const { id } = req.params;
    const { optionId } = req.body;
    const userId = req.user.id;

    if (global.useJsonDb) {
      const poll = jsonDb.findById('polls', id);
      if (!poll) return res.status(404).json({ message: 'Poll not found.' });
      
      const hasVoted = poll.voters.find(v => v.userId === userId);
      if (hasVoted) return res.status(400).json({ message: 'You have already voted.' });

      const optIndex = poll.options.findIndex(o => o.id === optionId);
      if (optIndex === -1) return res.status(400).json({ message: 'Invalid option.' });

      poll.options[optIndex].votes += 1;
      poll.totalVotes += 1;
      poll.voters.push({ userId, optionId });
      
      jsonDb.updateById('polls', id, poll);
      res.status(200).json({ message: 'Vote cast successfully.' });
    } else {
      const Poll = require('../models/Polls');
      const poll = await Poll.findById(id);
      if (!poll) return res.status(404).json({ message: 'Poll not found.' });
      
      if (poll.voters.includes(userId)) return res.status(400).json({ message: 'You have already voted.' });
      
      const opt = poll.options.find(o => o.id === optionId);
      if (!opt) return res.status(400).json({ message: 'Invalid option.' });

      opt.votes += 1;
      poll.totalVotes += 1;
      poll.voters.push(userId);
      await poll.save();
      
      res.status(200).json({ message: 'Vote cast successfully.' });
    }
  } catch (error) {
    console.error('Vote error:', error);
    res.status(500).json({ message: 'Server error casting vote.' });
  }
};

exports.deletePoll = async (req, res) => {
  try {
    const { id } = req.params;
    
    if (global.useJsonDb) {
      const item = jsonDb.findById('polls', id);
      if (!item) return res.status(404).json({ message: 'Poll not found.' });
      jsonDb.deleteById('polls', id);
    } else {
      const Poll = require('../models/Polls');
      const result = await Poll.findByIdAndDelete(id);
      if (!result) return res.status(404).json({ message: 'Poll not found.' });
    }

    res.status(200).json({ message: 'Poll deleted successfully.' });
  } catch (error) {
    console.error('Delete poll error:', error);
    res.status(500).json({ message: 'Server error deleting poll.' });
  }
};
