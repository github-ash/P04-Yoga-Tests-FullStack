describe('Yoga studio browser journeys', () => {
  const session = {
    id: 1,
    name: 'Morning yoga',
    description: 'A gentle practice for everyone',
    date: '2026-11-15',
    teacher_id: 1,
    users: [2],
    createdAt: '2026-10-01T09:00:00',
    updatedAt: '2026-10-02T09:00:00',
  };
  const teacher = { id: 1, firstName: 'Margot', lastName: 'Martin' };
  const account = {
    id: 2,
    email: 'member@example.com',
    firstName: 'Alice',
    lastName: 'Martin',
    admin: false,
    createdAt: '2026-10-01T09:00:00',
    updatedAt: '2026-10-02T09:00:00',
  };
  let sessions = [session];

  function login(admin = false) {
    cy.intercept('POST', '/api/auth/login', {
      token: 'browser-test-token',
      type: 'Bearer',
      id: 2,
      username: account.email,
      firstName: account.firstName,
      lastName: account.lastName,
      admin,
    }).as('login');
    cy.visit('/login');
    cy.get('[formControlName=email]').type(account.email);
    cy.get('[formControlName=password]').type('Password123!');
    cy.get('button[type=submit]').click();
    cy.wait('@login').its('request.body').should('deep.equal', {
      email: account.email,
      password: 'Password123!',
    });
    cy.url().should('include', '/sessions');
    cy.wait('@sessions');
  }

  beforeEach(() => {
    sessions = [{ ...session }];
    cy.intercept('GET', '/api/session', (req) => req.reply(sessions)).as('sessions');
    cy.intercept('GET', '/api/session/1', session).as('detail');
    cy.intercept('GET', '/api/teacher', [teacher]).as('teachers');
    cy.intercept('GET', '/api/teacher/1', teacher).as('teacher');
    cy.intercept('GET', '/api/user/2', account).as('account');
  });

  it('protects private pages and validates login before submitting', () => {
    cy.visit('/sessions');
    cy.url().should('include', '/login');
    cy.get('button[type=submit]').should('be.disabled');
    cy.get('[formControlName=email]').type('invalid-address');
    cy.get('[formControlName=password]').type('Password123!');
    cy.get('[formControlName=email]').should('have.attr', 'aria-invalid', 'true');
    cy.get('button[type=submit]').should('be.disabled');
  });

  it('shows a login error without navigating away', () => {
    cy.intercept('POST', '/api/auth/login', {
      statusCode: 401,
      body: { message: 'Bad credentials' },
    }).as('badLogin');
    cy.visit('/login');
    cy.get('[formControlName=email]').type(account.email);
    cy.get('[formControlName=password]').type('wrong-password');
    cy.get('button[type=submit]').click();
    cy.wait('@badLogin');
    cy.contains('An error occurred').should('be.visible');
    cy.url().should('include', '/login');
  });

  it('registers a new account and validates all required fields', () => {
    cy.intercept('POST', '/api/auth/register', {
      message: 'User registered successfully!',
    }).as('register');
    cy.visit('/register');
    cy.get('button[type=submit]').should('be.disabled');
    cy.get('[formControlName=firstName]').type('Alice');
    cy.get('[formControlName=lastName]').type('Martin');
    cy.get('[formControlName=email]').type('new@example.com');
    cy.get('[formControlName=password]').focus().blur();
    cy.get('[formControlName=password]').should('have.class', 'ng-invalid');
    cy.get('mat-error').should('be.visible');
    cy.get('button[type=submit]').should('be.disabled');
    cy.get('[formControlName=password]').type('Password123!');
    cy.get('button[type=submit]').click();
    cy.wait('@register').its('request.body').should('deep.equal', {
      firstName: 'Alice',
      lastName: 'Martin',
      email: 'new@example.com',
      password: 'Password123!',
    });
    cy.url().should('include', '/login');
  });

  it('displays registration errors without navigating away', () => {
    cy.intercept('POST', '/api/auth/register', {
      statusCode: 400,
      body: { message: 'Email already taken' },
    }).as('registerError');
    cy.visit('/register');
    cy.get('[formControlName=firstName]').type('Alice');
    cy.get('[formControlName=lastName]').type('Martin');
    cy.get('[formControlName=email]').type(account.email);
    cy.get('[formControlName=password]').type('Password123!');
    cy.get('button[type=submit]').click();
    cy.wait('@registerError');
    cy.contains('An error occurred').should('be.visible');
    cy.url().should('include', '/register');
  });

  it('lists sessions for members and shows their details without admin actions', () => {
    login();
    cy.contains('Morning yoga').should('be.visible');
    cy.contains('button', 'Create').should('not.exist');
    cy.contains('button', 'Detail').click();
    cy.wait('@detail');
    cy.wait('@teacher');
    cy.contains(session.description).should('be.visible');
    cy.contains('MARTIN').should('be.visible');
    cy.contains('button', 'Delete').should('not.exist');
    cy.contains('button', 'Do not participate').should('be.visible');
  });

  it('lets a member participate and withdraw', () => {
    let participants: number[] = [];
    cy.intercept('GET', '/api/session/1', (req) => {
      req.reply({ ...session, users: participants });
    }).as('detail');
    cy.intercept('POST', '/api/session/1/participate/2', (req) => {
      participants = [2];
      req.reply({ statusCode: 200, body: {} });
    }).as('participate');
    cy.intercept('DELETE', '/api/session/1/participate/2', (req) => {
      participants = [];
      req.reply({ statusCode: 200, body: {} });
    }).as('withdraw');
    login();
    cy.contains('button', 'Detail').click();
    cy.wait('@detail');
    cy.contains('button', 'Participate').click();
    cy.wait('@participate');
    cy.wait('@detail');
    cy.contains('button', 'Do not participate').click();
    cy.wait('@withdraw');
    cy.wait('@detail');
    cy.contains('button', 'Participate').should('be.visible');
  });

  it('shows the account and logs out', () => {
    login();
    cy.contains('Account').click();
    cy.wait('@account');
    cy.contains(account.email).should('be.visible');
    cy.contains('Alice').should('be.visible');
    cy.contains('Logout').click();
    cy.contains('Login').should('be.visible');
    cy.contains('Register').should('be.visible');
  });

  it('deletes a member account and returns to the public home page', () => {
    cy.intercept('DELETE', '/api/user/2', { statusCode: 200, body: {} }).as('deleteAccount');
    login();
    cy.contains('Account').click();
    cy.wait('@account');
    cy.get('button[color=warn]').click();
    cy.wait('@deleteAccount');
    cy.contains('Login').should('be.visible');
  });

  it('shows admin session actions and deletes a session', () => {
    cy.intercept('DELETE', '/api/session/1', (req) => {
      sessions = [];
      req.reply({ statusCode: 200, body: {} });
    }).as('deleteSession');
    login(true);
    cy.contains('button', 'Create').should('be.visible');
    cy.contains('button', 'Edit').should('be.visible');
    cy.contains('button', 'Detail').click();
    cy.wait('@detail');
    cy.contains('button', 'Delete').click();
    cy.wait('@deleteSession');
    cy.url().should('match', /\/sessions$/);
    cy.wait('@sessions');
    cy.contains(session.name).should('not.exist');
  });

  function fillSession(name: string) {
    cy.get('[formControlName=name]').clear().type(name);
    cy.get('[formControlName=date]').clear().type('2026-11-15');
    cy.get('mat-select[formControlName=teacher_id]').click();
    cy.contains('mat-option', 'Margot').click();
    cy.get('[formControlName=description]').clear().type(session.description);
  }

  it('creates a session only when all required fields are supplied', () => {
    cy.intercept('POST', '/api/session', (req) => {
      const created = { ...session, id: 3, name: 'New yoga session' };
      sessions.push(created);
      req.reply(created);
    }).as('create');
    login(true);
    cy.contains('button', 'Create').click();
    cy.wait('@teachers');
    cy.get('button[type=submit]').should('be.disabled');
    cy.get('[formControlName=name]').focus().blur().should('have.class', 'ng-invalid');
    cy.get('mat-error').should('be.visible');
    fillSession('New yoga session');
    cy.get('button[type=submit]').click();
    cy.wait('@create').its('request.body').should('include', {
      name: 'New yoga session',
      description: session.description,
      teacher_id: 1,
    });
    cy.url().should('match', /\/sessions$/);
    cy.wait('@sessions');
    cy.contains('New yoga session').should('be.visible');
  });

  it('edits a session and prevents saving an empty required field', () => {
    cy.intercept('PUT', '/api/session/1', (req) => {
      const updated = { ...session, name: 'Updated yoga session' };
      sessions = [updated];
      req.reply(updated);
    }).as('update');
    login(true);
    cy.contains('button', 'Edit').click();
    cy.wait('@detail');
    cy.wait('@teachers');
    cy.get('[formControlName=name]').should('have.value', session.name).clear().blur();
    cy.get('[formControlName=name]').should('have.class', 'ng-invalid');
    cy.get('mat-error').should('be.visible');
    cy.get('button[type=submit]').should('be.disabled');
    fillSession('Updated yoga session');
    cy.get('button[type=submit]').click();
    cy.wait('@update').its('request.body').should('include', { name: 'Updated yoga session' });
    cy.url().should('match', /\/sessions$/);
    cy.wait('@sessions');
    cy.contains('Updated yoga session').should('be.visible');
    cy.contains(session.name).should('not.exist');
  });

  it('shows admin account information and the not-found page', () => {
    cy.intercept('GET', '/api/user/2', { ...account, admin: true }).as('account');
    login(true);
    cy.contains('Account').click();
    cy.wait('@account');
    cy.contains('You are admin').should('be.visible');
    cy.get('button[color=warn]').should('not.exist');
    cy.visit('/does-not-exist');
    cy.contains('Page not found').should('be.visible');
  });
});
