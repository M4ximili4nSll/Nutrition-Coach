// Mock Firebase Auth
export const auth = {
    currentUser: null,
    onAuthStateChanged: jest.fn((callback) => {
        callback(auth.currentUser);
        return jest.fn(); // unsubscribe function
    })
};

// Mock Firestore
const mockData = new Map();

export const db = {
    collection: jest.fn((name) => ({
        doc: jest.fn((id) => ({
            get: jest.fn(() => Promise.resolve({
                exists: () => mockData.has(`${name}/${id}`),
                data: () => mockData.get(`${name}/${id}`)
            })),
            set: jest.fn((data) => {
                mockData.set(`${name}/${id}`, data);
                return Promise.resolve();
            }),
            update: jest.fn((data) => {
                const existing = mockData.get(`${name}/${id}`) || {};
                mockData.set(`${name}/${id}`, { ...existing, ...data });
                return Promise.resolve();
            }),
            delete: jest.fn(() => {
                mockData.delete(`${name}/${id}`);
                return Promise.resolve();
            })
        })),
        add: jest.fn((data) => {
            const id = Math.random().toString(36).substring(7);
            mockData.set(`${name}/${id}`, data);
            return Promise.resolve({ id });
        }),
        where: jest.fn(() => ({
            get: jest.fn(() => {
                const docs = Array.from(mockData.entries())
                    .filter(([key]) => key.startsWith(`${name}/`))
                    .map(([key, data]) => ({
                        id: key.split('/')[1],
                        data: () => data
                    }));
                return Promise.resolve({ docs });
            })
        }))
    }))
};

// Helper zum Zurücksetzen
export const resetMockData = () => {
    mockData.clear();
    auth.currentUser = null;
};