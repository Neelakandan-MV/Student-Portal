import express, { Request, Response, NextFunction } from 'express';
import session from 'express-session';
import nocache from 'nocache';
import mongoose from 'mongoose';
import User from './model/usermodel';

import path from 'path';

const app = express();

// Connecting to MongoDB
mongoose.connect('mongodb://127.0.0.1:27017/StudentDB')
  .then(() => {
    console.log('MongoDB is connected');
  })
  .catch(() => {
    console.log('MongoDB is not connected');
  });

// Setting up EJS
app.set('view engine', 'ejs');

// Static files path
app.use("/static", express.static(path.join(__dirname, 'public')));
app.use("/assets", express.static(path.join(__dirname, 'public', 'assets')));

// URL encoding
app.use(express.urlencoded({ extended: true }));

// Session setup
app.use(
  session({
    secret: "secret key",
    resave: false,
    saveUninitialized: true,
  })
);

// Disable caching for session handling
app.use(nocache());

// Extending session type in Express
declare module 'express-session' {
  interface SessionData {
    admin?: string;
    user?: string;
  }
}

// Admin credentials
const credentials = {
  email: 'admin@gmail.com',
  password: 123
};

// Rendering admin login page
app.get('/adminLogin', (req: Request, res: Response) => {
  if (!req.session.admin) {
    res.render('adminLogin', { title: 'Admin Login' });
  } else {
    res.redirect('/adminHome');
  }
});

// Admin validation
app.post('/adminHome', (req: Request, res: Response) => {
  const { email, password } = req.body;

  if (credentials.email === email && credentials.password == password) {
    req.session.admin = email;
    res.redirect('/adminHome');
  } else if (credentials.email !== email) {
    res.render('adminLogin', {
      title: 'Admin Login',
      adminAlert: 'Invalid Email',
    });
  } else if (credentials.password !== password) {
    res.render('adminLogin', {
      title: 'Admin Login',
      adminAlert: 'Invalid Password',
    });
  } else {
    res.render('adminLogin', {
      title: 'Admin Login',
      adminAlert: 'Entered Email or Password is incorrect',
    });
  }
});

// Admin home rendering
app.get('/adminHome', async (req: Request, res: Response) => {
  if (req.session.admin) {
    try {
      const users = await User.find();
      res.render('adminHome', { title: 'Admin Homepage', user: users });
    } catch (error) {
      console.log(error);
      res.status(500).send('Internal Server Error');
    }
  } else {
    res.redirect('/adminLogin');
  }
});

// Add user page rendering
app.get('/add', (req: Request, res: Response) => {
  if (req.session.admin) {
    res.render('adduser', { title: 'Add User' });
  } else {
    res.redirect('/adminLogin');
  }
});

// Adding a user
app.post('/add', async (req: Request, res: Response) => {
  try {
    const existingUser = await User.findOne({ email: req.body.email });
    const existingUsername = await User.findOne({ username: req.body.username });

    if (existingUser) {
      return res.render("adduser", { alert: 'Email Already Exist, Try with Another' });
    } else if (existingUsername) {
      return res.render("adduser", { alert: 'Username Already Exist, Try with Another' });
    } else {
      const newUser = new User({
        username: req.body.username,
        email: req.body.email,
        phone: req.body.phone,
        password: req.body.password
      });
      await newUser.save();
      res.redirect('/adminHome');
    }
  } catch (error) {
    console.log(error);
    res.status(500).send('Internal Server Error');
  }
});

// Edit user page
app.get('/edit/:id', async (req: Request, res: Response) => {
  if (req.session.admin) {
    try {
      const id = req.params.id;
      const user = await User.findById(id);
      if (!user) {
        res.redirect('/adminHome');
      } else {
        res.render('edituser', { title: 'Edit User', user });
      }
    } catch (error) {
      console.log(error);
      res.status(500).send('Internal Server Error');
    }
  } else {
    res.redirect('/adminLogin');
  }
});

// Update user
app.post('/update/user/:id', async (req: Request, res: Response) => {
  if (req.session.admin) {
    try {
      const id = req.params.id;
      await User.findByIdAndUpdate(id, {
        username: req.body.username,
        email: req.body.email,
        phone: req.body.phone,
      });
      res.redirect('/adminHome');
    } catch (error) {
      console.log(error);
      res.status(500).send('Internal Server Error');
    }
  } else {
    res.redirect('/adminLogin');
  }
});

// Delete user
app.get('/delete/:id', async (req: Request, res: Response) => {
  if (req.session.admin) {
    try {
      const id = req.params.id;
      await User.findByIdAndDelete(id);
      res.redirect('/adminHome');
    } catch (error) {
      console.log(error);
      res.status(500).send('Internal Server Error');
    }
  } else {
    res.redirect('/adminLogin');
  }
});

// Admin logout
app.get('/adminLogout', (req: Request, res: Response) => {
  if (req.session.admin) {
    req.session.admin = undefined;
    res.render('adminLogin', { adminAlert: 'Logout successfully' });
  }
});

// Rendering user login
app.get('/', (req: Request, res: Response) => {
  if (!req.session.user) {
    res.render('userLogin', { title: 'User Login' });
  } else {
    res.redirect('/home');
  }
});

// User validation
app.post('/homepage', async (req: Request, res: Response) => {
  const data = await User.findOne({ email: req.body.email });

  if (data) {
    if (req.body.email !== data.email && req.body.password !== data.password) {
      res.render('userLogin', { alert: 'Email and Password are incorrect' });
    } else if (req.body.email !== data.email) {
      res.render('userLogin', { alert: 'Email is incorrect' });
    } else if (req.body.password !== data.password) {
      res.render('userLogin', { alert: 'Password is incorrect' });
    } else {
      req.session.user = req.body.email;
      res.redirect('/home');
    }
  } else {
    res.render('signup', { signup: 'Account Doesn\'t Exist, Please signup' });
  }
});

// User home
app.get('/home', (req: Request, res: Response) => {
  if (!req.session.user) {
    res.redirect('/');
  } else {
    res.render('userHomepage', { user: req.body.email });
  }
});

// Signup page
app.get('/signup', (req: Request, res: Response) => {
  res.render('signup', { title: 'SignUp' });
});

// Signup
app.post('/signup', async (req: Request, res: Response) => {
  try {
    const data = await User.findOne({ email: req.body.email });
    const username = await User.findOne({ username: req.body.username });

    if (data) {
      res.render('signup', { signupAlert: 'This email is already in use', title: 'Sign up' });
    } else if (username) {
      res.render('signup', { signupAlert: 'This username already exists.' });
    } else {
      const newUser = new User({
        username: req.body.username,
        email: req.body.email,
        password: req.body.password,
        phone: req.body.phone,
      });
      await newUser.save();
      res.redirect('/');
    }
  } catch (error) {
    console.log(error);
    res.status(500).send('Internal Server Error');
  }
});

// User logout
app.get('/userLogout', (req: Request, res: Response) => {
  if (req.session.user) {
    req.session.user = undefined;
    res.render('userLogin', { alert: 'Logout Successfully' });
  } else {
    res.redirect('/');
  }
});

// Server setup
app.listen(3001, () => {
  console.log('server running on http://localhost:3001');
});
