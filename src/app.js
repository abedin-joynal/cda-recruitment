// Load environment variables
require('dotenv').config();

// process.env.TZ = "Europe/Amsterdam";
process.env.TZ = process.env.TZ || 'Asia/Dhaka';
const express = require('express');
const cors = require('cors')
// const morgan = require('morgan');
const path = require('path');
const exphbs = require('express-handlebars');
// const session = require('express-session');

const validator = require('express-validator');
const passport = require('passport');
const flash = require('connect-flash');

const expressValidator = require('express-validator');
// Using Express built-in body parser (compatible with Node 10)
// const bodyParser = require('body-parser'); // Removed - using Express built-in instead
const cookieParser = require('cookie-parser');
const session = require('express-session');
const MySQLStore = require('express-mysql-session')(session);
const _ = require("underscore");
const { database } = require('./keys');
const cron_jobs = require('./lib/cron_jobs');

const events = require('events');
global.universalEmitter = new events();

// Intializations
const app = express();

// Trust proxy - needed for HTTPS behind reverse proxy or to detect HTTPS correctly
app.set('trust proxy', 1);

require('./lib/passport');

// Settings
app.set('port', process.env.PORT || 4000);
app.set('views', path.join(__dirname, 'views'));
app.engine('.hbs', exphbs({
  defaultLayout: 'main',
  layoutsDir: path.join(app.get('views'), 'layouts'),
  partialsDir: path.join(app.get('views'), 'partials'),
  extname: '.hbs',
  helpers: require('./lib/handlebars')
}));

app.set('view engine', '.hbs');
// Middlewares
// app.use(morgan('dev'));
// Using Express built-in body parser (compatible with Node 10)
app.use(express.urlencoded({ limit: "50mb", extended: true, parameterLimit: 50000 }));
app.use(express.json({ limit: "50mb" }));

app.use(expressValidator());
app.use(cookieParser());

// Session configuration with error handling
let sessionStore;
try {
  sessionStore = new MySQLStore(database);
  sessionStore.on('error', (error) => {
    console.error('Session store error:', error);
  });
} catch (error) {
  console.error('Error creating session store:', error);
  sessionStore = undefined;
}

app.use(session({
  secret: process.env.SESSION_SECRET || 'faztmysqlnodemysql',
  resave: false,
  saveUninitialized: false,
  store: sessionStore,
  cookie: {
    secure: false, // Set to false to allow both HTTP and HTTPS (needed for mixed environments)
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000, // 24 hours
    sameSite: 'lax' // Helps with cross-site requests and mobile browsers
  }
}));

app.use(flash());
app.use(passport.initialize());
app.use(passport.session());
app.use(validator());

// Global variables
app.use((req, res, next) => {
  try {
    app.locals.message = req.flash('message');
    app.locals.success = req.flash('success');
    app.locals.loggedinuser = req.user;
    next();
  } catch (error) {
    console.error('Error in global variables middleware:', error);
    next(error);
  }
});

// CORS headers
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  
  // Ensure protocol is detected correctly for HTTPS
  if (req.secure || req.headers['x-forwarded-proto'] === 'https') {
    req.protocol = 'https';
  }
  
  return next();
});

// Routes
// app.use(require('./routes/index'));
app.use(require('./routes/authentication'));
app.use('/dash', require('./routes/dashboard'));
app.use('/users', require('./routes/users'));
app.use('/roles', require('./routes/roles'));
app.use('/permissions', require('./routes/permissions'));
app.use('/applicants', require('./routes/applicants'));
app.use('/', require('./routes/operators'));
app.use('/posts', require('./routes/posts'));
app.use('/reports', require('./routes/reports'));

// app.use('/votes', require('./routes/votes'));
// app.use('/candidates', require('./routes/candidates'));

// Public
app.use(express.static(path.join(__dirname, 'public')));
app.use(cors());

// Test route to verify HTTPS is working
app.get('/test-https', (req, res) => {
  res.json({ 
    message: 'HTTPS is working!', 
    protocol: req.protocol,
    secure: req.secure,
    timestamp: new Date().toISOString()
  });
});

// 404 handler
app.use(function(req,res){
  res.status(404).render('layouts/404');
});

// Global error handler middleware - MUST be after all routes
app.use((err, req, res, next) => {
  console.error('Express Error:', err);
  console.error('Error Stack:', err.stack);
  if (!res.headersSent) {
    res.status(500).json({ error: 'Internal Server Error', message: err.message });
  }
});

var http = require('http');
var https = require('https');
var fs = require('fs');

// Start HTTP server - bind to all interfaces (0.0.0.0) to allow network access
http.createServer(app).listen(app.get('port'), '0.0.0.0', () => {
  console.log('HTTP Server is running on port', app.get('port'));
  console.log('Access via: http://localhost:' + app.get('port') + ' or http://YOUR_IP:' + app.get('port'));
});

// Start HTTPS server if certificates exist
const certPath = process.env.SSL_CERT_PATH || 'src/certificates/server_cert.pem';
const keyPath = process.env.SSL_KEY_PATH || 'src/certificates/server_key.pem';
const httpsPort = process.env.HTTPS_PORT || 4001;

if (fs.existsSync(certPath) && fs.existsSync(keyPath)) {
  try {
    var httpsOptions = {
      cert: fs.readFileSync(certPath),
      key: fs.readFileSync(keyPath)
    };
    
    // Create HTTPS server
    const httpsServer = https.createServer(httpsOptions, app);
    
    // Add error handlers BEFORE listening
    httpsServer.on('error', (error) => {
      console.error('HTTPS Server error:', error.message);
      if (error.code === 'EADDRINUSE') {
        console.error('Port', httpsPort, 'is already in use. Please choose a different port.');
      } else {
        console.error('Error code:', error.code);
        console.error('Error details:', error);
      }
    });
    
    // Add client error handler - handle gracefully
    httpsServer.on('clientError', (err, socket) => {
      // Only log and close for actual SSL/TLS errors, not protocol mismatches
      if (err.code === 'ECONNRESET' || err.code === 'EPIPE') {
        // Client disconnected - not a real error
        return;
      }
      if (err.message && err.message.includes('http request')) {
        // HTTP request sent to HTTPS port - redirect or inform client
        console.warn('HTTP request sent to HTTPS port - client should use https://');
        if (!socket.destroyed) {
          socket.write('HTTP/1.1 400 Bad Request\r\n');
          socket.write('Content-Type: text/plain\r\n');
          socket.write('\r\n');
          socket.write('Please use HTTPS (https://) instead of HTTP (http://)\r\n');
          socket.end();
        }
        return;
      }
      // For other errors, log but don't crash
      console.error('HTTPS Client error:', err.message);
      if (!socket.destroyed && !socket.writableEnded) {
        socket.end();
      }
    });
    
    // Bind to all interfaces (0.0.0.0) to allow network access
    try {
      httpsServer.listen(httpsPort, '0.0.0.0', () => {
        console.log('✓ HTTPS Server is running on port', httpsPort);
        console.log('  Access via: https://localhost:' + httpsPort + ' or https://YOUR_IP:' + httpsPort);
        console.log('  Test endpoint: https://localhost:' + httpsPort + '/test-https');
      });
    } catch (listenError) {
      console.error('✗ Error binding HTTPS server to port', httpsPort, ':', listenError.message);
    }
    
  } catch (error) {
    console.error('✗ Error starting HTTPS server:', error.message);
    console.error('Stack:', error.stack);
    console.log('HTTPS server will not be started. Only HTTP server is running.');
  }
} else {
  console.log('SSL certificates not found. HTTPS server will not be started.');
  console.log('Looking for:', certPath, 'and', keyPath);
  if (!fs.existsSync(certPath)) {
    console.log('  - Certificate file NOT FOUND:', certPath);
  }
  if (!fs.existsSync(keyPath)) {
    console.log('  - Key file NOT FOUND:', keyPath);
  }
  console.log('Only HTTP server is running on port', app.get('port'));
}

// Handle uncaught exceptions to prevent server crash
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

// Initialize cron jobs
cron_jobs.checkAndCleanupAfterDate();

// Starting
// app.listen(app.get('port'), () => {
//   console.log('Server is in port', app.get('port'));
// });

