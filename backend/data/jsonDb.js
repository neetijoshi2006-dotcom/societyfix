const fs = require('fs');
const path = require('path');

const DB_FILE = path.join(__dirname, 'db.json');

// Ensure db.json exists with default structures
function initDb() {
  if (!fs.existsSync(DB_FILE)) {
    const defaultData = {
      users: [],
      complaints: [],
      announcements: [],
      messages: []
    };
    fs.writeFileSync(DB_FILE, JSON.stringify(defaultData, null, 2), 'utf8');
  }
}

initDb();

function readData() {
  initDb();
  try {
    const content = fs.readFileSync(DB_FILE, 'utf8');
    return JSON.parse(content);
  } catch (error) {
    console.error('Error reading JSON DB:', error);
    return { users: [], complaints: [], announcements: [], messages: [] };
  }
}

function writeData(data) {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), 'utf8');
  } catch (error) {
    console.error('Error writing JSON DB:', error);
  }
}

const jsonDb = {
  // Collection generic operations
  find: (collectionName, query = {}) => {
    const data = readData();
    const collection = data[collectionName] || [];
    
    return collection.filter(item => {
      for (let key in query) {
        // Simple matching (handle object nested checks if needed)
        if (query[key] !== undefined && item[key] !== query[key]) {
          return false;
        }
      }
      return true;
    });
  },

  findOne: (collectionName, query = {}) => {
    const items = jsonDb.find(collectionName, query);
    return items.length > 0 ? items[0] : null;
  },

  findById: (collectionName, id) => {
    return jsonDb.findOne(collectionName, { id: id });
  },

  insert: (collectionName, doc) => {
    const data = readData();
    if (!data[collectionName]) {
      data[collectionName] = [];
    }
    
    const newDoc = {
      id: doc.id || Math.random().toString(36).substring(2, 9),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      ...doc
    };
    
    data[collectionName].push(newDoc);
    writeData(data);
    return newDoc;
  },

  updateById: (collectionName, id, updates) => {
    const data = readData();
    const collection = data[collectionName] || [];
    const index = collection.findIndex(item => item.id === id);
    
    if (index !== -1) {
      collection[index] = {
        ...collection[index],
        ...updates,
        updatedAt: new Date().toISOString()
      };
      writeData(data);
      return collection[index];
    }
    return null;
  },

  deleteById: (collectionName, id) => {
    const data = readData();
    const collection = data[collectionName] || [];
    const index = collection.findIndex(item => item.id === id);
    
    if (index !== -1) {
      const deleted = collection.splice(index, 1)[0];
      writeData(data);
      return deleted;
    }
    return null;
  },

  // Direct raw data access for custom operations
  getRawData: () => readData(),
  saveRawData: (data) => writeData(data)
};

module.exports = jsonDb;
