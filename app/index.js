const winston = require('winston');
const config = require('config');
require('winston-daily-rotate-file');

const logLevel = config.get("Service.log.level");
const logFile = config.get("Service.log.file");
const logConsole = config.get("Service.log.console");

const logger = new winston.Logger();
logger.handleExceptions(new winston.transports.File({ filename: logFile, json: false }));
if (logConsole)
    logger.add(winston.transports.Console, { level: logLevel });
logger.add(winston.transports.DailyRotateFile, { filename: logFile, maxFiles: '10d', maxSize: '20m' });

const io = require('socket.io')(config.get("Service.port"), { allowEIO3: true });

io.on('connection', function (socket) {
    logger.info('Received new socket.io connection: ', socket.id);

    socket.on('event', function (msg, callback) {
	if (callback)
	    callback('acknowledgement');
        logger.verbose('Received msg ', msg, ' from ', socket.id);
        socket.emit('event', 'Echo: ' + msg);
    });

    socket.on('disconnect', function () {
        logger.info('Disconnected: ', socket.id);
    });
});

const engine = require('engine.io');
const server = engine.listen(Number(config.get("Service.port")) + 1);

server.on('connection', function (socket) {
    logger.info('Received new engine.io connection: ', socket.id);
    socket.on('message', function (msg) {
        logger.verbose('Received msg ', msg, ' from ', socket.id);
        socket.send('Echo: ' + msg);
    });

    socket.on('close', function () {
        logger.info('Disconnected: ', socket.id);
    });
});
