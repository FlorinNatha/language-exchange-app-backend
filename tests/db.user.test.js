const User = require('../models/User');

describe('User model (DB integration)', () => {
  test('should create and retrieve a user', async () => {
    const userData = { username: 'testuser', email: 'test@example.com', password: 'secret' };
    const user = new User(userData);
    await user.save();

    const found = await User.findOne({ email: 'test@example.com' }).lean();
    expect(found).toBeTruthy();
    expect(found.username).toBe('testuser');
    expect(found.email).toBe('test@example.com');
    expect(found.password).toBe('secret');
  });
});
