process.env.TZ = "America/Los_Angeles";
const express = require('express');
const app = express();
let bodyParser = require('body-parser');
let urlencodedParser = bodyParser.urlencoded({ extended: false })
let cookieParser = require('cookie-parser');
let session = require('express-session');
let md5 = require('md5');
const path = require('path');
let multer = require("multer");
let fs = require("fs");
let upload = multer({ dest: path.join(__dirname, "/public/upload") });
let dbconnection = require('./mysqlConnector');


async function getEventsInfo(params) {
    let status = { status: "success", message: "no data found" };
    var sql = "SELECT * from events";
    if (params.myevents && params.myevents == true) {
        sql += " where user_id = " + params.createdby;
    } else {
        sql += " where from_date > CURRENT_TIMESTAMP() and is_active = 1 and user_id != " + params.createdby;
        // sql += " where from_date > CURRENT_TIMESTAMP() and is_active = 1";
    }
    if (params.zipcode) {
        sql += " and zipcode = '" + params.zipcode + "'"
    }
    sql += " order by from_date asc";
    // console.log(sql);
    let result = await dbconnection.promise().query(sql);
    if (result) {
        let data = Object.values(JSON.parse(JSON.stringify(result)));
        if (data.length > 0) {
            status = { status: "success", message: "data found", data: data[0] };
        }
    }
    return status;
}

app.set('view engine', 'ejs');

app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    next();
});

app.use(express.static(__dirname + '/public'));
app.use(cookieParser());
app.use(session({
    secret: "fitnessfinder.app",
    resave: false,
    saveUninitialized: false
}));

app.get('/dbtest', function (req, res) {
    dbconnection.query("SELECT * FROM testing;", (err, result) => {
        if (err) {
            res.send({ status: "failure", message: err, data: {} });
        } else {
            res.send({ status: "success", message: err, data: result });
        }
    });
});

// load home page
app.get('/', function (req, res) {
    if (req.session.loggedIn) {
        res.render(path.join(__dirname, './public/index.ejs'), { loggedIn: true });
    } else {
        res.render(path.join(__dirname, './public/index.ejs'), { loggedIn: false });
    }
});

// load registration page
app.get('/registration', function (req, res) {
    res.sendFile(path.join(__dirname, './public/html/registration.html'));
});

// load forgot password page
app.get('/forgotPassword', function (req, res) {
    // res.sendFile(path.join(__dirname, './public/html/forgotPassword.html'));
    res.redirect('/underconstruction');
});

// load support page
app.get('/support', function (req, res) {
    res.sendFile(path.join(__dirname, './public/html/support.html'));
});

// load tnc page
app.get('/tnc', function (req, res) {
    res.sendFile(path.join(__dirname, './public/html/tnc.html'));
});

//load under construction page
app.get('/underconstruction', function (req, res) {
    res.sendFile(path.join(__dirname, './public/html/underConstruction.html'));
});

// Save contact us info - home page
app.post('/saveContactUs', urlencodedParser, function (req, res) {
    let data = {
        name: req.body.name,
        email: req.body.email,
        query: req.body.query,
    };
    let sql = "INSERT INTO `contact_us`(name, email, query) VALUES ('" + data.name + "','" + data.email + "', '" + data.query + "')";
    dbconnection.query(sql, (err, result) => {
        if (err) {
            res.send({ status: "failure", message: err, data: {} });
        } else {
            res.send({ status: "success", message: err, data: {} });
        }
    });
});

//Register a user
app.post('/registerUser', urlencodedParser, function (req, res) {
    let is_registered = 1, reg_id = 0;
    let guest = {
        email_id: req.body.email_id,
        is_registered: is_registered
    }
    let checkisuserexists = "SELECT * from `guest_user` where email_id = '" + guest.email_id + "'";
    dbconnection.query(checkisuserexists, (err, res1) => {
        if (err) {
            res.send({ status: "failure", message: err, data: {} });
        } else {
            if (res1.length > 0) {
                res.send({ status: "failure", message: "User already exists", data: {} });
            } else {
                let sql = "INSERT INTO `guest_user`(email_id, is_registered) VALUES ('" + guest.email_id + "'," + is_registered + ")";
                dbconnection.query(sql, (err, result) => {
                    if (err) {
                        res.send({ status: "failure", message: err, data: {} });
                    } else {
                        let inserted_id = result.insertId;
                        // console.log(inserted_id);
                        if (is_registered == 1) {
                            registeredUser = {
                                user_id: inserted_id,
                                name: req.body.name,
                                gender: req.body.gender,
                                phone: req.body.phone,
                                address: req.body.address,
                                zip_code: req.body.zip_code,
                                birthdate: req.body.birthdate,
                                activity_type: req.body.activity_type
                            };
                            let sql1 = "INSERT INTO `registered_user`(user_id, gender, name, birthdate, phone, address, zip_code, activity_type) VALUES (" + registeredUser.user_id + ",'" + registeredUser.gender + "','" + registeredUser.name + "','" + registeredUser.birthdate + "','" + registeredUser.phone + "','" + registeredUser.address + "','" + registeredUser.zip_code + "','" + registeredUser.activity_type + "')";
                            dbconnection.query(sql1, (err1, result1) => {
                                if (err1) {
                                    res.send({ status: "failure", message: err1, data: {} });
                                } else {
                                    reg_id = result1.insertId;

                                    const myArr = registeredUser.activity_type.split(",");
                                    let actquerry = "INSERT INTO `user_activities`(user_id, user_activities) VALUES ";
                                    for (let idx in myArr) {
                                        if (idx == (myArr.length - 1)) {
                                            actquerry += "(" + registeredUser.user_id + ",'" + myArr[idx] + "')";
                                        } else {
                                            actquerry += "(" + registeredUser.user_id + ",'" + myArr[idx] + "'),";
                                        }
                                    }
                                    dbconnection.query(actquerry, (err, result) => {
                                        account = {
                                            reg_id: reg_id,
                                            username: req.body.email_id,
                                            password: md5(req.body.password)
                                        }
                                        let sql2 = "INSERT INTO `account`(reg_id, username, password) VALUES (" + account.reg_id + ",'" + account.username + "','" + account.password + "');";
                                        dbconnection.query(sql2, (err2, result2) => {
                                            dbconnection.query("INSERT INTO `check_new_message` (user_id) VALUES (" + registeredUser.user_id + ");", (err3, result3) => {
                                                if (err3) {
                                                    res.send({ status: "failure", message: err2, data: {} });
                                                } else {
                                                    fs.readFile('public/assets/images/user_picture/user.jpeg', function (err, data) {
                                                        if (err) throw err;
                                                        fs.writeFile('public/assets/images/user_picture/' + registeredUser.user_id + '.jpeg', data, function (err) {
                                                            if (err) throw err;
                                                        });
                                                    });
                                                    res.send({ status: "success", message: "User Registered", data: {} });
                                                }
                                            });
                                        });
                                    });
                                }
                            });
                        }
                    }
                });
            }
        }
    });
});

//Login to the app
app.post('/loginAPI', urlencodedParser, function (req, res) {
    //get username and password
    let email = req.body.email;
    let password = md5(req.body.password);
    function checkuserExists() {
        let checkisuserexists = "SELECT `registered_user`.reg_id, `registered_user`.user_id, password, phone, address, activity_type, zip_code, gender, name, birthdate, is_active from `account` join `registered_user` on `registered_user`.reg_id = `account`.reg_id where username = '" + email + "'";
        return new Promise(resolve => {
            dbconnection.query(checkisuserexists, (err, res1) => {
                if (err) {
                    res.send({ status: "failure", message: err, data: {} });
                } else {
                    resolve(res1);
                }
            });
        });
    }
    checkuserExists().then(res1 => {
        return new Promise(resolve => {
            if (res1.length == 0) {
                res.send({ status: "failure", message: "User does not exists", data: {} });
            } else if (res1.length == 1) {
                if (res1[0].is_active == 0) {
                    res.send({ status: "failure", message: "User Deactivated. Contact admin to activate account!", data: {} });
                } else if (res1[0].password == password) {
                    resolve(res1);
                } else {
                    res.send({ status: "failure", message: "Incorrect Password", data: {} });
                }
            } else {
                res.send({ status: "failure", message: "Multiple entries found. Please contact site administrator", data: {} });
            }
        });
    }).then(data => {
        return new Promise(resolve => {
            if (data.length > 0) {
                req.session.loggedIn = true;
                req.session.data = data[0];
                req.session.save(function (err) {
                    if (err) {
                        resolve("failure");
                    } else {
                        resolve("success");
                    }
                });
            } else {
                resolve("failure");
            }
        });
    }).then(status => {
        if (status == "success") {
            // console.log("logged in:");
            // console.log(req.session);
            res.send({ status: "success", message: "Log in successful", data: {} });
        } else {
            res.send({ status: "failure", message: "No user data found", data: {} });
        }
    });
});

// load myprofile page
app.get('/myProfile', function (req, res) {
    // console.log(req.session);
    if (req.session.loggedIn) {
        let data = req.session.data;
        const birth = data.birthdate.split("T")[0];
        data['age'] = new Date().getFullYear() - new Date(birth).getFullYear();
        res.render(path.join(__dirname, './public/html/myProfile.ejs'), data);
    } else {
        res.redirect('/');
    }
});

//change password
app.post('/changePassword', urlencodedParser, function (req, res) {
    if (req.session.loggedIn) {
        const regID = req.session.data.reg_id;
        const password = req.body.password;
        const userinfo = "SELECT * from `registered_user` where reg_id = " + regID;
        dbconnection.query(userinfo, (err, data) => {
            // console.log(err);
            if (err || !(data[0] && data[0].reg_id)) {
                res.send({ status: "failure", message: "Unable to find user", data: {} });
            } else {
                const updateSQL = 'UPDATE `account` SET password = "' + md5(password) + '" WHERE reg_id = ' + regID;
                dbconnection.query(updateSQL, (err, result) => {
                    if (err) {
                        res.send({ status: "failure", message: 'Failed to change password', data: {} });
                    } else {
                        res.send({ status: "success", message: 'Password updated', data: {} });
                    }
                });
            }
        });
    } else {
        res.send({ status: "failure", message: 'Please log in ', data: {} });
    }
})

//edit user info 
app.post("/modifyUserInfo", upload.single("picture"), function (req, res) {
    if (req.session.loggedIn) {
        const updateDB = (regID) => {
            const { phone, address, zip_code, birthdate } = req.body;
            const userinfo = "SELECT * from `registered_user` where reg_id = " + regID;
            dbconnection.query(userinfo, (err, data) => {
                if (err || !(data[0] && data[0].reg_id)) {
                    res.send({
                        status: "failure",
                        message: "Unable to find user",
                        data: {},
                    });
                } else {
                    const updateSQL = 'UPDATE `registered_user` SET phone = "' + phone + '", address = "' + address + '", zip_code = "' + zip_code + '", birthdate = "' + birthdate + '" WHERE reg_id = ' + regID;
                    dbconnection.query(updateSQL, (err, result) => {
                        if (err) {
                            res.send({
                                status: "failure",
                                message: "Failed to update profile",
                                data: err,
                            });
                        } else {
                            req.session.data.phone = phone;
                            req.session.data.address = address;
                            req.session.data.zip_code = zip_code;
                            req.session.data.birthdate = birthdate;
                            res.send({ status: "success", message: "success", data: {} });
                        }
                    });
                }
            });
        };

        const regID = req.session.data.reg_id, userID = req.session.data.user_id;
        if (req.file) {
            const source_file = req.file.path;
            const dest_dir = path.join(__dirname, "/public/assets/images/user_picture");
            const dest_file = path.join(
                __dirname,
                "/public/assets/images/user_picture",
                userID + ".jpeg"
            );
            fs.exists(dest_dir, function (exists) {
                if (exists) {
                    fs.rename(source_file, dest_file, function (err) {
                        if (err) {
                            res.send({
                                status: "failure",
                                message: "fail to update profile",
                                data: err,
                            });
                        } else {
                            updateDB(regID);
                        }
                    });
                } else {
                    fs.mkdir(dest_dir, 0777, function (err) {
                        if (err) {
                            res.send({
                                status: "failure",
                                message: "fail to update profile",
                                data: err,
                            });
                        } else {
                            fs.rename(source_file, dest_file, function (err) {
                                if (err) {
                                    res.send({
                                        status: "failure",
                                        message: "fail to update profile",
                                        data: err,
                                    });
                                } else {
                                    updateDB(regID);
                                }
                            });
                        }
                    });
                }
            });
        } else {
            updateDB(regID);
        }
    } else {
        res.send({ status: "failure", message: "Please log in", data: {} });
    }
});

// deactivating user account
app.post('/deactiveUser', urlencodedParser, function (req, res) {
    if (req.session.loggedIn) {
        const regID = req.session.data.reg_id;
        const userinfo = "SELECT * from `registered_user` where reg_id = " + regID;
        dbconnection.query(userinfo, (err, data) => {
            if (err || !(data[0] && data[0].reg_id)) {
                res.send({ status: "failure", message: "Unable to find user", data: {} });
            } else {
                const updateSQL = 'UPDATE `registered_user` SET is_active = 0 WHERE reg_id = ' + regID;
                dbconnection.query(updateSQL, (err, result) => {
                    if (err) {
                        res.send({ status: "failure", message: 'Fail to deactive user', data: {} });
                    } else {
                        req.session.loggedIn = false;
                        req.session.data = {};
                        req.session.destroy((err) => { });
                        res.send({ status: "success", message: 'success', data: {} });
                    }
                });
            }
        });
    } else {
        res.send({ status: "failure", message: 'Please log in ', data: {} });
    }
})

//delete user account
app.post('/deleteUser', urlencodedParser, function (req, res) {
    if (req.session.loggedIn) {
        const regID = req.session.data.reg_id;
        const userinfo = "SELECT * from `registered_user` where reg_id = " + regID;
        dbconnection.query(userinfo, (err, data) => {
            if (err || !(data[0] && data[0].reg_id)) {
                res.send({ status: "failure", message: "Unable to find user", data: {} });
            } else {
                const updateSQL = 'DELETE FROM `registered_user` WHERE reg_id = ' + regID;
                // console.log(updateSQL);
                dbconnection.query(updateSQL, (err, result) => {
                    if (err) {
                        res.send({ status: "failure", message: 'fail to delete user', data: {} });
                    } else {

                        req.session.loggedIn = false;
                        req.session.data = {};
                        req.session.destroy((err) => { });
                        res.send({ status: "success", message: 'success', data: {} });
                    }
                });
            }
        });
    } else {
        res.send({ status: "failure", message: 'Please log in ', data: {} });
    }
})

//vidhi - send workout_request
app.post('/sendWorkoutRequest', urlencodedParser, function (req, res) {
    if (req.session.loggedIn) {
        var to_user_id = req.body.to_user_id;
        var from_user_id = req.session.data.user_id;
        var msg = req.body.msg;

        var sql = 'INSERT INTO `workout_request` (from_user_id, to_user_id) VALUES (' + from_user_id + ',' + to_user_id + ')';
        var sql1 = 'INSERT INTO `user_messages` (to_user_id, from_user_id, message) VALUES (' + to_user_id + ',' + from_user_id + ', "' + msg + '")';
        var sql2 = 'UPDATE `check_new_message` SET is_new_msg = 1 where user_id = ' + to_user_id;
        dbconnection.query(sql, (err, result) => {
            if (err) {
                res.send({ status: "failure", message: err, data: {} });
            } else {
                dbconnection.query(sql1, (err1, result1) => {
                    if (err1) {
                        res.send({ status: "failure", message: err1, data: {} });
                    } else {
                        dbconnection.query(sql2, (err2, result1) => {
                            if (err2) {
                                res.send({ status: "failure", message: err2, data: {} });
                            } else {
                                res.send({ status: "success", message: 'request sent', data: {} });
                            }
                        });
                    }
                });
            }
        });
    } else {
        res.send({ status: "failure", message: 'Please log in ', data: {} });
    }
});

//get workout_request on profile page
app.post('/getWorkoutRequest', urlencodedParser, function (req, res) {
    if (req.session.loggedIn) {
        const regID = req.session.data.user_id;
        const sql = "SELECT t1.workout_id, t1.from_user_id, t1.to_user_id, t1.date_sent, t2.name from `workout_request` t1 LEFT JOIN `registered_user` t2 ON t1.from_user_id = t2.user_id WHERE to_user_id = " + regID + " AND request_status = 0";
        dbconnection.query(sql, (err, data) => {
            console.log(err);
            if (err) {
                res.send({ status: "failure", message: "unable to find workout_request", data: {} });
            } else {
                res.send({ status: "success", message: 'success', data: data });
            }
        });
    } else {
        res.send({ status: "failure", message: "Please log in", data: {} });
    }
})

// load matching page
app.get('/findAbuddy', function (req, res) {
    if (req.session.loggedIn) {
        data = req.session.data;
        res.render(path.join(__dirname, './public/html/findAbuddy.ejs'), data);
    } else {
        res.redirect('/');
    }
});

//vidhi - get workoutbuddy recommendation
app.post('/getWorkOutBuddies', urlencodedParser, function (req, res) {
    if (req.session.loggedIn) {

        var user_id = req.session.data.user_id;
        var sql = '';

        sql = 'SELECT `user_activities`.user_id, `registered_user`.reg_id, name, zip_code, gender, birthdate, activity_type from `user_activities` join `registered_user` on  `user_activities`.user_id = `registered_user`.user_id where `user_activities`.user_id != ' + user_id + '  and `registered_user`.is_active = 1 ';
        if (req.body.zip_code) {
            sql += ' and zip_code = "' + req.body.zip_code + '"';
        }
        if (req.body.gender) {
            sql += ' and gender = "' + req.body.gender + '"';
        }
        if (req.body.activity_type) {
            sql += ' and user_activities IN (' + req.body.activity_type + ')';
        } else if (req.body.zip_code || req.body.gender) {

        } else {
            sql += ' and user_activities IN (SELECT user_activities from `user_activities` where user_id = ' + user_id + ' )';
        }
        sql += ' group by reg_id';

        // console.log(sql);
        dbconnection.query(sql, (err, result) => {
            if (err) {
                res.send({ status: "failure", message: err, data: {} });
            } else {
                if (result && result.length > 0) {
                    var data = {
                        'data': result
                    }
                    res.send({ status: "success", message: "data found", data: data });
                } else {
                    res.send({ status: "success", message: "No data", data: {} });
                }
            }
        });
    } else {
        res.send({ status: "failure", message: "Please log in", data: {} });
    }
});

//Vidhi - loading user matches data
app.post('/loadMatches', urlencodedParser, function (req, res) {
    if (req.session.loggedIn) {
        var user_id = req.session.data.user_id;
        var sql = 'SELECT workout_id, to_user_id, request_status, date_sent, date_updates, name from `workout_request` join `registered_user` on `workout_request`.to_user_id = `registered_user`.user_id where from_user_id = ' + user_id + ' and request_status != 3 and `registered_user`.is_active = 1 order by date_sent desc';
        dbconnection.query(sql, (err, result) => {
            if (err) {
                res.send({ status: "failure", message: err, data: {} });
            } else {
                var data = {}
                if (result && result.length > 0) {
                    data['sent'] = result;
                }
                var sql2 = 'SELECT workout_id, from_user_id, request_status, date_sent, date_updates, name from `workout_request` join `registered_user` on `workout_request`.from_user_id = `registered_user`.user_id where to_user_id = ' + user_id + ' and request_status != 2 and `registered_user`.is_active = 1 order by date_sent desc';
                dbconnection.query(sql2, (err2, result2) => {
                    if (result2 && result2.length > 0) {
                        data['received'] = result2;
                    }
                    res.send({ status: "success", message: 'success', data: data });
                });
            }
        });
    } else {
        res.send({ status: "failure", message: "Please log in", data: {} });
    }
});

//vidhi - update user request status
app.post('/updateRequestStatus', urlencodedParser, function (req, res) {
    if (req.session.loggedIn) {
        var id = req.body.id;
        var status = req.body.status;
        var sql = 'UPDATE `workout_request` SET `request_status` = ' + status + ', date_updates = CURRENT_TIMESTAMP() WHERE `workout_id` = ' + id;
        dbconnection.query(sql, (err, result) => {
            if (err) {
                res.send({ status: "failure", message: err, data: {} });
            } else {
                res.send({ status: "success", message: "Status Updates", data: {} });
            }
        });
    } else {
        res.send({ status: "failure", message: "Please log in", data: {} });
    }
});

//vidhi - accept workout_request
app.post('/acceptWorkoutRequest', urlencodedParser, function (req, res) {
    if (req.session.loggedIn) {
        var to_user_id = req.body.to_user_id;
        var from_user_id = req.session.data.user_id;
        var msg = req.body.msg;
        var tabid = req.body.tabid;

        var sql = 'UPDATE `workout_request` SET request_status = 1 where workout_id = ' + tabid;
        var sql1 = 'INSERT INTO `user_messages` (to_user_id, from_user_id, message) VALUES (' + to_user_id + ',' + from_user_id + ', "' + msg + '")';
        var sql2 = 'UPDATE `check_new_message` SET is_new_msg = 1 where user_id = ' + to_user_id;
        dbconnection.query(sql, (err, result) => {
            if (err) {
                res.send({ status: "failure", message: err, data: {} });
            } else {
                dbconnection.query(sql1, (err1, result1) => {
                    if (err1) {
                        res.send({ status: "failure", message: err1, data: {} });
                    } else {
                        dbconnection.query(sql2, (err2, result1) => {
                            if (err2) {
                                res.send({ status: "failure", message: err2, data: {} });
                            } else {
                                res.send({ status: "success", message: 'request accepted', data: {} });
                            }
                        });
                    }
                });
            }
        });
    } else {
        res.send({ status: "failure", message: "Please log in", data: {} });
    }
});

//vidhi - fetch user info
app.post('/fetchUserInfo', urlencodedParser, function (req, res) {
    if (req.session.loggedIn) {
        var id = req.body.id;
        var sql = 'SELECT * from `registered_user` where is_active = 1 and user_id = ' + id;
        dbconnection.query(sql, (err, result) => {
            if (err) {
                res.send({ status: "failure", message: err, data: {} });
            } else {
                res.send({ status: "success", message: "Status Updates", data: result });
            }
        });
    } else {
        res.send({ status: "failure", message: "Please log in", data: {} });
    }
});

//vidhi - api to get new messages for a user
app.post('/getNewMessagesDiv', urlencodedParser, function (req, res) {
    if (req.session.loggedIn) {
        var user = req.session.data.user_id;
        var fromuser = req.body.fromid;
        var sql = "Select * from user_messages where to_user_id IN (" + user + "," + fromuser + ") and from_user_id IN (" + user + "," + fromuser + ") order by date_updated asc;";
        dbconnection.query(sql, (err, result) => {
            if (err) {
                res.send({ status: "failure", message: err, data: {} });
            } else {
                dbconnection.query('UPDATE `user_messages` SET `is_read` = 1 WHERE `to_user_id` = ' + user + ' AND `from_user_id` = ' + fromuser, (e, r) => { });
                res.send({ status: "success", message: 'success', data: result, userid: user });
            }
        });
    } else {
        res.send({ status: "failure", message: "Please log in", data: {} });
    }
});

//vidhi - api to check for new messages for a user
app.post('/checkNewMessage', urlencodedParser, function (req, res) {
    if (req.session.loggedIn) {
        var user = req.session.data.user_id;
        var sql = "Select is_new_msg from check_new_message where user_id = " + user;
        dbconnection.query(sql, (err, result) => {
            if (err) {
                res.send({ status: "failure", message: err, data: {} });
            } else {
                dbconnection.query('UPDATE `check_new_message` SET `is_new_msg` = 0 WHERE `user_id` = ' + user, (e, r) => { });
                res.send({ status: "success", message: err, data: result[0] });
            }
        });
    } else {
        res.send({ status: "failure", message: "Please log in", data: {} });
    }
});

//vidhi - api to get new messages for a side bar
app.post('/getNewMessagesSide', urlencodedParser, function (req, res) {
    if (req.session.loggedIn) {
        var user = req.session.data.user_id;
        var sql = "SELECT name, from_user_id , max(date_updated) as 'date_updated' FROM user_messages join `registered_user` on from_user_id = `registered_user`.user_id where to_user_id = " + user + " and `registered_user`.is_active = 1 group by  from_user_id, name";
        dbconnection.query(sql, (err, result) => {
            var data = {};
            if (result && result.length > 0) {
                data['from'] = result;
            };
            var sql2 = "SELECT name, to_user_id , max(date_updated) as 'date_updated' FROM user_messages join `registered_user` on to_user_id = `registered_user`.user_id where from_user_id = " + user + " and `registered_user`.is_active = 1 group by  to_user_id, name";
            dbconnection.query(sql2, (err2, result2) => {
                if (err2) {
                    res.send({ status: "failure", message: err2, data: {} });
                } else {
                    if (result && result2.length > 0) {
                        data['to'] = result2;
                    };
                    if (data) {
                        data['user_id'] = user;
                        res.send({ status: "success", message: 'success', data: data });
                    } else {
                        res.send({ status: "faliure", message: 'no data', data: {} });
                    }
                }
            });
        });
    } else {
        res.send({ status: "failure", message: "Please log in", data: {} });
    }
});

//vidhi - api to send user message
app.post('/sendUserMessage', urlencodedParser, function (req, res) {
    if (req.session.loggedIn) {
        var to_user_id = req.body.to_user_id;
        var from_user_id = req.session.data.user_id;
        var message = req.body.message;
        var sql = 'INSERT INTO `user_messages` (`to_user_id`, `from_user_id`, `message`, `is_read`) VALUES (' + to_user_id + ', ' + from_user_id + ', "' + message + '", 0)';
        dbconnection.query(sql, (err, result) => {
            if (err) {
                res.send({ status: "failure", message: err, data: {} });
            } else {
                var sql2 = 'UPDATE `check_new_message` SET `is_new_msg` = 1 WHERE (`user_id` = ' + to_user_id + ')';
                dbconnection.query(sql2, (err2, result2) => { });
                res.send({ status: "success", message: 'success', data: {} });
            }
        });
    } else {
        res.send({ status: "failure", message: "Please log in", data: {} });
    }
});

// load events page
app.get('/events', async function (req, res) {
    if (req.session.loggedIn) {
        let data = {};
        data['user_id'] = req.session.data.user_id;
        let eventsinfo = await getEventsInfo({ myevents: false, createdby: req.session.data.user_id });
        data['eventsinfo'] = eventsinfo.data;
        res.render(path.join(__dirname, './public/html/events.ejs'), data);
    } else {
        res.redirect('/');
    }
});

// create new events
app.get('/createEvents', function (req, res) {
    if (req.session.loggedIn) {
        let data = req.session.data;
        res.render(path.join(__dirname, './public/html/createEvents.ejs'), data);
    } else {
        res.redirect('/');
    }
});

//Saving new event info
app.post('/saveEvent', urlencodedParser, function (req, res) {
    if (req.session.loggedIn) {
        var data = {
            title: req.body.title,
            description: req.body.description,
            address: req.body.address,
            zipcode: req.body.zipcode,
            from_date: req.body.date,
            to_date: req.body.date,
            start_time: req.body.startTime,
            end_time: req.body.endTime,
            user_id: req.session.data.user_id
        };
        var sql = "INSERT INTO `events`(user_id, title, description, address, zipcode, from_date, to_date, start_time, end_time) VALUES (" + data.user_id + ", '" + data.title + "','" + data.description + "','" + data.address + "','" + data.zipcode + "','" + data.from_date + "','" + data.to_date + "','" + data.start_time + "','" + data.end_time + "')";
        dbconnection.query(sql, (err, result) => {
            if (err) {
                res.send({ status: "failure", message: err, data: {} });
            } else {
                res.send({ status: "success", message: err, data: {} });
            }
        });
    } else {
        res.send({ status: "failure", message: "Please log in", data: {} });
    }
});

// view event profile
app.get('/eventProfile', function (req, res) {
    if (req.session.loggedIn) {
        let event_id = req.query.eventId;
        let user_id = req.session.data.user_id;
        var sql = `SELECT * from events where event_id = ${event_id} and is_active = 1`;
        dbconnection.query(sql, (err, result) => {
            if (err) {
                res.render(path.join(__dirname, './public/html/eventProfile.ejs'), { status: 'failure', message: err });
            } else {
                if (result[0]) {
                    var q1 = `SELECT is_joined from join_leave_event where user_id = ${user_id} and event_id = ${event_id}`;
                    dbconnection.query(q1, (err1, result1) => {
                        if (err1) {
                            res.render(path.join(__dirname, './public/html/eventProfile.ejs'), { status: 'failure', message: err1 });
                        } else {
                            var data = {
                                user_id: user_id,
                                eventInfo: result[0],
                                userInfo: result1[0]
                            }
                            res.render(path.join(__dirname, './public/html/eventProfile.ejs'), { status: 'success', message: '', data: data });
                        }
                    });
                } else {
                    res.render(path.join(__dirname, './public/html/eventProfile.ejs'), { status: "failure", message: "Event does not exists", data: {} });
                }
            }
        });
    } else {
        res.redirect('/');
    }
});

//join and leave events 
app.post('/joinDisjoinEvent', urlencodedParser, function (req, res) {
    if (req.session.loggedIn) {
        var user_id = req.session.data.user_id;
        var event_id = req.body.event_id;
        var acttye = req.body.acttye;
        var is_joined = req.body.is_joined;
        var sql = '';
        if (acttye == "ins") {
            sql = 'INSERT INTO `join_leave_event` (user_id, event_id, is_joined, date_joined) VALUES (' + user_id + ',' + event_id + ', ' + is_joined + ', CURRENT_TIMESTAMP())';
        } else {
            sql = 'UPDATE `join_leave_event` SET is_joined = ' + is_joined + ', date_disjoin = CURRENT_TIMESTAMP() where user_id = ' + user_id + ' and event_id = ' + event_id;
        }
        // console.log(sql);
        dbconnection.query(sql, (err, result) => {
            if (err) {
                res.send({ status: "failure", message: err, data: {} })
            } else {
                res.send({ status: "success", message: 'Event Joined/Disjoined', data: {} });
            }
        });
    } else {
        res.send({ status: "failure", message: "Please log in", data: {} })

    }

});

//view my events page
app.get('/myEvents', async function (req, res) {
    if (req.session.loggedIn) {
        let data = {};
        data['user_id'] = req.session.data.user_id;
        let eventsinfo = await getEventsInfo({ myevents: true, createdby: req.session.data.user_id });
        data['eventsinfo'] = eventsinfo.data;
        res.render(path.join(__dirname, './public/html/myEvents.ejs'), data);
    } else {
        res.redirect('/');
    }
});

// delete my events
app.post('/deleteEvent', urlencodedParser, function (req, res) {
    if (req.session.loggedIn) {
        var user = req.session.data.user_id;
        var eveid = req.body.eveid;
        if (eveid && user) {
            var q1 = `DELETE from events where user_id = ${user} and event_id = ${eveid}`;
            dbconnection.query(q1, (err1, result1) => {
                if (err1) {
                    res.send({ status: "failure", message: err1, data: {} });
                } else {
                    res.send({ status: "success", message: err1, data: {} });
                }
            });
        } else {
            res.send({ status: "failure", message: "Missing information to delete event", data: {} });
        }
    } else {
        res.send({ status: "failure", message: 'Please log in', data: {} });
    }
});

// load events page
app.post('/getFilterEvents', urlencodedParser, async function (req, res) {
    if (req.session.loggedIn) {
        let data = {};
        let params = { myevents: false, createdby: req.session.data.user_id };
        if (req.body.zip_code && req.body.zip_code != "") {
            params = { myevents: false, zipcode: req.body.zip_code, createdby: req.session.data.user_id };
        }
        let eventsinfo = await getEventsInfo(params);
        data['user_id'] = req.session.data.user_id;
        data['eventsinfo'] = eventsinfo.data;
        res.send({ status: "success", message: "data", data: data });
    } else {
        res.send({ status: "failure", message: "Please log in", data: {} });
    }
});

// load logout page
app.get('/logOut', function (req, res) {
    req.session.loggedIn = false;
    req.session.data = {};
    req.session.destroy((err) => { });
    res.redirect('/');
});

//get events from common searchbar
app.post('/getEvents', urlencodedParser, function (req, res) {
    let keyword = req.body.keyword;
    var sql = "SELECT * FROM `events` WHERE from_date > CURRENT_TIMESTAMP() and is_active = 1 and `description` LIKE '%" + keyword + "%'";
    dbconnection.query(sql, (err, result) => {
        if (err) {
            res.send({ status: "failure", message: err, data: {} });
        } else {
            res.send({ status: "success", message: err, data: result });
        }
    });
});

// load registration page
app.get('/adminLogin', function (req, res) {
    res.sendFile(path.join(__dirname, './public/html/adminLogin.html'));
});

//Login to the app
app.post('/adminLoginAPI', urlencodedParser, function (req, res) {
    //get username and password
    let email = req.body.email;
    let password = md5(req.body.password);
    if (email == "admin@sfsu.test" && password == "39f3fe61989747afed312c7b7465e004") {
        req.session.loggedIn = true;
        req.session.data = {
            user_name: 'Vidhi - Admin',
            user_id: 'adminV951'
        };
        res.send({ status: "success", message: "Login succesful", data: {} });
    } else {
        res.send({ status: "failure", message: "Incorrect username or password", data: {} });
    }
});

// load registration page
app.get('/adminHome', function (req, res) {
    if (req.session.loggedIn) {
        let data = req.session.data;
        res.render(path.join(__dirname, './public/html/adminHome.ejs'), data);
    } else {
        res.redirect('/adminLogin');
    }

});

//get unapproved events for admin
app.post('/getEventsDataAdmin', urlencodedParser, function (req, res) {
    if (req.session.loggedIn) {
        var sql = 'SELECT * from events where is_active = 0';
        // console.log(sql);
        dbconnection.query(sql, (err, result) => {
            if (err) {
                res.send({ status: "failure", message: err, data: {} });
            } else {
                if (result) {
                    res.send({ status: "success", message: err, data: result });
                } else {
                    res.send({ status: "failure", message: "No data", data: {} });
                }
            }
        });
    } else {
        res.send({ status: "failure", message: "Please log in", data: {} });
    }
});

// accept/reject events by admin
app.post('/updateEventStatusAdmin', urlencodedParser, function (req, res) {
    if (req.session.loggedIn) {
        var event_id = req.body.event_id;
        let is_active = req.body.set;
        const updateSQL = 'UPDATE `events` SET is_active =  ' + is_active + ' WHERE event_id = ' + event_id;

        dbconnection.query(updateSQL, (err, result) => {
            if (err) {
                res.send({ status: "failure", message: err, data: {} });
            } else {
                res.send({ status: "success", message: "Event status updated!", data: {} });
            }
        });
    } else {
        res.send({ status: "failure", message: "Please log in", data: {} });
    }
});

// admin logout page
app.get('/adminLogOut', function (req, res) {
    req.session.loggedIn = false;
    req.session.data = {};
    req.session.destroy((err) => { });
    res.redirect('/adminLogin');
});

app.listen(3000, console.log("Server running on 3000 - " + new Date().toString()));