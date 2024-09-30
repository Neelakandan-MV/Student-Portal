"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const express_session_1 = __importDefault(require("express-session"));
const nocache_1 = __importDefault(require("nocache"));
const mongoose_1 = __importDefault(require("mongoose"));
const usermodel_1 = __importDefault(require("./model/usermodel"));
const path_1 = __importDefault(require("path"));
const app = (0, express_1.default)();
// Connecting to MongoDB
mongoose_1.default.connect('mongodb://127.0.0.1:27017/USERS')
    .then(() => {
    console.log('MongoDB is connected');
})
    .catch(() => {
    console.log('MongoDB is not connected');
});
// Setting up EJS
app.set('view engine', 'ejs');
// Static files path
app.use("/static", express_1.default.static(path_1.default.join(__dirname, 'public')));
app.use("/assets", express_1.default.static(path_1.default.join(__dirname, 'public', 'assets')));
// URL encoding
app.use(express_1.default.urlencoded({ extended: true }));
// Session setup
app.use((0, express_session_1.default)({
    secret: "secret key",
    resave: false,
    saveUninitialized: true,
}));
// Disable caching for session handling
app.use((0, nocache_1.default)());
// Admin credentials
const credentials = {
    email: 'admin@gmail.com',
    password: 123
};
// Rendering admin login page
app.get('/adminLogin', (req, res) => {
    if (!req.session.admin) {
        res.render('adminLogin', { title: 'Admin Login' });
    }
    else {
        res.redirect('/adminHome');
    }
});
// Admin validation
app.post('/adminHome', (req, res) => {
    const { email, password } = req.body;
    if (credentials.email === email && credentials.password == password) {
        req.session.admin = email;
        res.redirect('/adminHome');
    }
    else if (credentials.email !== email) {
        res.render('adminLogin', {
            title: 'Admin Login',
            adminAlert: 'Invalid Email',
        });
    }
    else if (credentials.password !== password) {
        res.render('adminLogin', {
            title: 'Admin Login',
            adminAlert: 'Invalid Password',
        });
    }
    else {
        res.render('adminLogin', {
            title: 'Admin Login',
            adminAlert: 'Entered Email or Password is incorrect',
        });
    }
});
// Admin home rendering
app.get('/adminHome', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    if (req.session.admin) {
        try {
            const users = yield usermodel_1.default.find();
            res.render('adminHome', { title: 'Admin Homepage', user: users });
        }
        catch (error) {
            console.log(error);
            res.status(500).send('Internal Server Error');
        }
    }
    else {
        res.redirect('/adminLogin');
    }
}));
// Add user page rendering
app.get('/add', (req, res) => {
    if (req.session.admin) {
        res.render('adduser', { title: 'Add User' });
    }
    else {
        res.redirect('/adminLogin');
    }
});
// Adding a user
app.post('/add', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const existingUser = yield usermodel_1.default.findOne({ email: req.body.email });
        const existingUsername = yield usermodel_1.default.findOne({ username: req.body.username });
        if (existingUser) {
            return res.render("adduser", { alert: 'Email Already Exist, Try with Another' });
        }
        else if (existingUsername) {
            return res.render("adduser", { alert: 'Username Already Exist, Try with Another' });
        }
        else {
            const newUser = new usermodel_1.default({
                username: req.body.username,
                email: req.body.email,
                phone: req.body.phone,
                password: req.body.password
            });
            yield newUser.save();
            res.redirect('/adminHome');
        }
    }
    catch (error) {
        console.log(error);
        res.status(500).send('Internal Server Error');
    }
}));
// Edit user page
app.get('/edit/:id', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    if (req.session.admin) {
        try {
            const id = req.params.id;
            const user = yield usermodel_1.default.findById(id);
            if (!user) {
                res.redirect('/adminHome');
            }
            else {
                res.render('edituser', { title: 'Edit User', user });
            }
        }
        catch (error) {
            console.log(error);
            res.status(500).send('Internal Server Error');
        }
    }
    else {
        res.redirect('/adminLogin');
    }
}));
// Update user
app.post('/update/user/:id', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    if (req.session.admin) {
        try {
            const id = req.params.id;
            yield usermodel_1.default.findByIdAndUpdate(id, {
                username: req.body.username,
                email: req.body.email,
                phone: req.body.phone,
            });
            res.redirect('/adminHome');
        }
        catch (error) {
            console.log(error);
            res.status(500).send('Internal Server Error');
        }
    }
    else {
        res.redirect('/adminLogin');
    }
}));
// Delete user
app.get('/delete/:id', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    if (req.session.admin) {
        try {
            const id = req.params.id;
            yield usermodel_1.default.findByIdAndDelete(id);
            res.redirect('/adminHome');
        }
        catch (error) {
            console.log(error);
            res.status(500).send('Internal Server Error');
        }
    }
    else {
        res.redirect('/adminLogin');
    }
}));
// Admin logout
app.get('/adminLogout', (req, res) => {
    if (req.session.admin) {
        req.session.admin = undefined;
        res.render('adminLogin', { adminAlert: 'Logout successfully' });
    }
});
// Rendering user login
app.get('/', (req, res) => {
    if (!req.session.user) {
        res.render('userLogin', { title: 'User Login' });
    }
    else {
        res.redirect('/home');
    }
});
// User validation
app.post('/homepage', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const data = yield usermodel_1.default.findOne({ email: req.body.email });
    if (data) {
        if (req.body.email !== data.email && req.body.password !== data.password) {
            res.render('userLogin', { alert: 'Email and Password are incorrect' });
        }
        else if (req.body.email !== data.email) {
            res.render('userLogin', { alert: 'Email is incorrect' });
        }
        else if (req.body.password !== data.password) {
            res.render('userLogin', { alert: 'Password is incorrect' });
        }
        else {
            req.session.user = req.body.email;
            res.redirect('/home');
        }
    }
    else {
        res.render('signup', { signup: 'Account Doesn\'t Exist, Please signup' });
    }
}));
// User home
app.get('/home', (req, res) => {
    if (!req.session.user) {
        res.redirect('/');
    }
    else {
        res.render('userHomepage', { user: req.body.email });
    }
});
// Signup page
app.get('/signup', (req, res) => {
    res.render('signup', { title: 'SignUp' });
});
// Signup
app.post('/signup', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const data = yield usermodel_1.default.findOne({ email: req.body.email });
        const username = yield usermodel_1.default.findOne({ username: req.body.username });
        if (data) {
            res.render('signup', { signupAlert: 'This email is already in use', title: 'Sign up' });
        }
        else if (username) {
            res.render('signup', { signupAlert: 'This username already exists.' });
        }
        else {
            const newUser = new usermodel_1.default({
                username: req.body.username,
                email: req.body.email,
                password: req.body.password,
                phone: req.body.phone,
            });
            yield newUser.save();
            res.redirect('/');
        }
    }
    catch (error) {
        console.log(error);
        res.status(500).send('Internal Server Error');
    }
}));
// User logout
app.get('/userLogout', (req, res) => {
    if (req.session.user) {
        req.session.user = undefined;
        res.render('userLogin', { alert: 'Logout Successfully' });
    }
    else {
        res.redirect('/');
    }
});
// Server setup
app.listen(3001, () => {
    console.log('server running on http://localhost:3001');
});
