const jsonDb = require('../data/jsonDb');

exports.getFees = async (req, res) => {
  try {
    const residentId = req.user.id;
    let list = [];
    
    if (global.useJsonDb) {
      list = jsonDb.find('fees', { residentId });
      
      // If empty for this resident, let's auto-generate some mock data just so the UI has something to show!
      if (list.length === 0) {
        const today = new Date();
        const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
        
        for (let i = 0; i < 4; i++) {
          const d = new Date(today.getFullYear(), today.getMonth() - i, 15);
          const monthStr = `${months[d.getMonth()]} ${d.getFullYear()}`;
          const isCurrent = i === 0;
          
          jsonDb.insert('fees', {
            residentId,
            month: monthStr,
            amount: 2500,
            dueOn: d.toISOString().split('T')[0],
            paidOn: isCurrent ? null : new Date(d.getFullYear(), d.getMonth(), 10).toISOString().split('T')[0],
            status: isCurrent ? 'Due Soon' : 'Paid'
          });
        }
        list = jsonDb.find('fees', { residentId });
      }
    } else {
      const MaintenanceFee = require('../models/MaintenanceFee');
      list = await MaintenanceFee.find({ residentId }).sort({ dueOn: -1 }).lean();
      
      if (list.length === 0) {
        // Auto-generate some mock data for Mongo too
        const today = new Date();
        const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
        
        for (let i = 0; i < 4; i++) {
          const d = new Date(today.getFullYear(), today.getMonth() - i, 15);
          const monthStr = `${months[d.getMonth()]} ${d.getFullYear()}`;
          const isCurrent = i === 0;
          
          const mf = new MaintenanceFee({
            residentId,
            month: monthStr,
            amount: 2500,
            dueOn: d.toISOString().split('T')[0],
            paidOn: isCurrent ? null : new Date(d.getFullYear(), d.getMonth(), 10).toISOString().split('T')[0],
            status: isCurrent ? 'Due Soon' : 'Paid'
          });
          await mf.save();
        }
        list = await MaintenanceFee.find({ residentId }).sort({ dueOn: -1 }).lean();
      }
      list = list.map(p => ({ ...p, id: p._id.toString() }));
    }

    // Refresh statuses
    const todayStr = new Date().toISOString().split('T')[0];
    list = list.map(f => {
      if (f.status !== 'Paid' && f.dueOn < todayStr) {
        f.status = 'Overdue';
        if (global.useJsonDb) {
          jsonDb.updateById('fees', f.id, { status: 'Overdue' });
        } else {
          const MaintenanceFee = require('../models/MaintenanceFee');
          MaintenanceFee.findByIdAndUpdate(f.id, { status: 'Overdue' }).exec();
        }
      }
      return f;
    });

    list.sort((a, b) => new Date(b.dueOn) - new Date(a.dueOn));
    res.status(200).json({ fees: list });
  } catch (error) {
    console.error('Get fees error:', error);
    res.status(500).json({ message: 'Server error retrieving fees.' });
  }
};

exports.payFee = async (req, res) => {
  try {
    const { id } = req.params;
    const today = new Date().toISOString().split('T')[0];
    
    if (global.useJsonDb) {
      const fee = jsonDb.findById('fees', id);
      if (!fee) return res.status(404).json({ message: 'Fee record not found.' });
      
      jsonDb.updateById('fees', id, { status: 'Paid', paidOn: today });
    } else {
      const MaintenanceFee = require('../models/MaintenanceFee');
      await MaintenanceFee.findByIdAndUpdate(id, { status: 'Paid', paidOn: today });
    }

    res.status(200).json({ message: 'Payment successful!' });
  } catch (error) {
    console.error('Pay fee error:', error);
    res.status(500).json({ message: 'Server error processing payment.' });
  }
};
