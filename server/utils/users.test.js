const expect = require('expect');

const {Users} = require('./users');

describe('Users', () => {
	var users;

	beforeEach(() => {
		users = new Users();
		users.users =[{
			id: '1',
			name: 'Mohamed',
			room: 'NodeJS room'
		}, {
			id: '2',
			name: 'Ahmed',
			room: 'MomentJS room'
		}, {
			id: '3',
			name: 'Mahmoud',
			room: 'JS room'
		}]
	});

	it('should add new user', () => {
		var users = new Users();
		var user = {
			id: '123',
			name: 'Moumen',
			room: 'The talents'
		};
		var resUser = users.addUser(user.id, user.name, user.room);
		expect(users.users).toEqual([user]);
	});

	it('should remove a user', () => {
		var userId = '1';
		var user = users.removeUser(userId);

		expect(user.id).toBe(userId);
		expect(users.users.length).toBe(2);
	});

	it('should not remove user', () => {
		var userId = '99';
		var user = users.removeUser(userId);

		expect(user).toNotExist();
		expect(users.users.length).toBe(3);
	});

	it('should find user', () => {
		var userId = '2';
		var user = users.getUser(userId);

		expect(user.id).toBe(userId);
	});

	it('should not find user', () => {
		var userId = '99';
		var user = users.getUser(userId);

		expect(user).toNotExist();
	});

	it('should return names for node', () => {
		var userList = users.getUserList('NodeJS room');

		expect(userList).toEqual(['Mohamed'])
	});

	it('should return names for JS', () => {
		var userList = users.getUserList('JS room');

		expect(userList).toEqual(['Mahmoud'])
	});
});