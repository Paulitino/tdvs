const express = require('express');
var session = require('express-session')
const expressHandlebars = require('express-handlebars');
const bodyParser = require('body-parser');
const app = express();
const bcrypt = require('bcrypt');
const db = require('./db')
const saltRounds =10;


app.use(bodyParser.urlencoded({extended: false}))
app.use(session({secret: "chocapic",   resave: false, saveUninitialized: true}))


app.engine('hbs', expressHandlebars({
    defaultLayout: 'main.hbs',
}));

app.get('/', function(request, response) {
    if (request.session.connected) { 
        const username = request.session.user
        const model = {
            username: username,
        }
        response.render("home.hbs", model)
    } else {
        response.render("home.hbs")
    }
});

app.get('/login', function(request, response) {
    response.render("login.hbs")
});

app.post('/login', function(request, response) {
    const username = request.body.userName
    const askPassword = request.body.password
    errors = []

    if (request.session.connected == true) {
        response.redirect('/account')
    } else {
        db.loginRequest(username, function(password) {
            if (password == "error") {

                const model = {
                    errors: "username or password invalid",
                }

                response.render("login.hbs", model)
            } else if(password == "") {
                errors = ["username or password invalid"]
                const model = {
                    errors: errors,
                }

                response.render("login.hbs", model)
            } else {
                bcrypt.compare(askPassword, password[0].password, function(err, res) {
                    if (err) {

                        response.render("login.hbs")
                    } else {
                        if (res == false) {
                            errors = ["username or password invalid"]
                            const model = {
                                errors: errors,
                            }
            
                            response.render("login.hbs", model)
                        } else if(res == true) {
                            session = request.session;
                            session.user = username;
                            session.connected = true;
                            
                            response.redirect('/account')
                        }
                    }
                })
            }
        })
    }
});

app.get('/logout', function(request, response) {
    request.session.destroy(function(err) {
        if (err) {
            response.status(500).end()
        } else {
            response.redirect('/login');
        }
    })
})

app.get('/accounts/subscribe', function(request, response) {
    const model = {
        username: "",
        mail: "",
        password: "",
        birthday: "",
        city: "",
        error: []
    }

    response.render("subscribe.hbs", model)
});

app.post('/accounts/subscribe', function(request, response) {
    const username = request.body.userName
    const password = request.body.password
    const passwordConfirm = request.body.passwordConfirm
    const birthday = request.body.birthday
    const city = request.body.city
    error = []

    if (password != passwordConfirm) {
        errors = ["Password and confirmation password are not the same"]
        const model = {
            errors: errors,
            userName: username,
            date: birthday,
            city: city
        }

        response.render("subscribe.hbs", model)
    } else if (password == "") {
        errors = ["username or password invalid"]
        const model = {
            errors: errors,
            userName: username,
            date: birthday,
            city: city
        }

        response.render("subscribe.hbs", model)
    } else {
        const values2 = username

        db.getAccountByUsername(values2, function(acc) {
            if (acc.length != 0) {
                errors = ["username already exists"]
                const model = {
                    errors: errors,
                    userName: username,
                    date: birthday,
                    city: city
                }
    
                response.render("subscribe.hbs", model)
            } else if (acc == "") {
                bcrypt.hash(password, saltRounds, function(err, hash) {
                    if (err) {
                        response.redirect("/accounts/subscribe")
                    } else {
        
                        const hashpw = hash;
                        db.subscribeRequest(username, hashpw, birthday, city, function (done) {
                            if (done == "error") {
                                response.status(500).end()
                            } else {
                                response.redirect("/login")
                            }
                        })
                    }
                })
            }
        })
    }
});

app.get('/account/modify', function(request, response) {
    const user = request.session.user;

    db.getAccountByUsername(user, function(done) {
        if (done == "error") {
            response.status(500).end()
        } else {
            const model = {
                username: done[0].username,
                date: done[0].birthday,
                city: done[0].city,
                error: []
            }
        
            response.render("modifyAccount.hbs", model)
        }
    });
});

app.post('/account/modify', function(request, response) {
    const username = request.body.username
    const oldUsername = request.session.user
    const birthday = request.body.birthday
    const city = request.body.city
    error = []

    db.getAccountByUsername(username, function(acc) {
        if (acc.length != 0 && acc[0].username != request.session.user) {
            errors = ["username already exists"]
            const model = {
                errors: errors,
                userName: username,
                date: birthday,
                city: city
            }

            response.render("modifyAccount.hbs", model)
        } else if (acc.length == 0) {
            db.updateUserByUsername(username, birthday, city, oldUsername, function (done) {
                if (done == "error") {
                    response.status(500).end()
                } else {
                    db.updateTrainingByUsername(username, oldUsername, function(done) {
                        if (done == "error") {
                            response.status(500).end()
                        } else {
                            db.updateWeightByUsername(username, oldUsername, function(done) {
                                if (done == "error") {
                                    response.status(500).end()
                                } else {
                                    request.session.user = username;
                                    response.redirect("/account")
                                }
                            });
                        }
                    });
                }
            });
        }
    });
});

app.get('/modifyPassword', function(request, response) {
    if (!request.session.connected) {
        response.redirect("/login")
    } else {
        response.render("modifyPassword.hbs")
    }
});

app.post('/modifyPassword', function(request, response) {
    const user = request.session.user;
    const oldPassword = request.body.oldPassword;
    const newPassword = request.body.newPassword;
    const newPasswordConfirm = request.body.newPasswordConfirm;

    if (newPassword != newPasswordConfirm) {
        errors = ["Password and confirmation password are not the same"]
        const model = {
            errors: errors
        }

        response.render("modifyPassword.hbs", model)
    } else {
        db.getAccountByUsername(user, function(done) {
            if (done == "error") {
                response.status(500).end()
            } else {
                bcrypt.compare(oldPassword, done[0].password, function(error, res) {
                    if (error) {
                        response.render("modifyPassword.hbs")
                    } else if (res == true) {
                        bcrypt.hash(newPassword, saltRounds, function(error, hash) {
                            if (error) {
                                response.redirect("/modifyPassword")
                            } else {
                                const hashpw = hash;

                                db.updatePasswordByUsername(user, hashpw, function (done) {
                                    if (done == "error") {
                                        response.status(500).end()
                                    } else {
                                        response.redirect("/account")
                                    }
                                })
                            }
                        })
                    } else {
                        errors = ["Password doesn't correspond to the old one"]
                        const model = {
                            errors: errors
                        }

                        response.render("modifyPassword.hbs", model)
                    }
                });
            }
        });
    }
});

app.get('/account/', function(request, response) {
    if (!request.session.connected) {
        response.redirect("/login")
    } else {
        const user = request.session.user
        db.getAccountByUsername(user, function(done) {
            if (done == "error") {
                response.status(500).end()
            } else {
                const allAccounts = done

                db.getTrainingsByUsername(user, function(done) {
                    if (done == "error") {
                        response.render("account.hbs");
                    } else {
                        const allTrainings = done;

                        db.getWeightsByUsername(user, function(done2) {
                            if (done2 == "error") {
                                response.status(500).end()
                            } else {

                                const allWeights = done2;
                                const model = {
                                    username: allAccounts[0].username,
                                    birthday: allAccounts[0].birthday,
                                    city: allAccounts[0].city,
                                    allTrainings: allTrainings,
                                    allWeights: allWeights
                                }
                                response.render("account.hbs", model);
                            }
                        })
                    }        
                })
            }
        })
    }
});

app.get('/accounts', function(request, response) {
    db.getAllAccounts(function(done) {
        const username = request.session.user
        if (done == "error") {
            response.status(500).end()
        } else {
            const allAccounts = done
            const model = {
                username: username,
                allAccounts: allAccounts,
            }
            response.render("accounts.hbs", model);
        }
    })
});

app.get('/newTraining', function(request, response) {
    if (!request.session.connected) {
        response.redirect("login")
    } else {
        const model = {
            username: request.session.user,
            trainingname: "",
            description: "",
            startday: "",
            endday: "",
            error: []
        }
        response.render("newTraining.hbs", model)
    }
})

app.post('/newTraining', function(request, response) {
    const username = request.session.user;
    const description = request.body.description;
    const start = request.body.start;
    const stop = request.body.stop;

    db.newTrainingRequest(username, description, start, stop, function(done) {
        if (done == "error") {
            response.status(500).end()
        } else {
            response.redirect('/account')
        }
    })
})

app.get('/activities/:username', function(request, response) {
    if (request.session.connected) {
        const username = request.params.username

        db.getTrainingsByUsername(username, function(done) {
            if (done == "error") {
                response.status(500).end()
            } else {
                const allTrainings = done
                db.getWeightsByUsername(username, function(done) {
                    if (done == "error") {
                        response.status(500).end()
                    } else {
                        const allWeights = done;
                        const model = {
                            username: username,
                            allTrainings: allTrainings,
                            allWeights: allWeights
                        }
                        response.render("activities.hbs", model);
                    }
                })
            }
        })
    }
})

app.get('/account/activities/delete/:id', function(request, response) {
    const id = request.params.id

    db.deleteTraining(id, function(done) {
        if (done == "error") {
            response.status(500).end()
        } else {
            response.redirect("/account/")
        }
    })
})

app.get('/account/activities/modify/:id', function(request, response) {
    if (!request.session.connected) {
        response.redirect("login")
    } else {
        const id = request.params.id

        db.getTrainingById(id, function(done) {
            if (done == "error") {
                response.status(500).end()
            } else {
                const model = {
                    username: request.session.user,
                    id:done[0].id,
                    description: done[0].description,
                    start: done[0].start,
                    stop: done[0].stop,
                    error: []
                }
                response.render("modifyTraining.hbs", model)
            }
        })
    }
})

app.post('/modifyTrainings', function(request, response) {
    const id = request.body.id;
    const description = request.body.description;
    const start = request.body.start;
    const stop = request.body.stop;

    db.updateTrainingById(id, description, start, stop, function(done) {
        if (done == "error") {
            response.status(500).end()
        } else {
            response.redirect("/account")
        }
    })
})

app.get('/newWeight', function(request, response) {
    if (!request.session.connected) {
        response.redirect("login")
    } else {
        const currentDate = new Date().toISOString().substr(0, 10);

        const model = {
            username: request.session.user,
            date: currentDate,
            error: []
        }
        response.render("newWeight.hbs", model)
    }
})

app.post('/newWeight', function(request, response) {
    const username = request.session.user;
    const date = request.body.date;
    const weight = request.body.weight;

    db.newWeightRequest(username, date, weight, function(done) {
        if (done == "error") {
            response.status(500).end()
        } else {
            response.redirect('/account')
        }
    })
})

app.get('/account/weights/delete/:id', function(request, response) {
    const id = request.params.id

    db.deleteWeight(id, function(done) {
        if (done == "error") {
            response.status(500).end()
        } else {
            response.redirect("/account/")
        }
    })
})

app.get('/account/weights/modify/:id', function(request, response) {
    if (!request.session.connected) {
        response.redirect("login")
    } else {
        const id = request.params.id

        db.getWeightById(id, function(done) {
            if (done == "error") {
                response.status(500).end()
            } else {
                const model = {
                    username: request.session.user,
                    id:done[0].id,
                    date: done[0].time,
                    weight: done[0].weight,
                    error: []
                }
                response.render("modifyWeight.hbs", model)
            }
        })
    }
})

app.post('/modifyWeights', function(request, response) {
    const id = request.body.id;
    const date = request.body.date;
    const weight = request.body.weight;

    db.updateWeightById(id, weight, date, function(done) {
        if (done == "error") {
            response.status(500).end()
        } else {
            response.redirect("/account/")
        }
    })
})

app.get('/about', function(request, response) {
    if (request.session.connected) {
        const username = request.session.user
        const model = {
            username: username,
        }
        response.render("about.hbs", model);
    } else {
        response.render("about.hbs");
    }
});

app.get('/contact', function(request, response) {
    if (request.session.connected) { 
        const username = request.session.user
        const model = {
            username: username,
        }
        response.render("contact.hbs", model);
    } else {
        response.render("contact.hbs");
    }
});

// REST API
app.get('/api/accounts', db.getAllAccountsApi);

app.post('/api/login', db.loginApi);

app.post('/api/weights', db.newWeightRequestApi);

app.post('/api/training-activities', db.newTrainingRequestApi);

app.post('/api/newAccounts', db.newAccountApi);

app.listen(3000)